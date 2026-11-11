/**
 * Three.js 3D 实验场景管理器与物理几何图元工具库
 * 支持完备的显存回收、自适应轨道相机控制（含内置回退控制器）、三维晶面切割、螺旋弹簧、矢量箭头与高清悬浮标签
 */
window.SceneManager = (function () {
  let container = null;
  let scene = null;
  let camera = null;
  let renderer = null;
  let controls = null;
  let simGroup = null;
  let axesGroup = null;
  let showAxes = true;
  let autoRotate = false;
  let paused = false;
  let activeSim = null;
  let clock = null;
  let defaultCamPos = { x: 6, y: 4.8, z: 7.5 };
  let defaultTarget = { x: 0, y: 0, z: 0 };

  // Built-in fallback OrbitController if THREE.OrbitControls is unavailable
  function createFallbackControls(cam, domElement) {
    const state = {
      target: new THREE.Vector3(0, 0, 0),
      spherical: new THREE.Spherical(),
      isDragging: false,
      isPanning: false,
      prevX: 0,
      prevY: 0,
      autoRotate: false,
      autoRotateSpeed: 1.0,
      enableDamping: true
    };

    function syncFromCamera() {
      const offset = cam.position.clone().sub(state.target);
      state.spherical.setFromVector3(offset);
    }
    syncFromCamera();

    function applyToCamera() {
      state.spherical.phi = Math.max(0.06, Math.min(Math.PI - 0.06, state.spherical.phi));
      state.spherical.radius = Math.max(1.5, Math.min(60, state.spherical.radius));
      const offset = new THREE.Vector3().setFromSpherical(state.spherical);
      cam.position.copy(state.target).add(offset);
      cam.lookAt(state.target);
    }

    domElement.addEventListener("pointerdown", (e) => {
      state.isDragging = true;
      state.isPanning = e.button === 2 || e.shiftKey;
      state.prevX = e.clientX;
      state.prevY = e.clientY;
    });

    window.addEventListener("pointermove", (e) => {
      if (!state.isDragging) return;
      const dx = e.clientX - state.prevX;
      const dy = e.clientY - state.prevY;
      state.prevX = e.clientX;
      state.prevY = e.clientY;
      if (state.isPanning) {
        const panScale = state.spherical.radius * 0.0015;
        const right = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 0).multiplyScalar(-dx * panScale);
        const up = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 1).multiplyScalar(dy * panScale);
        state.target.add(right).add(up);
      } else {
        state.spherical.theta -= dx * 0.007;
        state.spherical.phi -= dy * 0.007;
      }
      applyToCamera();
    });

    window.addEventListener("pointerup", () => {
      state.isDragging = false;
    });

    domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    domElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.09 : 0.92;
      state.spherical.radius *= factor;
      applyToCamera();
    }, { passive: false });

    return {
      target: state.target,
      get autoRotate() { return state.autoRotate; },
      set autoRotate(v) { state.autoRotate = v; },
      set autoRotateSpeed(v) { state.autoRotateSpeed = v; },
      update() {
        syncFromCamera();
        if (state.autoRotate && !state.isDragging) {
          state.spherical.theta += 0.004 * state.autoRotateSpeed;
          applyToCamera();
        } else {
          cam.lookAt(state.target);
        }
      },
      resetSync: syncFromCamera
    };
  }

  function init(domId) {
    container = document.getElementById(domId);
    scene = new THREE.Scene();

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;

    camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 250);
    camera.position.set(defaultCamPos.x, defaultCamPos.y, defaultCamPos.z);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 1.5;
      controls.maxDistance = 65;
      controls.autoRotateSpeed = 1.4;
    } else {
      controls = createFallbackControls(camera, renderer.domElement);
    }

    // Studio Scientific Lighting
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.72);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.88);
    keyLight.position.set(10, 14, 12);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.45);
    rimLight.position.set(-10, -6, -10);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xa78bfa, 0.28, 50);
    fillLight.position.set(-6, 8, 6);
    scene.add(fillLight);

    // Reference Coordinate Axes Group
    axesGroup = new THREE.Group();
    buildReferenceAxes();
    scene.add(axesGroup);

    // Active Simulation Group
    simGroup = new THREE.Group();
    scene.add(simGroup);

    clock = new THREE.Clock();

    window.addEventListener("resize", handleResize);
    animate();
  }

  function buildReferenceAxes() {
    while (axesGroup.children.length) {
      axesGroup.remove(axesGroup.children[0]);
    }
    const len = 3.2;
    const xArr = createArrow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), len, 0xf87171, 0.2, 0.08);
    const yArr = createArrow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), len, 0x4ade80, 0.2, 0.08);
    const zArr = createArrow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), len, 0x60a5fa, 0.2, 0.08);
    xArr.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0.45; } });
    yArr.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0.45; } });
    zArr.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0.45; } });
    axesGroup.add(xArr, yArr, zArr);

    const grid = new THREE.GridHelper(12, 12, 0x1e3a5f, 0x112240);
    grid.position.y = -2.6;
    if (Array.isArray(grid.material)) {
      grid.material.forEach((m) => { m.transparent = true; m.opacity = 0.28; });
    } else if (grid.material) {
      grid.material.transparent = true;
      grid.material.opacity = 0.28;
    }
    axesGroup.add(grid);
    axesGroup.visible = showAxes;
  }

  function handleResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (activeSim && typeof activeSim.onResize === "function") {
      activeSim.onResize();
    }
  }

  function disposeNode(node) {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((m) => {
        if (m.map) m.map.dispose();
        if (m.alphaMap) m.alphaMap.dispose();
        m.dispose();
      });
    }
  }

  function clearSimGroup() {
    if (!simGroup) return;
    simGroup.traverse(disposeNode);
    while (simGroup.children.length > 0) {
      simGroup.remove(simGroup.children[0]);
    }
  }

  function loadSimulation(simFactory, uiHooks) {
    if (activeSim && typeof activeSim.cleanup === "function") {
      try { activeSim.cleanup(); } catch (e) { console.warn(e); }
    }
    clearSimGroup();
    clock.start();
    activeSim = simFactory(simGroup, uiHooks);
  }

  function setCameraView(pos, target = { x: 0, y: 0, z: 0 }) {
    defaultCamPos = { x: pos.x, y: pos.y, z: pos.z };
    defaultTarget = { x: target.x, y: target.y, z: target.z };
    resetCamera();
  }

  function resetCamera() {
    if (!camera || !controls) return;
    camera.position.set(defaultCamPos.x, defaultCamPos.y, defaultCamPos.z);
    controls.target.set(defaultTarget.x, defaultTarget.y, defaultTarget.z);
    camera.lookAt(controls.target);
    if (controls.resetSync) controls.resetSync();
    controls.update();
  }

  function setAutoRotate(flag) {
    autoRotate = !!flag;
    if (controls) controls.autoRotate = autoRotate;
    return autoRotate;
  }

  function setPaused(flag) {
    paused = !!flag;
    return paused;
  }

  function setAxesVisible(flag) {
    showAxes = !!flag;
    if (axesGroup) axesGroup.visible = showAxes;
    return showAxes;
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock ? clock.getDelta() : 0.016, 0.05);
    const elapsed = clock ? clock.getElapsedTime() : 0;

    if (!paused && activeSim && typeof activeSim.update === "function") {
      activeSim.update(dt, elapsed);
    }
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // ==================== 3D Physics Geometry Helpers ====================

  function createAtom(radius, color, opts = {}) {
    const segs = opts.segments || 26;
    const geo = new THREE.SphereGeometry(radius, segs, segs);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.26,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.18,
      emissive: opts.emissive !== undefined ? opts.emissive : color,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.08,
      transparent: !!opts.transparent || (opts.opacity !== undefined && opts.opacity < 1),
      opacity: opts.opacity !== undefined ? opts.opacity : 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    if (opts.position) mesh.position.copy(opts.position);
    return mesh;
  }

  function createBond(p1, p2, radius = 0.055, color = 0x94a3b8, opacity = 0.85) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    if (len < 1e-5) return new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 12, 1);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.25,
      transparent: opacity < 1,
      opacity
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return mesh;
  }

  function createArrow(origin, dir, length, color = 0x38bdf8, headLen = 0.26, headRad = 0.1) {
    const group = new THREE.Group();
    const unit = dir.clone().normalize();
    if (length <= 0.01) return group;

    const actualHead = Math.min(headLen, length * 0.45);
    const shaftLen = Math.max(0.001, length - actualHead);
    const shaftRad = headRad * 0.38;

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.15,
      emissive: color,
      emissiveIntensity: 0.18
    });

    const shaftGeo = new THREE.CylinderGeometry(shaftRad, shaftRad, shaftLen, 12);
    const shaft = new THREE.Mesh(shaftGeo, mat);
    shaft.position.y = shaftLen / 2;

    const headGeo = new THREE.ConeGeometry(headRad, actualHead, 16);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = shaftLen + actualHead / 2;

    const inner = new THREE.Group();
    inner.add(shaft, head);
    inner.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unit);

    group.position.copy(origin);
    group.add(inner);
    return group;
  }

  // Dynamic updatable 3D helical spring line between two moving points
  function createSpringLine(coils = 9, helixRadius = 0.11, color = 0x94a3b8, pointsCount = 64) {
    const positions = new Float32Array(pointsCount * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geo, mat);

    line.userData.updateEnds = function (p1, p2) {
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      if (len < 1e-4) return;
      const u = dir.clone().normalize();
      const arbitrary = Math.abs(u.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const v = new THREE.Vector3().crossVectors(u, arbitrary).normalize();
      const w = new THREE.Vector3().crossVectors(u, v).normalize();

      const arr = geo.attributes.position.array;
      for (let i = 0; i < pointsCount; i++) {
        const t = i / (pointsCount - 1);
        // Taper ends cleanly into atom centers
        const env = (t < 0.08 || t > 0.92) ? 0 : Math.sin(Math.min(1, (t - 0.08) / 0.84) * Math.PI > 0 ? Math.PI / 2 : 0);
        const r = (t > 0.08 && t < 0.92) ? helixRadius : 0;
        const angle = t * coils * Math.PI * 2;
        const cx = p1.x + dir.x * t + (v.x * Math.cos(angle) + w.x * Math.sin(angle)) * r * env;
        const cy = p1.y + dir.y * t + (v.y * Math.cos(angle) + w.y * Math.sin(angle)) * r * env;
        const cz = p1.z + dir.z * t + (v.z * Math.cos(angle) + w.z * Math.sin(angle)) * r * env;
        arr[i * 3] = cx;
        arr[i * 3 + 1] = cy;
        arr[i * 3 + 2] = cz;
      }
      geo.attributes.position.needsUpdate = true;
    };

    return line;
  }

  function createLabel(text, position, opts = {}) {
    const fontSize = opts.fontSize || 34;
    const padX = 18;
    const padY = 10;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontStr = `700 ${fontSize}px Inter, "Microsoft YaHei", sans-serif`;
    ctx.font = fontStr;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width + padX * 2);
    const h = Math.ceil(fontSize + padY * 2);
    canvas.width = w;
    canvas.height = h;

    ctx.font = fontStr;
    if (opts.bg !== false) {
      ctx.fillStyle = opts.bgColor || "rgba(10, 18, 36, 0.82)";
      ctx.strokeStyle = opts.borderColor || "rgba(96, 165, 250, 0.55)";
      ctx.lineWidth = 2.5;
      const r = 12;
      ctx.beginPath();
      ctx.moveTo(r, 2);
      ctx.lineTo(w - r, 2);
      ctx.quadraticCurveTo(w - 2, 2, w - 2, r);
      ctx.lineTo(w - 2, h - r);
      ctx.quadraticCurveTo(w - 2, h - 2, w - r, h - 2);
      ctx.lineTo(r, h - 2);
      ctx.quadraticCurveTo(2, h - 2, 2, h - r);
      ctx.lineTo(2, r);
      ctx.quadraticCurveTo(2, 2, r, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = opts.color || "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 1);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: opts.depthTest !== undefined ? opts.depthTest : false
    });
    const sprite = new THREE.Sprite(mat);
    const scale = opts.scale || 0.0125;
    sprite.scale.set(w * scale, h * scale, 1);
    if (position) sprite.position.copy(position);
    return sprite;
  }

  // Parallelepiped wireframe & optional translucent volume defined by basis vectors a1, a2, a3
  function createParallelepiped(a1, a2, a3, origin = new THREE.Vector3(0, 0, 0), color = 0x38bdf8, fillOpacity = 0) {
    const group = new THREE.Group();
    const p000 = origin.clone();
    const p100 = origin.clone().add(a1);
    const p010 = origin.clone().add(a2);
    const p001 = origin.clone().add(a3);
    const p110 = p100.clone().add(a2);
    const p101 = p100.clone().add(a3);
    const p011 = p010.clone().add(a3);
    const p111 = p110.clone().add(a3);

    const segs = [
      p000, p100, p000, p010, p000, p001,
      p100, p110, p100, p101,
      p010, p110, p010, p011,
      p001, p101, p001, p011,
      p110, p111, p101, p111, p011, p111
    ];
    const pos = new Float32Array(segs.length * 3);
    segs.forEach((v, i) => {
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    if (fillOpacity > 0) {
      const faces = [
        [p000, p100, p110, p010],
        [p001, p011, p111, p101],
        [p000, p001, p101, p100],
        [p010, p110, p111, p011],
        [p000, p010, p011, p001],
        [p100, p101, p111, p110]
      ];
      const fPos = [];
      faces.forEach((q) => {
        fPos.push(
          q[0].x, q[0].y, q[0].z, q[1].x, q[1].y, q[1].z, q[2].x, q[2].y, q[2].z,
          q[0].x, q[0].y, q[0].z, q[2].x, q[2].y, q[2].z, q[3].x, q[3].y, q[3].z
        );
      });
      const fGeo = new THREE.BufferGeometry();
      fGeo.setAttribute("position", new THREE.Float32BufferAttribute(fPos, 3));
      fGeo.computeVertexNormals();
      const fMat = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: fillOpacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      group.add(new THREE.Mesh(fGeo, fMat));
    }

    return group;
  }

  // Exact analytical clipping of plane h*x + k*y + l*z = C inside [0, 1]^3 scaled by a and centered at offset
  function createClippedMillerPlane(h, k, l, C, a = 3.0, offset = new THREE.Vector3(-1.5, -1.5, -1.5), color = 0x38bdf8, opacity = 0.42) {
    const corners = [
      [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
      [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    const pts = [];
    function addUnique(pt) {
      for (const p of pts) {
        if (p.distanceToSquared(pt) < 1e-6) return;
      }
      pts.push(pt);
    }

    edges.forEach(([i, j]) => {
      const p1 = corners[i];
      const p2 = corners[j];
      const v1 = h * p1[0] + k * p1[1] + l * p1[2] - C;
      const v2 = h * p2[0] + k * p2[1] + l * p2[2] - C;
      if (Math.abs(v1) < 1e-6) {
        addUnique(new THREE.Vector3(p1[0] * a + offset.x, p1[1] * a + offset.y, p1[2] * a + offset.z));
      }
      if (Math.abs(v2) < 1e-6) {
        addUnique(new THREE.Vector3(p2[0] * a + offset.x, p2[1] * a + offset.y, p2[2] * a + offset.z));
      }
      if (v1 * v2 < -1e-9) {
        const t = v1 / (v1 - v2);
        if (t >= 0 && t <= 1) {
          const ix = p1[0] + t * (p2[0] - p1[0]);
          const iy = p1[1] + t * (p2[1] - p1[1]);
          const iz = p1[2] + t * (p2[2] - p1[2]);
          addUnique(new THREE.Vector3(ix * a + offset.x, iy * a + offset.y, iz * a + offset.z));
        }
      }
    });

    if (pts.length < 3) return null;

    // Sort polygon points around centroid
    const centroid = new THREE.Vector3();
    pts.forEach((p) => centroid.add(p));
    centroid.divideScalar(pts.length);

    const normal = new THREE.Vector3(h, k, l).normalize();
    const ref = Math.abs(normal.x) < 0.8 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(normal, ref).normalize();
    const v = new THREE.Vector3().crossVectors(normal, u).normalize();

    pts.sort((aPt, bPt) => {
      const da = aPt.clone().sub(centroid);
      const db = bPt.clone().sub(centroid);
      return Math.atan2(da.dot(v), da.dot(u)) - Math.atan2(db.dot(v), db.dot(u));
    });

    const group = new THREE.Group();
    const triVerts = [];
    for (let i = 1; i < pts.length - 1; i++) {
      triVerts.push(
        pts[0].x, pts[0].y, pts[0].z,
        pts[i].x, pts[i].y, pts[i].z,
        pts[i + 1].x, pts[i + 1].y, pts[i + 1].z
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(triVerts, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      shininess: 70
    });
    group.add(new THREE.Mesh(geo, mat));

    // Bright polygon border
    const loopVerts = [];
    pts.forEach((p) => loopVerts.push(p.x, p.y, p.z));
    loopVerts.push(pts[0].x, pts[0].y, pts[0].z);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.Float32BufferAttribute(loopVerts, 3));
    const lMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.min(1, opacity + 0.45) });
    group.add(new THREE.Line(lGeo, lMat));

    return group;
  }

  return {
    init,
    loadSimulation,
    setCameraView,
    resetCamera,
    setAutoRotate,
    setPaused,
    setAxesVisible,
    handleResize,
    createAtom,
    createBond,
    createArrow,
    createSpringLine,
    createLabel,
    createParallelepiped,
    createClippedMillerPlane,
    disposeNode
  };
})();
