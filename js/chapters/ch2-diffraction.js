/**
 * 第 2 章：晶体的衍射和倒格子 (Chapter 2: Crystal Diffraction & Reciprocal Lattice)
 * 覆盖大纲：2.1 布拉格衍射 | 2.2 倒格子与厄瓦尔德球 | 2.3 三维第一布里渊区 | 2.4 结构因子与系统消光
 */
window.SimRegistry = window.SimRegistry || {};

(function () {
  const SM = window.SceneManager;
  const PH = window.PlotHelper;

  function clearGroup(grp) {
    grp.traverse(SM.disposeNode);
    while (grp.children.length) grp.remove(grp.children[0]);
  }

  // ============================================================================
  // 2.1 晶体衍射与布拉格定律 (2d sinθ = nλ)
  // ============================================================================
  window.SimRegistry["2-1"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0.4, y: 3.2, z: 9.2 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      thetaDeg: 30.0,
      dSpacing: 1.54, // Å
      lambda: 1.54,   // Cu Kα = 1.54 Å -> n=1 Bragg peak right at θ = 30°!
      numPlanes: 4
    };

    let waveLines = [];

    function calcIntensity(thDeg) {
      const th = (thDeg * Math.PI) / 180;
      const delta = (4 * Math.PI * state.dSpacing * Math.sin(th)) / state.lambda;
      const N = state.numPlanes;
      const denom = Math.sin(delta / 2);
      if (Math.abs(denom) < 1e-5) return 1.0;
      return Math.pow(Math.sin((N * delta) / 2) / (N * denom), 2);
    }

    function rebuild() {
      clearGroup(root);
      waveLines = [];

      const visualD = state.dSpacing * 0.95;
      // Draw crystal atomic planes y = 0, -visualD, -2*visualD
      for (let p = 0; p < 3; p++) {
        const y = -p * visualD;
        const planeGeo = new THREE.PlaneGeometry(7.2, 3.2);
        const planeMat = new THREE.MeshPhongMaterial({
          color: 0x1e3a8a,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = y;
        root.add(mesh);

        for (let ix = -3; ix <= 3; ix++) {
          for (let iz = -1; iz <= 1; iz++) {
            root.add(SM.createAtom(0.14, p < 2 && ix === 0 && iz === 0 ? 0xfbbf24 : 0x38bdf8, {
              position: new THREE.Vector3(ix * 1.05, y, iz * 1.05)
            }));
          }
        }
      }

      // Vertical spacing indicator d
      root.add(SM.createBond(new THREE.Vector3(3.3, 0, 0), new THREE.Vector3(3.3, -visualD, 0), 0.025, 0x94a3b8));
      root.add(SM.createLabel(`d = ${state.dSpacing.toFixed(2)} Å`, new THREE.Vector3(4.2, -visualD / 2, 0), { color: "#cbd5e1" }));

      const th = (state.thetaDeg * Math.PI) / 180;
      const cosT = Math.cos(th);
      const sinT = Math.sin(th);

      // Highlighted extra path triangle A -> O2 -> B on 2nd layer (y = -visualD)
      // O1 = (0,0,0), O2 = (0,-visualD,0)
      // Foot of perpendicular from O1 onto ray2 incoming and outgoing:
      const footIn = new THREE.Vector3(-visualD * sinT * cosT, -visualD * sinT * sinT, 0);
      const footOut = new THREE.Vector3(visualD * sinT * cosT, -visualD * sinT * sinT, 0);
      const O1 = new THREE.Vector3(0, 0, 0);
      const O2 = new THREE.Vector3(0, -visualD, 0);

      root.add(SM.createBond(O1, footIn, 0.02, 0x94a3b8, 0.7));
      root.add(SM.createBond(O1, footOut, 0.02, 0x94a3b8, 0.7));
      root.add(SM.createBond(footIn, O2, 0.055, 0xfbbf24, 0.95));
      root.add(SM.createBond(O2, footOut, 0.055, 0xfbbf24, 0.95));
      root.add(SM.createLabel("光程差 2d sinθ", new THREE.Vector3(0, -visualD - 0.42, 0.4), { color: "#fde047" }));

      // Create animated sinusoidal rays for Layer 0 and Layer 1 + superposed interference beam
      const rayLength = 4.2;
      const segs = 110;
      for (let layer = 0; layer < 2; layer++) {
        const hit = new THREE.Vector3(0, -layer * visualD, 0);
        const inDir = new THREE.Vector3(-cosT, sinT, 0); // pointing backwards to source
        const outDir = new THREE.Vector3(cosT, sinT, 0);

        const inGeo = new THREE.BufferGeometry();
        inGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs * 3), 3));
        const inLine = new THREE.Line(inGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));

        const outGeo = new THREE.BufferGeometry();
        outGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs * 3), 3));
        const intens = calcIntensity(state.thetaDeg);
        const outColor = intens > 0.65 ? 0x34d399 : (intens > 0.25 ? 0xfbbf24 : 0xf87171);
        const outLine = new THREE.Line(outGeo, new THREE.LineBasicMaterial({ color: outColor }));

        root.add(inLine, outLine);
        waveLines.push({ layer, hit, inDir, outDir, inGeo, outGeo, rayLength, segs, visualD });
      }

      const pathDiff = 2 * state.dSpacing * Math.sin(th);
      const orderRatio = pathDiff / state.lambda;
      const intensity = calcIntensity(state.thetaDeg);

      ui.setLegend([
        { color: "#38bdf8", label: "入射相干 X 射线波束" },
        { color: "#fbbf24", label: "光程差几何段 Δ = 2d sinθ" },
        { color: "#34d399", label: "相长干涉衍射强峰" },
        { color: "#f87171", label: "相消干涉微弱散射" }
      ]);

      ui.setMetrics([
        { label: "光程差 Δ = 2d sinθ", value: pathDiff.toFixed(3) + " Å" },
        { label: "波数比 Δ / λ", value: orderRatio.toFixed(2) + (Math.abs(orderRatio - Math.round(orderRatio)) < 0.04 ? " (相长!)" : "") },
        { label: "衍射角 2θ", value: (state.thetaDeg * 2).toFixed(1) + "°" },
        { label: "归一化衍射强度 I", value: (intensity * 100).toFixed(1) + "%" }
      ]);

      drawPlot();
    }

    function drawPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 10, xMax: 160, yMin: 0, yMax: 1.08,
        title: "晶体衍射强度谱 I(2θ) — 多晶面相干叠加",
        xLabel: "衍射角 2θ (°)",
        yLabel: "相对强度 I / I₀"
      });

      const pts = [];
      for (let twoTh = 10; twoTh <= 160; twoTh += 0.5) {
        pts.push([twoTh, calcIntensity(twoTh / 2)]);
      }
      PH.drawCurve(ctx, map, pts, {
        color: "#38bdf8",
        fill: "rgba(56, 189, 248, 0.16)",
        width: 2
      });
      const curI = calcIntensity(state.thetaDeg);
      PH.drawPoint(ctx, map, state.thetaDeg * 2, curI, curI > 0.65 ? "#34d399" : "#fbbf24", 5, `2θ=${(state.thetaDeg * 2).toFixed(1)}°`);
    }

    function syncControls() {
      ui.setControls([
        {
          type: "slider",
          label: "掠射角 (布拉格角) θ",
          min: 8, max: 78, step: 0.5, value: state.thetaDeg,
          unit: "°",
          onChange: (v) => { state.thetaDeg = v; rebuild(); }
        },
        {
          type: "slider",
          label: "晶面间距 d_hkl",
          min: 1.0, max: 3.0, step: 0.02, value: state.dSpacing,
          unit: " Å",
          onChange: (v) => { state.dSpacing = v; rebuild(); }
        },
        {
          type: "slider",
          label: "入射 X 射线波长 λ",
          min: 0.7, max: 2.5, step: 0.02, value: state.lambda,
          unit: " Å",
          onChange: (v) => { state.lambda = v; rebuild(); }
        },
        {
          type: "slider",
          label: "参与相干散射晶面层数 N",
          min: 2, max: 16, step: 1, value: state.numPlanes,
          unit: " 层",
          onChange: (v) => { state.numPlanes = v; rebuild(); }
        },
        {
          type: "pills",
          label: "一键锁定布拉格衍射级次",
          value: "",
          options: [
            { label: "n = 1 一级主峰", value: "1" },
            { label: "n = 2 二级衍射峰", value: "2" },
            { label: "相消半波角", value: "1.5" }
          ],
          onChange: (val) => {
            const n = parseFloat(val);
            const s = (n * state.lambda) / (2 * state.dSpacing);
            if (s <= 0.98) {
              state.thetaDeg = Math.round((Math.asin(s) * 180 / Math.PI) * 2) / 2;
              syncControls();
              rebuild();
            }
          }
        }
      ]);
    }

    syncControls();
    rebuild();

    return {
      update(dt, elapsed) {
        const kVis = (2 * Math.PI) / (state.lambda * 0.52);
        const th = (state.thetaDeg * Math.PI) / 180;
        const physicalPhaseLag = (4 * Math.PI * state.dSpacing * Math.sin(th)) / state.lambda;

        waveLines.forEach((wObj) => {
          const { layer, hit, inDir, outDir, inGeo, outGeo, rayLength, segs } = wObj;
          const inPerp = new THREE.Vector3(inDir.y, -inDir.x, 0).normalize();
          const outPerp = new THREE.Vector3(-outDir.y, outDir.x, 0).normalize();
          const inArr = inGeo.attributes.position.array;
          const outArr = outGeo.attributes.position.array;

          for (let i = 0; i < segs; i++) {
            const s = (1 - i / (segs - 1)) * rayLength; // distance from hit along incoming
            const phaseIn = -kVis * s - elapsed * 7.5 + (layer * physicalPhaseLag) / 2;
            const amp = 0.14 * Math.sin(phaseIn);
            const pIn = hit.clone().addScaledVector(inDir, s).addScaledVector(inPerp, amp);
            inArr[i * 3] = pIn.x; inArr[i * 3 + 1] = pIn.y; inArr[i * 3 + 2] = pIn.z;

            const sOut = (i / (segs - 1)) * rayLength;
            const phaseOut = kVis * sOut - elapsed * 7.5 + layer * physicalPhaseLag;
            const ampOut = 0.14 * Math.sin(phaseOut);
            const pOut = hit.clone().addScaledVector(outDir, sOut).addScaledVector(outPerp, ampOut);
            outArr[i * 3] = pOut.x; outArr[i * 3 + 1] = pOut.y; outArr[i * 3 + 2] = pOut.z;
          }
          inGeo.attributes.position.needsUpdate = true;
          outGeo.attributes.position.needsUpdate = true;
        });
      },
      onResize: drawPlot
    };
  };

  // ============================================================================
  // 2.2 倒易晶格、劳厄条件与三维厄瓦尔德球 (Ewald Sphere)
  // ============================================================================
  window.SimRegistry["2-2"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.5, y: 5.5, z: 7.5 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      realLattice: "SC", // 'SC' | 'BCC' | 'FCC'
      kMag: 2.35,        // Radius of Ewald sphere in reciprocal units (b=1)
      angleDeg: 26.5,    // Incident direction angle
      tol: 0.14
    };

    function rebuild() {
      clearGroup(root);

      // Generate reciprocal lattice points G
      const gPoints = [];
      const N = 2;
      for (let h = -N; h <= N; h++) {
        for (let k = -N; k <= N; k++) {
          for (let l = -N; l <= N; l++) {
            if (state.realLattice === "BCC") {
              // Reciprocal of BCC is FCC -> only unmixed parity in half-scale or h+k+l even!
              if ((Math.abs(h + k + l) % 2) !== 0) continue;
            } else if (state.realLattice === "FCC") {
              // Reciprocal of FCC is BCC -> h,k,l all even or all odd
              const p1 = Math.abs(h) % 2, p2 = Math.abs(k) % 2, p3 = Math.abs(l) % 2;
              if (!(p1 === p2 && p2 === p3)) continue;
            }
            gPoints.push({ h, k, l, pos: new THREE.Vector3(h * 1.35, k * 1.35, l * 1.35) });
          }
        }
      }

      // Origin O of reciprocal space = (0,0,0)
      // Incident wavevector k ends at Origin (0,0,0)! So center of Ewald sphere is at C = -k!
      const phi = (state.angleDeg * Math.PI) / 180;
      const R = state.kMag * 1.35;
      const kVec = new THREE.Vector3(R * Math.cos(phi), R * Math.sin(phi) * 0.65, R * Math.sin(phi) * 0.35);
      const actualR = kVec.length();
      const sphereCenter = kVec.clone().negate();

      // Translucent Ewald Sphere
      const sphGeo = new THREE.SphereGeometry(actualR, 42, 32);
      const sphMat = new THREE.MeshPhongMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const sph = new THREE.Mesh(sphGeo, sphMat);
      sph.position.copy(sphereCenter);
      root.add(sph);

      // Wireframe equator rings on Ewald sphere for 3D depth perception
      const ringGeo = new THREE.RingGeometry(actualR - 0.02, actualR + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
      const rXY = new THREE.Mesh(ringGeo, ringMat);
      rXY.position.copy(sphereCenter);
      const rXZ = new THREE.Mesh(ringGeo, ringMat);
      rXZ.rotation.x = Math.PI / 2;
      rXZ.position.copy(sphereCenter);
      root.add(rXY, rXZ);

      // Incident wavevector k from sphereCenter to Origin (0,0,0)
      root.add(SM.createArrow(sphereCenter, kVec, actualR, 0x38bdf8, 0.28, 0.1));
      root.add(SM.createLabel("入射波矢 k", sphereCenter.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0.3, 0)), { color: "#7dd3fc" }));
      root.add(SM.createLabel("O(000)", new THREE.Vector3(0.28, -0.28, 0), { color: "#f8fafc" }));

      let hitCount = 0;
      const hitList = [];

      gPoints.forEach((gp) => {
        const isOrigin = gp.h === 0 && gp.k === 0 && gp.l === 0;
        const distToCenter = gp.pos.distanceTo(sphereCenter);
        const onSphere = !isOrigin && Math.abs(distToCenter - actualR) < state.tol * 1.35;

        if (isOrigin) {
          root.add(SM.createAtom(0.16, 0xffffff, { position: gp.pos }));
        } else if (onSphere) {
          hitCount++;
          hitList.push({ h: gp.h, k: gp.k, l: gp.l, gLen: gp.pos.length() / 1.35 });
          root.add(SM.createAtom(0.19, 0xfbbf24, { position: gp.pos, emissiveIntensity: 0.6 }));
          // Scattered wavevector k' from sphereCenter to G, and reciprocal vector G from Origin to G!
          const kPrime = gp.pos.clone().sub(sphereCenter);
          root.add(SM.createArrow(sphereCenter, kPrime, kPrime.length(), 0x34d399, 0.26, 0.09));
          root.add(SM.createArrow(new THREE.Vector3(0, 0, 0), gp.pos, gp.pos.length(), 0xfbbf24, 0.24, 0.08));
          root.add(SM.createLabel(`G(${gp.h}${gp.k}${gp.l})`, gp.pos.clone().add(new THREE.Vector3(0, 0.26, 0)), { color: "#fde047" }));
        } else {
          root.add(SM.createAtom(0.085, 0x64748b, { position: gp.pos, opacity: 0.65 }));
        }
      });

      const recipName = state.realLattice === "SC" ? "SC (简单立方)" : state.realLattice === "BCC" ? "FCC (面心立方)" : "BCC (体心立方)";

      ui.setLegend([
        { color: "#38bdf8", label: "厄瓦尔德球面 (|k'| = |k| = 2π/λ)" },
        { color: "#fbbf24", label: "满足劳厄条件 Δk = G 的倒格点" },
        { color: "#34d399", label: "激发衍射波矢 k' = k + G" },
        { color: "#64748b", label: "未满足衍射条件的倒易格点" }
      ]);

      ui.setMetrics([
        { label: "实空间晶格", value: state.realLattice },
        { label: "对应倒易点阵", value: recipName.split(" ")[0] },
        { label: "厄瓦尔德球半径 |k|", value: state.kMag.toFixed(2) + " (2π/a)" },
        { label: "当前激发衍射束数", value: hitCount + " 束" }
      ]);

      drawPlot(gPoints, sphereCenter, actualR);
    }

    function drawPlot(gPoints, sphereCenter, actualR) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: 4.0, yMin: -1.5, yMax: 1.5,
        title: "倒格点偏离厄瓦尔德球面距离 Δ|k| (零线即激发衍射!)",
        xLabel: "倒格矢模长 |G| / (2π/a)",
        yLabel: "|k+G| - |k|"
      });

      PH.drawCurve(ctx, map, [[0, 0], [4.0, 0]], { color: "#34d399", width: 1.8 });

      gPoints.forEach((gp) => {
        if (gp.h === 0 && gp.k === 0 && gp.l === 0) return;
        const gNorm = gp.pos.length() / 1.35;
        const err = (gp.pos.distanceTo(sphereCenter) - actualR) / 1.35;
        if (Math.abs(err) < 1.45 && gNorm <= 3.95) {
          const hit = Math.abs(err) < state.tol;
          PH.drawPoint(ctx, map, gNorm, err, hit ? "#fbbf24" : "#64748b", hit ? 4.5 : 2.8, hit ? `(${gp.h}${gp.k}${gp.l})` : "");
        }
      });
    }

    ui.setControls([
      {
        type: "pills",
        label: "实空间布拉菲晶格 (观察正倒对偶)",
        value: state.realLattice,
        options: [
          { label: "SC → 倒格 SC", value: "SC" },
          { label: "BCC → 倒格 FCC", value: "BCC" },
          { label: "FCC → 倒格 BCC", value: "FCC" }
        ],
        onChange: (v) => { state.realLattice = v; rebuild(); }
      },
      {
        type: "slider",
        label: "入射波矢大小 |k| = 2π/λ",
        min: 0.8, max: 3.6, step: 0.05, value: state.kMag,
        unit: " b₀",
        onChange: (v) => { state.kMag = v; rebuild(); }
      },
      {
        type: "slider",
        label: "晶体/入射束取向角 φ (转晶法)",
        min: 0, max: 180, step: 0.5, value: state.angleDeg,
        unit: "°",
        onChange: (v) => { state.angleDeg = v; rebuild(); }
      },
      {
        type: "slider",
        label: "谱线展宽 / 倒格杆容差",
        min: 0.05, max: 0.28, step: 0.02, value: state.tol,
        unit: "",
        onChange: (v) => { state.tol = v; rebuild(); }
      }
    ]);

    rebuild();
    return { onResize: () => rebuild() };
  };

  // ============================================================================
  // 2.3 布里渊区三维几何构造 (SC 立方体 / BCC 菱形十二面体 / FCC 截角八面体)
  // ============================================================================
  function buildPolygonFace(verts, color, opacity) {
    const group = new THREE.Group();
    const tri = [];
    for (let i = 1; i < verts.length - 1; i++) {
      tri.push(
        verts[0].x, verts[0].y, verts[0].z,
        verts[i].x, verts[i].y, verts[i].z,
        verts[i + 1].x, verts[i + 1].y, verts[i + 1].z
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      shininess: 65
    });
    group.add(new THREE.Mesh(geo, mat));

    const loop = [];
    verts.forEach((v) => loop.push(v.x, v.y, v.z));
    loop.push(verts[0].x, verts[0].y, verts[0].z);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.Float32BufferAttribute(loop, 3));
    group.add(new THREE.Line(lGeo, new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.85 })));
    return group;
  }

  window.SimRegistry["2-3"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.5, z: 6.6 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      crystal: "FCC", // Real space crystal: 'FCC' (Truncated Octahedron), 'BCC' (Rhombic Dodecahedron), 'SC' (Cube)
      cutProgress: 1.0, // 0.2 -> Bragg bisector planes far away, 1.0 -> exact 1st Brillouin Zone!
      showSymPoints: true
    };

    function rebuild() {
      clearGroup(root);
      // Scale factor
      const s = 1.05;
      // Moving bisector animation factor: when cutProgress < 1, push each face outward along its normal!
      const pushOut = (1 - state.cutProgress) * 2.2;

      root.add(SM.createAtom(0.12, 0xffffff, { position: new THREE.Vector3(0, 0, 0) }));
      if (state.showSymPoints) {
        root.add(SM.createLabel("Γ(0,0,0)", new THREE.Vector3(0.25, -0.22, 0), { color: "#ffffff" }));
      }

      if (state.crystal === "FCC") {
        // Real space FCC -> Reciprocal BCC -> 1st BZ is Truncated Octahedron!
        // 6 square faces at (±2, 0, 0), (0, ±2, 0), (0, 0, ±2)
        const sqAxes = [
          { n: new THREE.Vector3(1, 0, 0), pts: [[2, 1, 0], [2, 0, 1], [2, -1, 0], [2, 0, -1]] },
          { n: new THREE.Vector3(-1, 0, 0), pts: [[-2, 1, 0], [-2, 0, -1], [-2, -1, 0], [-2, 0, 1]] },
          { n: new THREE.Vector3(0, 1, 0), pts: [[1, 2, 0], [0, 2, 1], [-1, 2, 0], [0, 2, -1]] },
          { n: new THREE.Vector3(0, -1, 0), pts: [[1, -2, 0], [0, -2, -1], [-1, -2, 0], [0, -2, 1]] },
          { n: new THREE.Vector3(0, 0, 1), pts: [[1, 0, 2], [0, 1, 2], [-1, 0, 2], [0, -1, 2]] },
          { n: new THREE.Vector3(0, 0, -1), pts: [[1, 0, -2], [0, -1, -2], [-1, 0, -2], [0, 1, -2]] }
        ];
        sqAxes.forEach((f) => {
          const shift = f.n.clone().multiplyScalar(pushOut);
          const v = f.pts.map(([x, y, z]) => new THREE.Vector3(x * s, y * s, z * s).add(shift));
          root.add(buildPolygonFace(v, 0x38bdf8, 0.36));
        });

        // 8 hexagonal faces in octants (±1, ±1, ±1)
        [-1, 1].forEach((sx) => {
          [-1, 1].forEach((sy) => {
            [-1, 1].forEach((sz) => {
              const n = new THREE.Vector3(sx, sy, sz).normalize();
              const shift = n.clone().multiplyScalar(pushOut);
              const raw = [
                [2 * sx, 1 * sy, 0],
                [1 * sx, 2 * sy, 0],
                [0, 2 * sy, 1 * sz],
                [0, 1 * sy, 2 * sz],
                [1 * sx, 0, 2 * sz],
                [2 * sx, 0, 1 * sz]
              ];
              const v = raw.map(([x, y, z]) => new THREE.Vector3(x * s, y * s, z * s).add(shift));
              root.add(buildPolygonFace(v, 0x818cf8, 0.38));
            });
          });
        });

        if (state.showSymPoints && state.cutProgress > 0.96) {
          const Gamma = new THREE.Vector3(0, 0, 0);
          const X = new THREE.Vector3(2 * s, 0, 0);
          const W = new THREE.Vector3(2 * s, 1 * s, 0);
          const L = new THREE.Vector3(1 * s, 1 * s, 1 * s);
          const K = new THREE.Vector3(1.5 * s, 1.5 * s, 0);
          const U = new THREE.Vector3(2 * s, 0.5 * s, 0.5 * s);

          [[X, "X", 0x38bdf8], [W, "W", 0xfbbf24], [L, "L", 0x34d399], [K, "K", 0xf472b6], [U, "U", 0xa78bfa]].forEach(([pt, name, col]) => {
            root.add(SM.createAtom(0.11, col, { position: pt, emissiveIntensity: 0.5 }));
            root.add(SM.createLabel(name, pt.clone().multiplyScalar(1.16), { color: "#f8fafc" }));
          });

          // High-symmetry irreducible path Γ -> X -> W -> L -> Γ -> K
          [
            [Gamma, X], [X, W], [W, L], [L, Gamma], [Gamma, K], [K, U], [U, X]
          ].forEach(([p1, p2]) => root.add(SM.createBond(p1, p2, 0.032, 0xfbbf24, 0.95)));
        }

        ui.setLegend([
          { color: "#818cf8", label: "8 个正六边形布拉格面 {111} (中心 L)" },
          { color: "#38bdf8", label: "6 个正方形布拉格面 {200} (中心 X)" },
          { color: "#fbbf24", label: "不可约高对称路径 Γ-X-W-L-Γ-K" }
        ]);
        ui.setMetrics([
          { label: "实空间晶格", value: "FCC (Cu, Al, Si, GaAs)" },
          { label: "倒空间点阵", value: "BCC (体心立方)" },
          { label: "第一布里渊区形状", value: "截角八面体 (14面)" },
          { label: "布里渊区体积", value: "4 × (2π/a)³" }
        ]);
      } else if (state.crystal === "BCC") {
        // Real space BCC -> Reciprocal FCC -> 1st BZ is Rhombic Dodecahedron (12 rhombic faces)!
        const sB = 1.15;
        const faces12 = [
          { n: [1, 1, 0], v: [[2, 0, 0], [1, 1, 1], [0, 2, 0], [1, 1, -1]] },
          { n: [1, -1, 0], v: [[2, 0, 0], [1, -1, -1], [0, -2, 0], [1, -1, 1]] },
          { n: [-1, 1, 0], v: [[-2, 0, 0], [-1, 1, -1], [0, 2, 0], [-1, 1, 1]] },
          { n: [-1, -1, 0], v: [[-2, 0, 0], [-1, -1, 1], [0, -2, 0], [-1, -1, -1]] },
          { n: [1, 0, 1], v: [[2, 0, 0], [1, -1, 1], [0, 0, 2], [1, 1, 1]] },
          { n: [1, 0, -1], v: [[2, 0, 0], [1, 1, -1], [0, 0, -2], [1, -1, -1]] },
          { n: [-1, 0, 1], v: [[-2, 0, 0], [-1, 1, 1], [0, 0, 2], [-1, -1, 1]] },
          { n: [-1, 0, -1], v: [[-2, 0, 0], [-1, -1, -1], [0, 0, -2], [-1, 1, -1]] },
          { n: [0, 1, 1], v: [[0, 2, 0], [1, 1, 1], [0, 0, 2], [-1, 1, 1]] },
          { n: [0, 1, -1], v: [[0, 2, 0], [-1, 1, -1], [0, 0, -2], [1, 1, -1]] },
          { n: [0, -1, 1], v: [[0, -2, 0], [-1, -1, 1], [0, 0, 2], [1, -1, 1]] },
          { n: [0, -1, -1], v: [[0, -2, 0], [1, -1, -1], [0, 0, -2], [-1, -1, -1]] }
        ];

        faces12.forEach((f) => {
          const nVec = new THREE.Vector3(f.n[0], f.n[1], f.n[2]).normalize();
          const shift = nVec.multiplyScalar(pushOut);
          const pts = f.v.map(([x, y, z]) => new THREE.Vector3(x * sB, y * sB, z * sB).add(shift));
          root.add(buildPolygonFace(pts, 0x34d399, 0.36));
        });

        if (state.showSymPoints && state.cutProgress > 0.96) {
          const G = new THREE.Vector3(0, 0, 0);
          const H = new THREE.Vector3(2 * sB, 0, 0);
          const N = new THREE.Vector3(1 * sB, 1 * sB, 0);
          const P = new THREE.Vector3(1 * sB, 1 * sB, 1 * sB);
          [[H, "H", 0xfbbf24], [N, "N", 0x38bdf8], [P, "P", 0xf472b6]].forEach(([pt, name, col]) => {
            root.add(SM.createAtom(0.11, col, { position: pt }));
            root.add(SM.createLabel(name, pt.clone().multiplyScalar(1.15), { color: "#f8fafc" }));
          });
          [[G, H], [H, N], [N, G], [G, P], [P, H]].forEach(([p1, p2]) => root.add(SM.createBond(p1, p2, 0.032, 0xfbbf24, 0.95)));
        }

        ui.setLegend([
          { color: "#34d399", label: "12 个全等菱形布拉格中垂面 {110}" },
          { color: "#fbbf24", label: "高对称路径 Γ-H-N-Γ-P" }
        ]);
        ui.setMetrics([
          { label: "实空间晶格", value: "BCC (Fe, W, Na, K)" },
          { label: "倒空间点阵", value: "FCC (面心立方)" },
          { label: "第一布里渊区形状", value: "菱形十二面体 (12面)" },
          { label: "布里渊区体积", value: "2 × (2π/a)³" }
        ]);
      } else {
        // Real space SC -> Reciprocal SC -> Cube
        const hL = 1.65;
        const cubeFaces = [
          { n: [1, 0, 0], v: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
          { n: [-1, 0, 0], v: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
          { n: [0, 1, 0], v: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]] },
          { n: [0, -1, 0], v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
          { n: [0, 0, 1], v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
          { n: [0, 0, -1], v: [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]] }
        ];
        cubeFaces.forEach((f) => {
          const shift = new THREE.Vector3(f.n[0], f.n[1], f.n[2]).multiplyScalar(pushOut);
          const pts = f.v.map(([x, y, z]) => new THREE.Vector3(x * hL, y * hL, z * hL).add(shift));
          root.add(buildPolygonFace(pts, 0x38bdf8, 0.34));
        });

        if (state.showSymPoints && state.cutProgress > 0.96) {
          const G = new THREE.Vector3(0, 0, 0);
          const X = new THREE.Vector3(hL, 0, 0);
          const M = new THREE.Vector3(hL, hL, 0);
          const R = new THREE.Vector3(hL, hL, hL);
          [[X, "X(π/a,0,0)", 0x38bdf8], [M, "M(π/a,π/a,0)", 0xfbbf24], [R, "R(π/a,π/a,π/a)", 0x34d399]].forEach(([pt, name, col]) => {
            root.add(SM.createAtom(0.11, col, { position: pt }));
            root.add(SM.createLabel(name, pt.clone().multiplyScalar(1.18), { color: "#f8fafc" }));
          });
          [[G, X], [X, M], [M, G], [G, R], [R, M]].forEach(([p1, p2]) => root.add(SM.createBond(p1, p2, 0.032, 0xfbbf24, 0.95)));
        }

        ui.setLegend([
          { color: "#38bdf8", label: "6 个正方形布拉格反射面 k_i = ±π/a" },
          { color: "#fbbf24", label: "高对称路径 Γ-X-M-Γ-R" }
        ]);
        ui.setMetrics([
          { label: "实空间晶格", value: "SC (简单立方)" },
          { label: "倒空间点阵", value: "SC (简单立方)" },
          { label: "第一布里渊区形状", value: "正方体 [-π/a, π/a]³" },
          { label: "布里渊区体积", value: "(2π/a)³" }
        ]);
      }

      draw2DBZPlot();
    }

    function draw2DBZPlot() {
      // Draw 2D Square Lattice 1st, 2nd, 3rd Brillouin Zones (classic Kittel diagram!)
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const size = Math.min(w - 60, h - 38);
      const cx = w / 2;
      const cy = h / 2 + 8;
      const s = size / 4.2;

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 11.5px Inter, 'Microsoft YaHei', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("二维正方晶格第 1、2、3 布里渊区等面积剖分示意图", cx, 16);

      // 3rd BZ outer octagon/star pieces
      ctx.fillStyle = "rgba(244, 114, 182, 0.25)";
      ctx.strokeStyle = "#f472b6";
      ctx.lineWidth = 1;
      [
        [[-1, 1], [0, 2], [1, 1], [0, 1]],
        [[-1, -1], [0, -2], [1, -1], [0, -1]],
        [[1, -1], [2, 0], [1, 1], [1, 0]],
        [[-1, -1], [-2, 0], [-1, 1], [-1, 0]]
      ].forEach((poly) => {
        ctx.beginPath();
        poly.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(cx + x * s, cy - y * s);
          else ctx.lineTo(cx + x * s, cy - y * s);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // 2nd BZ rotated square (vertices (±2,0), (0,±2) minus 1st BZ) -> actually vertices of 2nd BZ are (±2,0),(0,±2)! Wait: bisector of (1,1) is x+y=1 -> vertices are (±2,0)? Wait: (1,1)·(x,y) = 1 -> x+y = 2 when 1st BZ is [-1,1]^2! YES!
      ctx.fillStyle = "rgba(129, 140, 248, 0.32)";
      ctx.strokeStyle = "#818cf8";
      ctx.beginPath();
      ctx.moveTo(cx + 2 * s, cy);
      ctx.lineTo(cx, cy - 2 * s);
      ctx.lineTo(cx - 2 * s, cy);
      ctx.lineTo(cx, cy + 2 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 1st BZ [-1, 1]^2
      ctx.fillStyle = "rgba(56, 189, 248, 0.55)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.6;
      ctx.fillRect(cx - s, cy - s, 2 * s, 2 * s);
      ctx.strokeRect(cx - s, cy - s, 2 * s, 2 * s);

      ctx.fillStyle = "#fff";
      ctx.font = "700 11px Inter, sans-serif";
      ctx.fillText("1st BZ", cx, cy + 4);
      ctx.fillStyle = "#c7d2fe";
      ctx.font = "600 10px Inter, sans-serif";
      ctx.fillText("2nd", cx + 1.35 * s, cy + 3);
      ctx.fillText("2nd", cx - 1.35 * s, cy + 3);
    }

    ui.setControls([
      {
        type: "pills",
        label: "选择实空间晶体点阵",
        value: state.crystal,
        options: [
          { label: "FCC (截角八面体)", value: "FCC" },
          { label: "BCC (菱形十二面体)", value: "BCC" },
          { label: "SC (正方体)", value: "SC" }
        ],
        onChange: (v) => { state.crystal = v; rebuild(); }
      },
      {
        type: "slider",
        label: "布拉格中垂面围合构造进度",
        min: 0.2, max: 1.0, step: 0.02, value: state.cutProgress,
        unit: "",
        onChange: (v) => { state.cutProgress = v; rebuild(); }
      },
      {
        type: "checkbox",
        label: "标注高对称点 (Γ, X, L, W, K) 与能带路径",
        value: state.showSymPoints,
        onChange: (v) => { state.showSymPoints = v; rebuild(); }
      }
    ]);

    rebuild();
    return { onResize: draw2DBZPlot };
  };

  // ============================================================================
  // 2.4 基元的傅里叶分析与几何结构因子消光规律 (S_hkl)
  // ============================================================================
  window.SimRegistry["2-4"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.2, y: 4.8, z: 7.0 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      crystal: "FCC", // 'SC' | 'BCC' | 'FCC' | 'Diamond' | 'NaCl'
      targetHKL: "1,1,1"
    };

    function getBasis(type) {
      if (type === "SC") return [{ u: 0, v: 0, w: 0, f: 1.0, label: "A(000)" }];
      if (type === "BCC") return [
        { u: 0, v: 0, w: 0, f: 1.0, label: "A(000)" },
        { u: 0.5, v: 0.5, w: 0.5, f: 1.0, label: "B(½½½)" }
      ];
      if (type === "FCC") return [
        { u: 0, v: 0, w: 0, f: 1.0, label: "(000)" },
        { u: 0, v: 0.5, w: 0.5, f: 1.0, label: "(0½½)" },
        { u: 0.5, v: 0, w: 0.5, f: 1.0, label: "(½0½)" },
        { u: 0.5, v: 0.5, w: 0, f: 1.0, label: "(½½0)" }
      ];
      if (type === "Diamond") {
        const fcc = [
          [0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]
        ];
        const res = [];
        fcc.forEach(([x, y, z]) => {
          res.push({ u: x, v: y, w: z, f: 1.0 });
          res.push({ u: x + 0.25, v: y + 0.25, w: z + 0.25, f: 1.0 });
        });
        return res;
      }
      // NaCl: Cl (f=1.0) on FCC + Na (f=0.55) shifted by (0.5,0.5,0.5)
      const fcc = [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]];
      const res = [];
      fcc.forEach(([x, y, z]) => {
        res.push({ u: x, v: y, w: z, f: 1.0 });
        res.push({ u: (x + 0.5) % 1, v: (y + 0.5) % 1, w: (z + 0.5) % 1, f: 0.52 });
      });
      return res;
    }

    function calcStructureFactor(basis, h, k, l) {
      let re = 0, im = 0;
      const phasors = [];
      basis.forEach((b) => {
        const phi = -2 * Math.PI * (h * b.u + k * b.v + l * b.w);
        const dx = b.f * Math.cos(phi);
        const dy = b.f * Math.sin(phi);
        re += dx;
        im += dy;
        phasors.push({ dx, dy });
      });
      const amp = Math.sqrt(re * re + im * im);
      return { re, im, amp, intensity: amp * amp, phasors };
    }

    function rebuild() {
      clearGroup(root);
      const basis = getBasis(state.crystal);
      const maxAmp = basis.reduce((acc, b) => acc + b.f, 0);
      const [th, tk, tl] = state.targetHKL.split(",").map(Number);

      // 3D reciprocal lattice grid h, k, l in [0..2] & [-1..2]
      const sp = 1.45;
      for (let h = -1; h <= 2; h++) {
        for (let k = -1; k <= 2; k++) {
          for (let l = -1; l <= 2; l++) {
            const pos = new THREE.Vector3((h - 0.5) * sp, (k - 0.5) * sp, (l - 0.5) * sp);
            const sf = calcStructureFactor(basis, h, k, l);
            const normAmp = sf.amp / maxAmp;
            const isSelected = h === th && k === tk && l === tl;

            if (normAmp < 1e-3) {
              // Extinct reflection -> ghost wireframe ring!
              const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.12, 0.018, 8, 18),
                new THREE.MeshBasicMaterial({ color: isSelected ? 0xf87171 : 0x475569, transparent: true, opacity: isSelected ? 0.95 : 0.45 })
              );
              ring.position.copy(pos);
              root.add(ring);
            } else {
              const r = 0.08 + 0.21 * normAmp;
              const col = isSelected ? 0xfbbf24 : (normAmp > 0.75 ? 0x38bdf8 : 0x34d399);
              root.add(SM.createAtom(r, col, { position: pos, emissiveIntensity: isSelected ? 0.55 : 0.12 }));
            }

            if (isSelected) {
              root.add(SM.createLabel(`(${h}${k}${l})`, pos.clone().add(new THREE.Vector3(0, 0.38, 0)), {
                color: normAmp < 1e-3 ? "#fca5a5" : "#fde047"
              }));
            }
          }
        }
      }

      const selSF = calcStructureFactor(basis, th, tk, tl);
      const isExtinct = selSF.amp < 1e-3;

      ui.setLegend([
        { color: "#38bdf8", label: "允许衍射倒格点 (球径 ∝ |S_hkl|)" },
        { color: "#34d399", label: "次强衍射点 (如奇偶部分相消)" },
        { color: "#475569", label: "系统消光点 S_hkl = 0 (空心环)" },
        { color: "#fbbf24", label: `当前选中检验点 (${th}${tk}${tl})` }
      ]);

      ui.setMetrics([
        { label: "检验衍射指标 (hkl)", value: `(${th}${tk}${tl})` },
        { label: "基元原子数 s", value: basis.length + " (惯用晶胞)" },
        { label: "结构因子振幅 |S|", value: selSF.amp.toFixed(2) + " f" },
        { label: "衍射判据状态", value: isExtinct ? "系统消光 (I = 0)" : "允许衍射 (相长)" }
      ]);

      drawPhasorAndXRD(basis, maxAmp, th, tk, tl, selSF);
    }

    function drawPhasorAndXRD(basis, maxAmp, th, tk, tl, selSF) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;

      // Left half: Complex plane Phasor Vector Sum! Right half: Powder XRD Stick Spectrum!
      const mid = Math.floor(w * 0.44);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 11px Inter, 'Microsoft YaHei', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`(${th}${tk}${tl}) 复平面相量叠加`, mid / 2, 16);
      ctx.fillText("允许衍射峰 XRD 指纹", mid + (w - mid) / 2, 16);

      // Phasor circle
      const cx = mid / 2;
      const cy = h / 2 + 8;
      const rad = Math.min(mid, h - 36) * 0.37;
      ctx.strokeStyle = "rgba(148,163,184,0.25)";
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - rad - 6, cy); ctx.lineTo(cx + rad + 6, cy);
      ctx.moveTo(cx, cy - rad - 6); ctx.lineTo(cx, cy + rad + 6);
      ctx.stroke();

      let curX = 0, curY = 0;
      const scale = rad / maxAmp;
      const colors = ["#38bdf8", "#34d399", "#a78bfa", "#f472b6", "#fb923c", "#2dd4bf", "#818cf8", "#e879f9"];
      selSF.phasors.forEach((ph, idx) => {
        const nx = curX + ph.dx;
        const ny = curY + ph.dy;
        ctx.strokeStyle = colors[idx % colors.length];
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx + curX * scale, cy - curY * scale);
        ctx.lineTo(cx + nx * scale, cy - ny * scale);
        ctx.stroke();
        curX = nx; curY = ny;
      });

      // Resultant vector S_hkl
      ctx.strokeStyle = selSF.amp < 1e-3 ? "#f87171" : "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + curX * scale, cy - curY * scale);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = selSF.amp < 1e-3 ? "#fca5a5" : "#fde047";
      ctx.font = "600 10.5px 'JetBrains Mono', monospace";
      ctx.fillText(selSF.amp < 1e-3 ? "S = 0 (首尾闭合消光!)" : `|S| = ${selSF.amp.toFixed(2)}`, cx, h - 8);

      // Right side XRD sticks vs h²+k²+l²
      const rx0 = mid + 14;
      const rw = w - rx0 - 12;
      const ry0 = 28;
      const rh = h - 54;
      ctx.strokeStyle = "rgba(148,163,184,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rx0, ry0, rw, rh);

      const candidates = [
        [1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0],
        [2, 1, 0], [2, 1, 1], [2, 2, 0], [3, 1, 0], [3, 1, 1], [2, 2, 2]
      ];
      candidates.forEach(([ch, ck, cl]) => {
        const N2 = ch * ch + ck * ck + cl * cl;
        const px = rx0 + ((N2 - 0.4) / 12.5) * rw;
        const csf = calcStructureFactor(basis, ch, ck, cl);
        const normI = Math.pow(csf.amp / maxAmp, 2);
        const isCur = ch === th && ck === tk && cl === tl;
        if (normI > 1e-3) {
          const barH = normI * (rh - 16);
          ctx.fillStyle = isCur ? "#fbbf24" : "#38bdf8";
          ctx.fillRect(px - 2.5, ry0 + rh - barH, 5, barH);
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "8.5px 'JetBrains Mono', monospace";
          ctx.fillText(`${ch}${ck}${cl}`, px, ry0 + rh - barH - 3);
        } else if (isCur) {
          ctx.fillStyle = "#f87171";
          ctx.font = "9px Inter, sans-serif";
          ctx.fillText(`(${ch}${ck}${cl})消光`, px, ry0 + rh - 8);
        }
      });
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("衍射峰指标 h² + k² + l²", rx0 + rw / 2, h - 8);
    }

    ui.setControls([
      {
        type: "select",
        label: "选择晶体结构 (观察消光指纹)",
        value: state.crystal,
        options: [
          { label: "简单立方 (SC — 无系统消光)", value: "SC" },
          { label: "体心立方 (BCC — h+k+l=奇数消光)", value: "BCC" },
          { label: "面心立方 (FCC — 奇偶混杂消光)", value: "FCC" },
          { label: "金刚石 (Diamond — 含(200)额外消光!)", value: "Diamond" },
          { label: "氯化钠 (NaCl — 全奇弱峰、全偶强峰)", value: "NaCl" }
        ],
        onChange: (v) => { state.crystal = v; rebuild(); }
      },
      {
        type: "pills",
        label: "点选 (hkl) 晶面检验相量干涉",
        value: state.targetHKL,
        options: [
          { label: "(100)", value: "1,0,0" },
          { label: "(110)", value: "1,1,0" },
          { label: "(111)", value: "1,1,1" },
          { label: "(200)", value: "2,0,0" },
          { label: "(211)", value: "2,1,1" },
          { label: "(220)", value: "2,2,0" }
        ],
        onChange: (v) => { state.targetHKL = v; rebuild(); }
      }
    ]);

    rebuild();
    return { onResize: () => rebuild() };
  };
})();
