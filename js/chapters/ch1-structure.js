/**
 * 第 1 章：晶体的结构 (Chapter 1: Crystal Structure)
 * 覆盖大纲：1.1 原子周期性排列 | 1.2 14种布拉菲晶格 | 1.3 晶向与米勒指数 | 1.4 典型晶体结构 | 1.5 STM 原子直接成像
 */
window.SimRegistry = window.SimRegistry || {};

(function () {
  const SM = window.SceneManager;
  const PH = window.PlotHelper;

  function clearGroup(grp) {
    grp.traverse(SM.disposeNode);
    while (grp.children.length) grp.remove(grp.children[0]);
  }

  function formatOverbar(n) {
    if (n < 0) return Math.abs(n).toString() + "\u0305";
    return n.toString();
  }

  // ============================================================================
  // 1.1 原子的周期性排列：单晶/多晶/非晶体 & 点阵+基元 & 原胞vs晶胞
  // ============================================================================
  window.SimRegistry["1-1"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.8, y: 5.2, z: 7.8 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      subMode: "order", // 'order' | 'basis' | 'primitive'
      orderType: "single", // 'single' | 'poly' | 'amorphous'
      disorder: 0.0,
      basisSep: 0.55,
      basisAngle: 35,
      cellType: "FCC"
    };

    function rebuild() {
      clearGroup(root);

      if (state.subMode === "order") {
        const a = 1.35;
        const N = 2; // -2..2 -> 5x5x3
        const pts = [];
        // Seeded pseudo-random for reproducible amorphous/polycrystal
        let seed = 42;
        const rand = () => {
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          return seed / 4294967296;
        };

        for (let ix = -N; ix <= N; ix++) {
          for (let iy = -1; iy <= 1; iy++) {
            for (let iz = -N; iz <= N; iz++) {
              let pos = new THREE.Vector3(ix * a, iy * a, iz * a);
              let color = 0x38bdf8;

              if (state.orderType === "single") {
                pos.x += (rand() - 0.5) * state.disorder * 0.6;
                pos.y += (rand() - 0.5) * state.disorder * 0.6;
                pos.z += (rand() - 0.5) * state.disorder * 0.6;
              } else if (state.orderType === "poly") {
                // 3 grains rotated differently
                const grain = ix + iz < -1 ? 0 : (ix - iz > 1 ? 1 : 2);
                const angles = [0, 0.52, -0.46];
                const colors = [0x38bdf8, 0x34d399, 0xfbbf24];
                color = colors[grain];
                pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), angles[grain]);
              } else {
                // Amorphous glass: short-range minimum distance, no long-range lattice
                pos.x += (rand() - 0.5) * a * 0.88;
                pos.y += (rand() - 0.5) * a * 0.88;
                pos.z += (rand() - 0.5) * a * 0.88;
                color = 0xf472b6;
              }

              pts.push(pos);
              root.add(SM.createAtom(0.24, color, { position: pos }));
            }
          }
        }

        // Connect nearest neighbors within cutoff
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const d = pts[i].distanceTo(pts[j]);
            if (d > 0.7 && d < a * 1.18) {
              root.add(SM.createBond(pts[i], pts[j], 0.032, 0x64748b, 0.45));
            }
          }
        }

        ui.setLegend([
          { color: "#38bdf8", label: state.orderType === "poly" ? "晶粒 A (取向1)" : "原子实位置" },
          ...(state.orderType === "poly"
            ? [{ color: "#34d399", label: "晶粒 B (取向2)" }, { color: "#fbbf24", label: "晶粒 C (取向3)" }]
            : [{ color: "#f472b6", label: "非晶无序位点" }])
        ]);

        ui.setMetrics([
          { label: "当前凝聚形态", value: state.orderType === "single" ? "单晶体" : state.orderType === "poly" ? "多晶体" : "非晶态" },
          { label: "短程有序性", value: "存在 (最近邻峰)" },
          { label: "长程周期性", value: state.orderType === "single" ? "严格长程有序" : state.orderType === "poly" ? "晶粒内有序" : "无 (长程平坦)" },
          { label: "宏观各向异性", value: state.orderType === "single" ? "各向异性" : "统计各向同性" }
        ]);
      } else if (state.subMode === "basis") {
        const a = 1.8;
        const rad = (state.basisAngle * Math.PI) / 180;
        const offsetB = new THREE.Vector3(
          Math.cos(rad) * state.basisSep,
          Math.sin(rad) * state.basisSep,
          0.2 * state.basisSep
        );

        for (let ix = -1; ix <= 1; ix++) {
          for (let iy = -1; iy <= 1; iy++) {
            for (let iz = -1; iz <= 1; iz++) {
              const R = new THREE.Vector3(ix * a, iy * a, iz * a);
              // Lattice point marker
              root.add(SM.createAtom(0.11, 0x94a3b8, { position: R, opacity: 0.55 }));
              // Basis Atom A & Atom B
              const pA = R.clone().sub(offsetB.clone().multiplyScalar(0.5));
              const pB = R.clone().add(offsetB.clone().multiplyScalar(0.5));
              root.add(SM.createAtom(0.24, 0x38bdf8, { position: pA }));
              root.add(SM.createAtom(0.19, 0xfbbf24, { position: pB }));
              root.add(SM.createBond(pA, pB, 0.055, 0xf8fafc, 0.9));
            }
          }
        }
        // Grid lines of Bravais lattice
        const box = SM.createParallelepiped(
          new THREE.Vector3(a * 2, 0, 0),
          new THREE.Vector3(0, a * 2, 0),
          new THREE.Vector3(0, 0, a * 2),
          new THREE.Vector3(-a, -a, -a),
          0x475569,
          0
        );
        root.add(box);

        ui.setLegend([
          { color: "#94a3b8", label: "数学布拉菲格点 R" },
          { color: "#38bdf8", label: "基元原子 A" },
          { color: "#fbbf24", label: "基元原子 B" }
        ]);
        ui.setMetrics([
          { label: "布拉菲点阵", value: "简单立方点阵" },
          { label: "基元原子数 s", value: "2 (双原子基元)" },
          { label: "基元键长 d", value: state.basisSep.toFixed(2) + " Å" },
          { label: "基元取向角", value: state.basisAngle + "°" }
        ]);
      } else {
        // Primitive vs Conventional cell (FCC or BCC)
        const a = 3.2;
        const orig = new THREE.Vector3(-a / 2, -a / 2, -a / 2);
        root.add(SM.createParallelepiped(
          new THREE.Vector3(a, 0, 0),
          new THREE.Vector3(0, a, 0),
          new THREE.Vector3(0, 0, a),
          orig,
          0x94a3b8,
          0.04
        ));

        const pts = [];
        for (let i = 0; i <= 1; i++) {
          for (let j = 0; j <= 1; j++) {
            for (let k = 0; k <= 1; k++) {
              pts.push(new THREE.Vector3((i - 0.5) * a, (j - 0.5) * a, (k - 0.5) * a));
            }
          }
        }
        if (state.cellType === "FCC") {
          pts.push(
            new THREE.Vector3(0, 0, -a / 2), new THREE.Vector3(0, 0, a / 2),
            new THREE.Vector3(0, -a / 2, 0), new THREE.Vector3(0, a / 2, 0),
            new THREE.Vector3(-a / 2, 0, 0), new THREE.Vector3(a / 2, 0, 0)
          );
          const a1 = new THREE.Vector3(0, a / 2, a / 2);
          const a2 = new THREE.Vector3(a / 2, 0, a / 2);
          const a3 = new THREE.Vector3(a / 2, a / 2, 0);
          root.add(SM.createParallelepiped(a1, a2, a3, orig, 0x34d399, 0.28));
          root.add(SM.createArrow(orig, a1, a1.length(), 0xf87171));
          root.add(SM.createArrow(orig, a2, a2.length(), 0x4ade80));
          root.add(SM.createArrow(orig, a3, a3.length(), 0x60a5fa));
          root.add(SM.createLabel("a₁", orig.clone().add(a1).add(new THREE.Vector3(0, 0.25, 0)), { color: "#fca5a5" }));
          root.add(SM.createLabel("a₂", orig.clone().add(a2).add(new THREE.Vector3(0.25, 0, 0)), { color: "#86efac" }));
          root.add(SM.createLabel("a₃", orig.clone().add(a3).add(new THREE.Vector3(0.25, 0.25, 0)), { color: "#93c5fd" }));
        } else {
          // BCC primitive cell
          pts.push(new THREE.Vector3(0, 0, 0));
          const a1 = new THREE.Vector3(-a / 2, a / 2, a / 2);
          const a2 = new THREE.Vector3(a / 2, -a / 2, a / 2);
          const a3 = new THREE.Vector3(a / 2, a / 2, -a / 2);
          // Shift origin to center or corner so primitive cell stays visual
          const pOrig = new THREE.Vector3(-a / 2, -a / 2, -a / 2);
          const b1 = new THREE.Vector3(a, 0, 0);
          const b2 = new THREE.Vector3(0, a, 0);
          const b3 = new THREE.Vector3(a / 2, a / 2, a / 2);
          root.add(SM.createParallelepiped(b1, b2, b3, pOrig, 0x34d399, 0.28));
          root.add(SM.createArrow(pOrig, b1, b1.length(), 0xf87171));
          root.add(SM.createArrow(pOrig, b2, b2.length(), 0x4ade80));
          root.add(SM.createArrow(pOrig, b3, b3.length(), 0x60a5fa));
          root.add(SM.createLabel("a₃(体心)", pOrig.clone().add(b3).add(new THREE.Vector3(0, 0.28, 0)), { color: "#93c5fd" }));
        }

        pts.forEach((p) => root.add(SM.createAtom(0.22, 0x38bdf8, { position: p })));

        ui.setLegend([
          { color: "#94a3b8", label: "惯用晶胞 (立方体 V = a³)" },
          { color: "#34d399", label: "固体物理学原胞 (仅含 1 个格点)" },
          { color: "#38bdf8", label: "布拉菲格点" }
        ]);
        const nConv = state.cellType === "FCC" ? 4 : 2;
        ui.setMetrics([
          { label: "晶格类型", value: state.cellType },
          { label: "惯用晶胞格点数", value: nConv + " 个" },
          { label: "原胞格点数", value: "1 个" },
          { label: "原胞体积 V_p", value: state.cellType === "FCC" ? "a³ / 4" : "a³ / 2" }
        ]);
      }

      drawPlot();
    }

    function drawPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0.4, xMax: 3.4, yMin: 0, yMax: 4.2,
        title: "径向分布函数 g(r) — 长程有序 vs 短程有序表征",
        xLabel: "归一化原子间距 r / r₀",
        yLabel: "g(r)"
      });

      // Reference g(r) = 1 line
      PH.drawCurve(ctx, map, [[0.4, 1], [3.4, 1]], { color: "rgba(148,163,184,0.35)", dash: [4, 4], width: 1 });

      const pts = [];
      const peaks = [
        [1.0, 3.6], [1.414, 2.3], [1.732, 2.0], [2.0, 2.5], [2.236, 1.9], [2.828, 1.7], [3.0, 1.8]
      ];
      for (let r = 0.4; r <= 3.4; r += 0.015) {
        let g = 0;
        if (state.orderType === "single" && state.subMode === "order") {
          const sigma = 0.045 + state.disorder * 0.14;
          peaks.forEach(([pr, amp]) => {
            g += amp * Math.exp(-Math.pow(r - pr, 2) / (2 * sigma * sigma));
          });
        } else if (state.orderType === "poly" && state.subMode === "order") {
          peaks.forEach(([pr, amp], idx) => {
            const sigma = 0.065 + idx * 0.018;
            g += amp * 0.85 * Math.exp(-Math.pow(r - pr, 2) / (2 * sigma * sigma));
          });
        } else if (state.orderType === "amorphous" && state.subMode === "order") {
          // Damped oscillation around 1 for r > 1
          if (r > 0.78) {
            g = 1 + 2.1 * Math.exp(-1.25 * (r - 0.95)) * Math.cos(2 * Math.PI * (r - 1.0));
            g = Math.max(0, g);
          }
        } else {
          peaks.forEach(([pr, amp]) => {
            g += amp * Math.exp(-Math.pow(r - pr, 2) / (2 * 0.05 * 0.05));
          });
        }
        pts.push([r, Math.min(4.05, g)]);
      }

      PH.drawCurve(ctx, map, pts, {
        color: state.orderType === "amorphous" && state.subMode === "order" ? "#f472b6" : "#38bdf8",
        fill: "rgba(56, 189, 248, 0.12)",
        width: 2.2
      });
    }

    function buildControls() {
      const ctrls = [
        {
          type: "pills",
          label: "实验子模块",
          value: state.subMode,
          options: [
            { label: "晶体/非晶体", value: "order" },
            { label: "点阵 + 基元", value: "basis" },
            { label: "原胞 vs 晶胞", value: "primitive" }
          ],
          onChange: (v) => { state.subMode = v; buildControls(); rebuild(); }
        }
      ];

      if (state.subMode === "order") {
        ctrls.push(
          {
            type: "pills",
            label: "固体微观有序类型",
            value: state.orderType,
            options: [
              { label: "单晶体", value: "single" },
              { label: "多晶体", value: "poly" },
              { label: "非晶玻璃", value: "amorphous" }
            ],
            onChange: (v) => { state.orderType = v; rebuild(); }
          },
          {
            type: "slider",
            label: "单晶热涨落/微畸变度",
            min: 0, max: 0.5, step: 0.02, value: state.disorder,
            unit: "",
            onChange: (v) => { state.disorder = v; rebuild(); }
          }
        );
      } else if (state.subMode === "basis") {
        ctrls.push(
          {
            type: "slider",
            label: "基元内原子间距 d",
            min: 0.25, max: 0.95, step: 0.05, value: state.basisSep,
            unit: " Å",
            onChange: (v) => { state.basisSep = v; rebuild(); }
          },
          {
            type: "slider",
            label: "基元空间取向角 φ",
            min: 0, max: 180, step: 5, value: state.basisAngle,
            unit: "°",
            onChange: (v) => { state.basisAngle = v; rebuild(); }
          }
        );
      } else {
        ctrls.push({
          type: "pills",
          label: "立方复式晶胞选择",
          value: state.cellType,
          options: [
            { label: "面心立方 (FCC)", value: "FCC" },
            { label: "体心立方 (BCC)", value: "BCC" }
          ],
          onChange: (v) => { state.cellType = v; rebuild(); }
        });
      }

      ui.setControls(ctrls);
    }

    buildControls();
    rebuild();

    return {
      update(dt, elapsed) {
        if (state.subMode === "basis") {
          root.rotation.y = Math.sin(elapsed * 0.35) * 0.12;
        }
      },
      onResize: drawPlot
    };
  };

  // ============================================================================
  // 1.2 晶格的基本类型：7大晶系14种布拉菲点阵 + 配位数与致密度
  // ============================================================================
  const BRAVAIS_14 = [
    { id: "cP", sys: "立方晶系 (Cubic)", name: "简单立方 (SC / cP)", a: 1, b: 1, c: 1, al: 90, be: 90, ga: 90, centering: "P", z: 6, n: 1, eta: 52.4 },
    { id: "cI", sys: "立方晶系 (Cubic)", name: "体心立方 (BCC / cI)", a: 1, b: 1, c: 1, al: 90, be: 90, ga: 90, centering: "I", z: 8, n: 2, eta: 68.0 },
    { id: "cF", sys: "立方晶系 (Cubic)", name: "面心立方 (FCC / cF)", a: 1, b: 1, c: 1, al: 90, be: 90, ga: 90, centering: "F", z: 12, n: 4, eta: 74.0 },
    { id: "tP", sys: "四方晶系 (Tetragonal)", name: "简单四方 (tP)", a: 1, b: 1, c: 1.42, al: 90, be: 90, ga: 90, centering: "P", z: 4, n: 1, eta: 45.0 },
    { id: "tI", sys: "四方晶系 (Tetragonal)", name: "体心四方 (tI)", a: 1, b: 1, c: 1.42, al: 90, be: 90, ga: 90, centering: "I", z: 8, n: 2, eta: 62.0 },
    { id: "oP", sys: "正交晶系 (Orthorhombic)", name: "简单正交 (oP)", a: 0.85, b: 1.12, c: 1.42, al: 90, be: 90, ga: 90, centering: "P", z: 2, n: 1, eta: 40.0 },
    { id: "oC", sys: "正交晶系 (Orthorhombic)", name: "底心正交 (oC)", a: 0.85, b: 1.15, c: 1.38, al: 90, be: 90, ga: 90, centering: "C", z: 4, n: 2, eta: 54.0 },
    { id: "oI", sys: "正交晶系 (Orthorhombic)", name: "体心正交 (oI)", a: 0.85, b: 1.12, c: 1.42, al: 90, be: 90, ga: 90, centering: "I", z: 8, n: 2, eta: 59.0 },
    { id: "oF", sys: "正交晶系 (Orthorhombic)", name: "面心正交 (oF)", a: 0.88, b: 1.12, c: 1.38, al: 90, be: 90, ga: 90, centering: "F", z: 12, n: 4, eta: 66.0 },
    { id: "hP", sys: "六方晶系 (Hexagonal)", name: "简单六方 (hP)", a: 1, b: 1, c: 1.35, al: 90, be: 90, ga: 120, centering: "P", z: 6, n: 1, eta: 60.5 },
    { id: "hR", sys: "三方晶系 (Trigonal)", name: "菱方点阵 (hR)", a: 1.08, b: 1.08, c: 1.08, al: 72, be: 72, ga: 72, centering: "P", z: 6, n: 1, eta: 58.0 },
    { id: "mP", sys: "单斜晶系 (Monoclinic)", name: "简单单斜 (mP)", a: 0.9, b: 1.15, c: 1.32, al: 90, be: 112, ga: 90, centering: "P", z: 2, n: 1, eta: 42.0 },
    { id: "mC", sys: "单斜晶系 (Monoclinic)", name: "底心单斜 (mC)", a: 0.9, b: 1.15, c: 1.32, al: 90, be: 112, ga: 90, centering: "C", z: 4, n: 2, eta: 53.0 },
    { id: "aP", sys: "三斜晶系 (Triclinic)", name: "三斜点阵 (aP)", a: 0.92, b: 1.15, c: 1.35, al: 78, be: 108, ga: 102, centering: "P", z: 2, n: 1, eta: 39.0 }
  ];

  function latticeVectors(a, b, c, alphaDeg, betaDeg, gammaDeg) {
    const al = (alphaDeg * Math.PI) / 180;
    const be = (betaDeg * Math.PI) / 180;
    const ga = (gammaDeg * Math.PI) / 180;
    const v1 = new THREE.Vector3(a, 0, 0);
    const v2 = new THREE.Vector3(b * Math.cos(ga), 0, b * Math.sin(ga));
    const cx = c * Math.cos(be);
    const cz = (c * (Math.cos(al) - Math.cos(be) * Math.cos(ga))) / Math.sin(ga);
    const cy = Math.sqrt(Math.max(0.01, c * c - cx * cx - cz * cz));
    const v3 = new THREE.Vector3(cx, cy, cz);
    return [v1, v2, v3];
  }

  window.SimRegistry["1-2"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.5, z: 6.5 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      bravaisId: "cF",
      radiusScale: 0.42, // 1.0 = touching hard spheres
      showCoord: true,
      colorByWeight: true
    };

    function getTouchRadius(id, scale) {
      if (id === "cP") return 0.5 * scale;
      if (id === "cI") return (Math.sqrt(3) / 4) * scale;
      if (id === "cF") return (Math.sqrt(2) / 4) * scale;
      return 0.36 * scale;
    }

    function rebuild() {
      clearGroup(root);
      const item = BRAVAIS_14.find((x) => x.id === state.bravaisId) || BRAVAIS_14[2];
      const S = 2.8;
      const [a1, a2, a3] = latticeVectors(item.a * S, item.b * S, item.c * S, item.al, item.be, item.ga);
      const centerShift = a1.clone().add(a2).add(a3).multiplyScalar(-0.5);

      root.add(SM.createParallelepiped(a1, a2, a3, centerShift, 0x60a5fa, 0.06));

      // Fractional coordinates with sharing weight
      const frac = [];
      for (let i = 0; i <= 1; i++) {
        for (let j = 0; j <= 1; j++) {
          for (let k = 0; k <= 1; k++) {
            frac.push({ u: i, v: j, w: k, role: "corner", share: "1/8", color: 0x38bdf8 });
          }
        }
      }
      if (item.centering === "I") {
        frac.push({ u: 0.5, v: 0.5, w: 0.5, role: "body", share: "1", color: 0xfbbf24 });
      } else if (item.centering === "C") {
        frac.push(
          { u: 0.5, v: 0.5, w: 0, role: "base", share: "1/2", color: 0x34d399 },
          { u: 0.5, v: 0.5, w: 1, role: "base", share: "1/2", color: 0x34d399 }
        );
      } else if (item.centering === "F") {
        [
          [0.5, 0.5, 0], [0.5, 0.5, 1],
          [0.5, 0, 0.5], [0.5, 1, 0.5],
          [0, 0.5, 0.5], [1, 0.5, 0.5]
        ].forEach(([u, v, w]) => frac.push({ u, v, w, role: "face", share: "1/2", color: 0x34d399 }));
      }

      const touchR = getTouchRadius(item.id, S);
      const atomR = touchR * state.radiusScale;

      const worldPts = [];
      frac.forEach((f) => {
        const p = centerShift.clone()
          .addScaledVector(a1, f.u)
          .addScaledVector(a2, f.v)
          .addScaledVector(a3, f.w);
        const col = state.colorByWeight ? f.color : 0x38bdf8;
        root.add(SM.createAtom(atomR, col, { position: p }));
        worldPts.push({ p, role: f.role });
      });

      // Basis vectors arrows
      root.add(SM.createArrow(centerShift, a1, a1.length(), 0xf87171, 0.22, 0.08));
      root.add(SM.createArrow(centerShift, a2, a2.length(), 0x4ade80, 0.22, 0.08));
      root.add(SM.createArrow(centerShift, a3, a3.length(), 0x60a5fa, 0.22, 0.08));
      root.add(SM.createLabel("a", centerShift.clone().add(a1).add(new THREE.Vector3(0.2, 0, 0)), { color: "#fca5a5" }));
      root.add(SM.createLabel("b", centerShift.clone().add(a2).add(new THREE.Vector3(0, 0, 0.2)), { color: "#86efac" }));
      root.add(SM.createLabel("c", centerShift.clone().add(a3).add(new THREE.Vector3(0, 0.22, 0)), { color: "#93c5fd" }));

      // Nearest-neighbor coordination bonds
      if (state.showCoord) {
        let minD = Infinity;
        for (let i = 0; i < worldPts.length; i++) {
          for (let j = i + 1; j < worldPts.length; j++) {
            const d = worldPts[i].p.distanceTo(worldPts[j].p);
            if (d > 0.1 && d < minD) minD = d;
          }
        }
        for (let i = 0; i < worldPts.length; i++) {
          for (let j = i + 1; j < worldPts.length; j++) {
            const d = worldPts[i].p.distanceTo(worldPts[j].p);
            if (Math.abs(d - minD) < 0.08) {
              root.add(SM.createBond(worldPts[i].p, worldPts[j].p, 0.038, 0xfbbf24, 0.68));
            }
          }
        }
      }

      ui.setLegend([
        { color: "#38bdf8", label: "顶角格点 (权重 1/8)" },
        { color: "#34d399", label: "面心/底心格点 (权重 1/2)" },
        { color: "#fbbf24", label: "体心格点 (权重 1) / 最近邻键" }
      ]);

      ui.setMetrics([
        { label: "所属晶系", value: item.sys.split(" ")[0] },
        { label: "晶胞有效格点数 N", value: item.n + " 个" },
        { label: "最近邻配位数 Z", value: item.z + "" },
        { label: "最大刚球致密度 η", value: item.eta.toFixed(1) + "%" }
      ]);

      drawPlot(item);
    }

    function drawPlot(current) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: 5, yMin: 0, yMax: 85,
        title: "典型晶体结构空间致密度 η (%) 对比",
        xLabel: "晶体结构类型",
        yLabel: "致密度 (%)",
        xTickLabels: [
          { val: 0.5, text: "金刚石" },
          { val: 1.5, text: "SC" },
          { val: 2.5, text: "BCC" },
          { val: 3.5, text: "FCC/HCP" },
          { val: 4.5, text: "当前" }
        ]
      });

      const bars = [
        { x: 0.5, v: 34.0, c: "#94a3b8" },
        { x: 1.5, v: 52.4, c: current.id === "cP" ? "#fbbf24" : "#38bdf8" },
        { x: 2.5, v: 68.0, c: current.id === "cI" ? "#fbbf24" : "#38bdf8" },
        { x: 3.5, v: 74.0, c: current.id === "cF" ? "#fbbf24" : "#38bdf8" },
        { x: 4.5, v: current.eta, c: "#34d399" }
      ];

      bars.forEach((b) => {
        const bx = map.toX(b.x) - 15;
        const by = map.toY(b.v);
        const bh = map.toY(0) - by;
        ctx.fillStyle = b.c;
        ctx.fillRect(bx, by, 30, bh);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(b.v.toFixed(1) + "%", bx + 15, by - 5);
      });
    }

    ui.setControls([
      {
        type: "select",
        label: "选择 14 种布拉菲晶格",
        value: state.bravaisId,
        options: BRAVAIS_14.map((b) => ({ label: `${b.sys.split(" ")[0]} · ${b.name}`, value: b.id })),
        onChange: (v) => { state.bravaisId = v; rebuild(); }
      },
      {
        type: "slider",
        label: "原子球半径比例 (1.0 = 刚球相切)",
        min: 0.25, max: 1.0, step: 0.03, value: state.radiusScale,
        unit: "×R_max",
        onChange: (v) => { state.radiusScale = v; rebuild(); }
      },
      {
        type: "pills",
        label: "快速模式切换",
        value: state.radiusScale >= 0.98 ? "pack" : "ball",
        options: [
          { label: "球棍观察模型", value: "ball" },
          { label: "刚球相切密堆积", value: "pack" }
        ],
        onChange: (v) => {
          state.radiusScale = v === "pack" ? 1.0 : 0.42;
          rebuild();
        }
      },
      {
        type: "checkbox",
        label: "高亮最近邻配位连线",
        value: state.showCoord,
        onChange: (v) => { state.showCoord = v; rebuild(); }
      },
      {
        type: "checkbox",
        label: "按晶胞共享权重着色 (1/8, 1/2, 1)",
        value: state.colorByWeight,
        onChange: (v) => { state.colorByWeight = v; rebuild(); }
      }
    ]);

    rebuild();
    return { onResize: () => rebuild() };
  };

  // ============================================================================
  // 1.3 晶向指数 [uvw] 与晶面米勒指数 (hkl)
  // ============================================================================
  window.SimRegistry["1-3"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.2, y: 4.8, z: 6.8 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      h: 1, k: 1, l: 1,
      u: 1, v: 1, w: 1,
      showFamily: true,
      lattice: "FCC"
    };

    function rebuild() {
      clearGroup(root);
      const a = 3.2;
      const offset = new THREE.Vector3(-a / 2, -a / 2, -a / 2);

      // Unit cube wireframe + crystallographic axes (x->a1, y->a2, z->a3)
      root.add(SM.createParallelepiped(
        new THREE.Vector3(a, 0, 0),
        new THREE.Vector3(0, a, 0),
        new THREE.Vector3(0, 0, a),
        offset,
        0x94a3b8,
        0.03
      ));

      root.add(SM.createArrow(offset, new THREE.Vector3(1, 0, 0), a * 1.22, 0xf87171, 0.22, 0.08));
      root.add(SM.createArrow(offset, new THREE.Vector3(0, 1, 0), a * 1.22, 0x4ade80, 0.22, 0.08));
      root.add(SM.createArrow(offset, new THREE.Vector3(0, 0, 1), a * 1.22, 0x60a5fa, 0.22, 0.08));
      root.add(SM.createLabel("X [100]", offset.clone().add(new THREE.Vector3(a * 1.32, 0, 0)), { color: "#fca5a5" }));
      root.add(SM.createLabel("Y [010]", offset.clone().add(new THREE.Vector3(0, a * 1.32, 0)), { color: "#86efac" }));
      root.add(SM.createLabel("Z [001]", offset.clone().add(new THREE.Vector3(0, 0, a * 1.32)), { color: "#93c5fd" }));

      // Lattice atoms
      const fracPts = [];
      for (let i = 0; i <= 1; i++)
        for (let j = 0; j <= 1; j++)
          for (let m = 0; m <= 1; m++) fracPts.push([i, j, m]);
      if (state.lattice === "BCC") fracPts.push([0.5, 0.5, 0.5]);
      if (state.lattice === "FCC") {
        fracPts.push([0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]);
      }

      const { h, k, l, u, v, w } = state;
      const validPlane = !(h === 0 && k === 0 && l === 0);

      fracPts.forEach(([fx, fy, fz]) => {
        const p = new THREE.Vector3(fx * a + offset.x, fy * a + offset.y, fz * a + offset.z);
        const val = h * fx + k * fy + l * fz;
        const onMainPlane = validPlane && Math.abs(val - 1) < 1e-4;
        const onAnyPlane = validPlane && Math.abs(val - Math.round(val)) < 1e-4;
        const col = onMainPlane ? 0xfbbf24 : (state.showFamily && onAnyPlane ? 0x38bdf8 : 0x64748b);
        root.add(SM.createAtom(onMainPlane ? 0.2 : 0.14, col, { position: p }));
      });

      // Render Miller planes h*x + k*y + l*z = m
      if (validPlane) {
        const cList = state.showFamily ? [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6] : [1];
        cList.forEach((m) => {
          if (!state.showFamily && m !== 1) return;
          const isPrimary = m === 1 || (h <= 0 && k <= 0 && l <= 0 && m === -1);
          const poly = SM.createClippedMillerPlane(
            h, k, l, m, a, offset,
            isPrimary ? 0x38bdf8 : 0x818cf8,
            isPrimary ? 0.48 : 0.22
          );
          if (poly) root.add(poly);
        });
      }

      // Render Direction [uvw] vector starting from suitable cube corner so it stays inside/near cube
      if (!(u === 0 && v === 0 && w === 0)) {
        const startFrac = new THREE.Vector3(u < 0 ? 1 : 0, v < 0 ? 1 : 0, w < 0 ? 1 : 0);
        const maxComp = Math.max(Math.abs(u), Math.abs(v), Math.abs(w));
        const dirVec = new THREE.Vector3(u / maxComp, v / maxComp, w / maxComp);
        const startWorld = offset.clone().addScaledVector(startFrac, a);
        const lengthWorld = dirVec.length() * a;
        root.add(SM.createArrow(startWorld, dirVec, lengthWorld, 0x34d399, 0.28, 0.11));
        const tipWorld = startWorld.clone().addScaledVector(dirVec.clone().normalize(), lengthWorld + 0.3);
        const dirStr = `[${formatOverbar(u)}${formatOverbar(v)}${formatOverbar(w)}]`;
        root.add(SM.createLabel(dirStr, tipWorld, { color: "#6ee7b7" }));
      }

      const hklStr = validPlane ? `(${formatOverbar(h)}${formatOverbar(k)}${formatOverbar(l)})` : "(无效 000)";
      const dRatio = validPlane ? 1 / Math.sqrt(h * h + k * k + l * l) : 0;

      ui.setLegend([
        { color: "#38bdf8", label: `主晶面 ${hklStr} (截距倒数)` },
        { color: "#818cf8", label: "平行等价晶面族切片" },
        { color: "#34d399", label: `晶向矢量 [${formatOverbar(u)}${formatOverbar(v)}${formatOverbar(w)}]` },
        { color: "#fbbf24", label: "位于主晶面上的原子" }
      ]);

      const dotAngle = (validPlane && !(u === 0 && v === 0 && w === 0))
        ? Math.acos(
          Math.max(-1, Math.min(1, (h * u + k * v + l * w) /
            (Math.sqrt(h * h + k * k + l * l) * Math.sqrt(u * u + v * v + w * w))))
        ) * (180 / Math.PI)
        : 0;

      ui.setMetrics([
        { label: "当前晶面米勒指数", value: hklStr },
        { label: "晶面间距 d_hkl / a", value: validPlane ? dRatio.toFixed(3) : "—" },
        { label: "当前晶向指数", value: `[${formatOverbar(u)}${formatOverbar(v)}${formatOverbar(w)}]` },
        { label: "晶向与晶面法向夹角", value: dotAngle.toFixed(1) + "°" }
      ]);

      drawPlot(dRatio, hklStr);
    }

    function drawPlot(curD, curLabel) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: 6, yMin: 0, yMax: 1.12,
        title: "立方晶系不同 (hkl) 晶面间距 d_hkl / a 递减规律",
        xLabel: "晶面指数 (hkl)",
        yLabel: "d / a",
        xTickLabels: [
          { val: 0.5, text: "(100)" },
          { val: 1.5, text: "(110)" },
          { val: 2.5, text: "(111)" },
          { val: 3.5, text: "(200)" },
          { val: 4.5, text: "(210)" },
          { val: 5.5, text: curLabel }
        ]
      });

      const items = [
        [0.5, 1.0, "#38bdf8"],
        [1.5, 1 / Math.sqrt(2), "#38bdf8"],
        [2.5, 1 / Math.sqrt(3), "#38bdf8"],
        [3.5, 0.5, "#38bdf8"],
        [4.5, 1 / Math.sqrt(5), "#38bdf8"],
        [5.5, curD, "#fbbf24"]
      ];
      items.forEach(([x, val, col]) => {
        const bx = map.toX(x) - 13;
        const by = map.toY(val);
        ctx.fillStyle = col;
        ctx.fillRect(bx, by, 26, map.toY(0) - by);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "9.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(val.toFixed(2), bx + 13, by - 4);
      });
    }

    function syncControls() {
      ui.setControls([
        {
          type: "pills",
          label: "经典晶面预设",
          value: `${state.h},${state.k},${state.l}`,
          options: [
            { label: "(100)", value: "1,0,0" },
            { label: "(110)", value: "1,1,0" },
            { label: "(111)", value: "1,1,1" },
            { label: "(211)", value: "2,1,1" },
            { label: "(1̅10)", value: "-1,1,0" }
          ],
          onChange: (val) => {
            const [nh, nk, nl] = val.split(",").map(Number);
            state.h = nh; state.k = nk; state.l = nl;
            state.u = nh; state.v = nk; state.w = nl;
            syncControls();
            rebuild();
          }
        },
        {
          type: "slider", label: "米勒指数 h", min: -3, max: 3, step: 1, value: state.h, unit: "",
          onChange: (v) => { state.h = v; rebuild(); }
        },
        {
          type: "slider", label: "米勒指数 k", min: -3, max: 3, step: 1, value: state.k, unit: "",
          onChange: (v) => { state.k = v; rebuild(); }
        },
        {
          type: "slider", label: "米勒指数 l", min: -3, max: 3, step: 1, value: state.l, unit: "",
          onChange: (v) => { state.l = v; rebuild(); }
        },
        {
          type: "slider", label: "晶向指数 u", min: -3, max: 3, step: 1, value: state.u, unit: "",
          onChange: (v) => { state.u = v; rebuild(); }
        },
        {
          type: "slider", label: "晶向指数 v", min: -3, max: 3, step: 1, value: state.v, unit: "",
          onChange: (v) => { state.v = v; rebuild(); }
        },
        {
          type: "slider", label: "晶向指数 w", min: -3, max: 3, step: 1, value: state.w, unit: "",
          onChange: (v) => { state.w = v; rebuild(); }
        },
        {
          type: "pills",
          label: "背景点阵参考",
          value: state.lattice,
          options: [
            { label: "SC", value: "SC" },
            { label: "BCC", value: "BCC" },
            { label: "FCC", value: "FCC" }
          ],
          onChange: (v) => { state.lattice = v; rebuild(); }
        },
        {
          type: "checkbox",
          label: "显示整组平行等距晶面族",
          value: state.showFamily,
          onChange: (v) => { state.showFamily = v; rebuild(); }
        }
      ]);
    }

    syncControls();
    rebuild();
    return { onResize: () => rebuild() };
  };

  // ============================================================================
  // 1.4 简单的典型晶体结构：NaCl, CsCl, 金刚石, 闪锌矿 ZnS, 六角密排 HCP/FCC
  // ============================================================================
  window.SimRegistry["1-4"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.4, y: 4.8, z: 7.2 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      crystal: "Diamond", // 'NaCl' | 'CsCl' | 'Diamond' | 'ZnS' | 'HCP' | 'FCC_stack'
      layerSpread: 1.0,
      showBonds: true
    };

    function fccSites() {
      const s = [];
      for (let i = 0; i <= 1; i++)
        for (let j = 0; j <= 1; j++)
          for (let k = 0; k <= 1; k++) s.push([i, j, k]);
      s.push([0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]);
      return s;
    }

    function rebuild() {
      clearGroup(root);
      const a = 3.4;
      const off = new THREE.Vector3(-a / 2, -a / 2, -a / 2);

      if (state.crystal === "NaCl") {
        root.add(SM.createParallelepiped(new THREE.Vector3(a, 0, 0), new THREE.Vector3(0, a, 0), new THREE.Vector3(0, 0, a), off, 0x64748b, 0.03));
        const cl = [];
        const na = [];
        for (let ix = 0; ix <= 2; ix++) {
          for (let iy = 0; iy <= 2; iy++) {
            for (let iz = 0; iz <= 2; iz++) {
              const p = new THREE.Vector3((ix / 2) * a + off.x, (iy / 2) * a + off.y, (iz / 2) * a + off.z);
              if ((ix + iy + iz) % 2 === 0) {
                root.add(SM.createAtom(0.25, 0x34d399, { position: p }));
                cl.push(p);
              } else {
                root.add(SM.createAtom(0.17, 0xa78bfa, { position: p }));
                na.push(p);
              }
            }
          }
        }
        if (state.showBonds) {
          na.forEach((p1) => {
            cl.forEach((p2) => {
              if (Math.abs(p1.distanceTo(p2) - a / 2) < 0.05) {
                root.add(SM.createBond(p1, p2, 0.032, 0x94a3b8, 0.65));
              }
            });
          });
        }
        ui.setLegend([{ color: "#a78bfa", label: "Na⁺ 阳离子 (八面体配位 Z=6)" }, { color: "#34d399", label: "Cl⁻ 阴离子 (FCC 子晶格)" }]);
        ui.setMetrics([
          { label: "晶体类型", value: "氯化钠 (NaCl)" },
          { label: "布拉菲点阵", value: "面心立方 (FCC)" },
          { label: "基元构成", value: "1 Na⁺ + 1 Cl⁻" },
          { label: "最近邻配位数", value: "6 (正八面体)" }
        ]);
      } else if (state.crystal === "CsCl") {
        // Show 2x2x2 SC cells for rich CsCl view
        const cellA = 2.0;
        for (let cx = -1; cx <= 0; cx++) {
          for (let cy = -1; cy <= 0; cy++) {
            for (let cz = -1; cz <= 0; cz++) {
              const cOrig = new THREE.Vector3(cx * cellA, cy * cellA, cz * cellA);
              root.add(SM.createParallelepiped(new THREE.Vector3(cellA, 0, 0), new THREE.Vector3(0, cellA, 0), new THREE.Vector3(0, 0, cellA), cOrig, 0x64748b, 0.02));
              const centerCs = cOrig.clone().add(new THREE.Vector3(cellA / 2, cellA / 2, cellA / 2));
              root.add(SM.createAtom(0.27, 0xfbbf24, { position: centerCs }));
              for (let i = 0; i <= 1; i++)
                for (let j = 0; j <= 1; j++)
                  for (let k = 0; k <= 1; k++) {
                    const cornerCl = cOrig.clone().add(new THREE.Vector3(i * cellA, j * cellA, k * cellA));
                    if (state.showBonds) root.add(SM.createBond(centerCs, cornerCl, 0.032, 0xfde68a, 0.55));
                  }
            }
          }
        }
        for (let ix = -1; ix <= 1; ix++)
          for (let iy = -1; iy <= 1; iy++)
            for (let iz = -1; iz <= 1; iz++) {
              root.add(SM.createAtom(0.22, 0x34d399, { position: new THREE.Vector3(ix * cellA, iy * cellA, iz * cellA) }));
            }

        ui.setLegend([{ color: "#fbbf24", label: "Cs⁺ 位于立方体心 (1/2,1/2,1/2)" }, { color: "#34d399", label: "Cl⁻ 位于顶角 (0,0,0)" }]);
        ui.setMetrics([
          { label: "晶体类型", value: "氯化铯 (CsCl)" },
          { label: "布拉菲点阵", value: "简单立方 (SC! 非BCC)" },
          { label: "基元构成", value: "Cs⁺(000)+Cl⁻(½½½)" },
          { label: "最近邻配位数", value: "8 (立方体配位)" }
        ]);
      } else if (state.crystal === "Diamond" || state.crystal === "ZnS") {
        const isZnS = state.crystal === "ZnS";
        root.add(SM.createParallelepiped(new THREE.Vector3(a, 0, 0), new THREE.Vector3(0, a, 0), new THREE.Vector3(0, 0, a), off, 0x64748b, 0.04));
        const subA = fccSites().map(([x, y, z]) => new THREE.Vector3(x * a + off.x, y * a + off.y, z * a + off.z));
        const innerFrac = [[0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75]];
        const subB = innerFrac.map(([x, y, z]) => new THREE.Vector3(x * a + off.x, y * a + off.y, z * a + off.z));

        subA.forEach((p) => root.add(SM.createAtom(0.21, 0x38bdf8, { position: p })));
        subB.forEach((p) => root.add(SM.createAtom(isZnS ? 0.24 : 0.21, isZnS ? 0xfbbf24 : 0x22d3ee, { position: p })));

        const bondLen = (Math.sqrt(3) / 4) * a;
        if (state.showBonds) {
          subB.forEach((pb) => {
            subA.forEach((pa) => {
              if (Math.abs(pb.distanceTo(pa) - bondLen) < 0.06) {
                root.add(SM.createBond(pb, pa, 0.055, 0xe2e8f0, 0.92));
              }
            });
          });
        }
        ui.setLegend([
          { color: "#38bdf8", label: isZnS ? "Zn 原子 (FCC 子点阵 A)" : "C/Si 子点阵 A (FCC)" },
          { color: isZnS ? "#fbbf24" : "#22d3ee", label: isZnS ? "S 原子 (四面体间隙 1/4)" : "C/Si 子点阵 B (+¼,¼,¼)" }
        ]);
        ui.setMetrics([
          { label: "晶体结构", value: isZnS ? "立方闪锌矿 (ZnS/GaAs)" : "金刚石 (C / Si / Ge)" },
          { label: "布拉菲点阵", value: "面心立方 (FCC)" },
          { label: "最近邻配位数", value: "4 (正四面体 109.5°)" },
          { label: "空间致密度 η", value: "34.0% (共价方向性)" }
        ]);
      } else {
        // Close-packed stacking layers: HCP (ABAB) vs FCC (ABCABC)
        const isHCP = state.crystal === "HCP";
        const rAtom = 0.42;
        const d = rAtom * 2;
        const dy = d * Math.sqrt(2 / 3) * state.layerSpread;
        const layers = isHCP ? ["A", "B", "A", "B"] : ["A", "B", "C", "A"];
        const colors = { A: 0x38bdf8, B: 0xfbbf24, C: 0xf472b6 };

        layers.forEach((L, lIdx) => {
          const y = (lIdx - 1.5) * dy;
          const shiftX = L === "B" ? d * 0.5 : (L === "C" ? d * 0.5 : 0);
          const shiftZ = L === "B" ? (d * Math.sqrt(3)) / 6 : (L === "C" ? -(d * Math.sqrt(3)) / 6 : 0);

          for (let q = -1; q <= 1; q++) {
            for (let r = -1; r <= 1; r++) {
              if (Math.abs(q + r) > 1) continue; // Hexagonal 7-atom cluster!
              const px = d * (q + r * 0.5) + shiftX;
              const pz = d * (Math.sqrt(3) / 2) * r + shiftZ;
              root.add(SM.createAtom(rAtom * 0.94, colors[L], { position: new THREE.Vector3(px, y, pz) }));
            }
          }
          root.add(SM.createLabel(`${L} 密排层`, new THREE.Vector3(2.2, y, 0), { color: L === "A" ? "#7dd3fc" : L === "B" ? "#fde047" : "#f9a8d4" }));
        });

        ui.setLegend([
          { color: "#38bdf8", label: "A 密排层位点" },
          { color: "#fbbf24", label: "B 密排层位点 (三角凹坑1)" },
          ...(isHCP ? [] : [{ color: "#f472b6", label: "C 密排层位点 (三角凹坑2)" }])
        ]);
        ui.setMetrics([
          { label: "密堆积序列", value: isHCP ? "ABAB… (六角密排 HCP)" : "ABCABC… (面心立方 FCC)" },
          { label: "最近邻配位数", value: "12 (同层6+上3+下3)" },
          { label: "理想轴比 c / a", value: isHCP ? "√(8/3) ≈ 1.633" : "沿[111]方向堆垛" },
          { label: "空间致密度 η", value: "74.05% (等径球最高)" }
        ]);
      }

      drawPlot();
    }

    function drawPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: 5, yMin: 0, yMax: 14,
        title: "典型晶体结构最近邻配位数 Z 对比",
        xLabel: "典型晶体",
        yLabel: "配位数 Z",
        xTickLabels: [
          { val: 0.5, text: "金刚石" },
          { val: 1.5, text: "ZnS" },
          { val: 2.5, text: "NaCl" },
          { val: 3.5, text: "CsCl" },
          { val: 4.5, text: "HCP/FCC" }
        ]
      });
      const list = [
        [0.5, 4, state.crystal === "Diamond"],
        [1.5, 4, state.crystal === "ZnS"],
        [2.5, 6, state.crystal === "NaCl"],
        [3.5, 8, state.crystal === "CsCl"],
        [4.5, 12, state.crystal === "HCP" || state.crystal === "FCC_stack"]
      ];
      list.forEach(([x, z, active]) => {
        const bx = map.toX(x) - 14;
        const by = map.toY(z);
        ctx.fillStyle = active ? "#fbbf24" : "#38bdf8";
        ctx.fillRect(bx, by, 28, map.toY(0) - by);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 10.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Z=" + z, bx + 14, by - 5);
      });
    }

    ui.setControls([
      {
        type: "select",
        label: "选择典型晶体结构",
        value: state.crystal,
        options: [
          { label: "金刚石结构 (Diamond: C, Si, Ge)", value: "Diamond" },
          { label: "立方闪锌矿 (Zincblende: ZnS, GaAs)", value: "ZnS" },
          { label: "氯化钠结构 (Rocksalt: NaCl, MgO)", value: "NaCl" },
          { label: "氯化铯结构 (CsCl)", value: "CsCl" },
          { label: "六角密排堆垛 (HCP: ABAB… Mg, Ti)", value: "HCP" },
          { label: "面心立方密排堆垛 (FCC: ABCABC… Cu, Au)", value: "FCC_stack" }
        ],
        onChange: (v) => { state.crystal = v; rebuild(); }
      },
      {
        type: "slider",
        label: "密排层拆解间距 (HCP / FCC 模式)",
        min: 1.0, max: 2.3, step: 0.05, value: state.layerSpread,
        unit: "×d₀",
        onChange: (v) => { state.layerSpread = v; rebuild(); }
      },
      {
        type: "checkbox",
        label: "显示化学键 / 配位连线",
        value: state.showBonds,
        onChange: (v) => { state.showBonds = v; rebuild(); }
      }
    ]);

    rebuild();
    return { onResize: drawPlot };
  };

  // ============================================================================
  // 1.5 原子结构的直接成像：扫描隧道显微镜 (STM) 仿真
  // ============================================================================
  window.SimRegistry["1-5"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.9, z: 6.4 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      surface: "graphene", // 'graphene' | 'square' | 'step'
      scanMode: "constant_current", // 'constant_current' | 'constant_height'
      gapZ0: 0.85,
      biasV: 0.6
    };

    let surfaceAtoms = [];
    let tipGroup = null;
    let beamLine = null;
    let scanProgress = 0;

    function surfaceHeightAt(x, z) {
      let ldos = 0;
      for (let i = 0; i < surfaceAtoms.length; i++) {
        const a = surfaceAtoms[i];
        const r2 = (x - a.x) * (x - a.x) + (z - a.z) * (z - a.z);
        ldos += Math.exp(-r2 / 0.16) * (1 + a.y * 0.8);
      }
      return ldos;
    }

    function rebuild() {
      clearGroup(root);
      surfaceAtoms = [];
      scanProgress = 0;

      // Substrate base plate
      const baseGeo = new THREE.BoxGeometry(5.6, 0.25, 5.6);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -0.35;
      root.add(base);

      if (state.surface === "graphene") {
        const bond = 0.52;
        const a1x = Math.sqrt(3) * bond;
        const a2x = (Math.sqrt(3) / 2) * bond;
        const a2z = 1.5 * bond;
        for (let i = -4; i <= 4; i++) {
          for (let j = -4; j <= 4; j++) {
            const bx = i * a1x + j * a2x;
            const bz = j * a2z;
            [[0, 0], [0, bond]].forEach(([dx, dz]) => {
              const px = bx + dx;
              const pz = bz + dz - 0.25;
              if (Math.abs(px) < 2.35 && Math.abs(pz) < 2.35) {
                const v = new THREE.Vector3(px, 0, pz);
                surfaceAtoms.push(v);
                root.add(SM.createAtom(0.18, 0x38bdf8, { position: v }));
              }
            });
          }
        }
        for (let i = 0; i < surfaceAtoms.length; i++) {
          for (let j = i + 1; j < surfaceAtoms.length; j++) {
            if (surfaceAtoms[i].distanceTo(surfaceAtoms[j]) < 0.62) {
              root.add(SM.createBond(surfaceAtoms[i], surfaceAtoms[j], 0.032, 0x64748b, 0.7));
            }
          }
        }
      } else if (state.surface === "square") {
        const a = 0.72;
        for (let ix = -3; ix <= 3; ix++) {
          for (let iz = -3; iz <= 3; iz++) {
            // Leave one single-atom vacancy in center to show defect imaging!
            if (ix === 1 && iz === 0) continue;
            const v = new THREE.Vector3(ix * a, 0, iz * a);
            surfaceAtoms.push(v);
            root.add(SM.createAtom(0.24, 0x34d399, { position: v }));
          }
        }
      } else {
        // Monatomic terrace step
        const a = 0.68;
        for (let ix = -3; ix <= 3; ix++) {
          for (let iz = -3; iz <= 3; iz++) {
            const y = ix >= 0 ? 0.35 : 0;
            const v = new THREE.Vector3(ix * a, y, iz * a);
            surfaceAtoms.push(v);
            root.add(SM.createAtom(0.23, ix >= 0 ? 0xfbbf24 : 0x38bdf8, { position: v }));
          }
        }
      }

      // STM Tungsten Tip
      tipGroup = new THREE.Group();
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 1.35, 24),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.2 })
      );
      cone.rotation.x = Math.PI;
      cone.position.y = 0.75;
      const apexAtom = SM.createAtom(0.11, 0xfbbf24, { position: new THREE.Vector3(0, 0.06, 0), emissiveIntensity: 0.5 });
      tipGroup.add(cone, apexAtom);
      root.add(tipGroup);

      // Tunneling electron glow cylinder
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.11, 1.0, 16);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 });
      beamLine = new THREE.Mesh(beamGeo, beamMat);
      root.add(beamLine);

      ui.setLegend([
        { color: "#e2e8f0", label: "STM 原子级金属探针 (W/Pt-Ir)" },
        { color: "#38bdf8", label: "量子隧穿电流束 I ∝ exp(-2κz)" },
        { color: "#34d399", label: "表面晶格原子与单空位缺陷" }
      ]);

      drawSTMMap(1.0);
    }

    function drawSTMMap(progressFrac) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const pad = 26;
      const size = Math.min(w - 110, h - 38);
      const ox = 46;
      const oy = 24;

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 11.5px Inter, 'Microsoft YaHei', sans-serif";
      ctx.fillText("实时 STM 扫描实空间伪彩形貌图", ox, 16);

      const N = 42;
      const cell = size / N;
      const maxRow = Math.floor(N * Math.min(1, progressFrac));

      for (let rz = 0; rz < N; rz++) {
        for (let rx = 0; rx < N; rx++) {
          if (rz > maxRow) {
            ctx.fillStyle = "#0b1325";
          } else {
            const wx = -2.1 + (rx / (N - 1)) * 4.2;
            const wz = -2.1 + (rz / (N - 1)) * 4.2;
            const val = Math.min(1, surfaceHeightAt(wx, wz) * 0.62);
            // Copper-gold STM color palette
            const r = Math.floor(25 + 230 * Math.pow(val, 0.75));
            const g = Math.floor(15 + 175 * Math.pow(val, 1.35));
            const b = Math.floor(35 + 95 * Math.pow(val, 2.4));
            ctx.fillStyle = `rgb(${r},${g},${b})`;
          }
          ctx.fillRect(ox + rx * cell, oy + rz * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }

      ctx.strokeStyle = "rgba(148,163,184,0.5)";
      ctx.strokeRect(ox, oy, size, size);

      // Colorbar on the right
      const cbx = ox + size + 18;
      for (let i = 0; i < size; i++) {
        const val = 1 - i / size;
        const r = Math.floor(25 + 230 * Math.pow(val, 0.75));
        const g = Math.floor(15 + 175 * Math.pow(val, 1.35));
        const b = Math.floor(35 + 95 * Math.pow(val, 2.4));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(cbx, oy + i, 12, 2);
      }
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText("高 (强隧穿)", cbx + 16, oy + 10);
      ctx.fillText("低 (晶格间隙)", cbx + 16, oy + size - 3);
    }

    ui.setControls([
      {
        type: "pills",
        label: "待测晶体表面样品",
        value: state.surface,
        options: [
          { label: "石墨烯蜂窝晶格", value: "graphene" },
          { label: "含空位(100)面", value: "square" },
          { label: "单原子台阶面", value: "step" }
        ],
        onChange: (v) => { state.surface = v; rebuild(); }
      },
      {
        type: "pills",
        label: "STM 工作反馈模式",
        value: state.scanMode,
        options: [
          { label: "恒流模式 (调高反馈)", value: "constant_current" },
          { label: "恒高模式 (测电流)", value: "constant_height" }
        ],
        onChange: (v) => { state.scanMode = v; }
      },
      {
        type: "slider",
        label: "基准针尖高度 z₀",
        min: 0.55, max: 1.4, step: 0.05, value: state.gapZ0,
        unit: " nm",
        onChange: (v) => { state.gapZ0 = v; }
      },
      {
        type: "slider",
        label: "偏置电压 V_bias",
        min: 0.1, max: 1.5, step: 0.1, value: state.biasV,
        unit: " V",
        onChange: (v) => { state.biasV = v; }
      }
    ]);

    rebuild();

    return {
      update(dt, elapsed) {
        scanProgress = (elapsed * 0.12) % 1.05;
        const row = Math.floor(scanProgress * 14);
        const rowFrac = (scanProgress * 14) - row;
        const wx = -2.0 + ((row % 2 === 0 ? rowFrac : 1 - rowFrac) * 4.0);
        const wz = -2.0 + (Math.min(13, row) / 13) * 4.0;

        const localH = surfaceHeightAt(wx, wz);
        let tipY = state.gapZ0;
        if (state.scanMode === "constant_current") {
          tipY = state.gapZ0 + localH * 0.24;
        } else {
          tipY = state.gapZ0 + 0.32;
        }

        if (tipGroup) tipGroup.position.set(wx, tipY, wz);

        const actualGap = Math.max(0.18, tipY - localH * 0.22);
        const currentNanoAmp = state.biasV * 8.5 * Math.exp(-2.8 * (actualGap - 0.55));

        if (beamLine) {
          beamLine.position.set(wx, tipY / 2, wz);
          beamLine.scale.set(1, tipY, 1);
          beamLine.material.opacity = Math.min(0.95, Math.max(0.12, currentNanoAmp / 6));
        }

        ui.setMetrics([
          { label: "探针坐标 (x, y)", value: `(${wx.toFixed(1)}, ${wz.toFixed(1)}) Å` },
          { label: "瞬时针尖高度 z", value: tipY.toFixed(2) + " nm" },
          { label: "量子隧穿电流 I_t", value: currentNanoAmp.toFixed(2) + " nA" },
          { label: "纵向分辨率量级", value: "0.01 Å (指数敏感)" }
        ]);

        drawSTMMap(Math.min(1, scanProgress * 1.15));
      },
      onResize: () => drawSTMMap(1.0)
    };
  };
})();
