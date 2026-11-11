/**
 * 第 7 章：固体能带论 (Chapter 7: Energy Bands)
 * 覆盖大纲：7.1 近自由电子模型 | 7.2 布洛赫函数与3D紧束缚能带曲面 | 7.3 克勒尼西-彭尼模型 | 7.4-7.5 能带填充、有效质量/空穴与材料导电分类
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
  // 7.1 近自由电子模型：布里渊区边界布拉格反射驻波 ψ₊ / ψ₋ 与能隙打开 E_g = 2|U_G|
  // ============================================================================
  window.SimRegistry["7-1"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 2.8, z: 10.2 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      uGap: 0.45,        // |U_G| in eV -> Band gap E_g = 2|U_G|
      zoneScheme: "reduced" // 'extended' | 'reduced' | 'periodic'
    };

    let psiPlusGeo = null, psiMinusGeo = null;

    function buildRibbonCurve(fnY, yOffset, colorHex) {
      const N = 200;
      const xMin = -4.2, xMax = 4.2;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const x = xMin + (i / (N - 1)) * (xMax - xMin);
        pts.push(new THREE.Vector3(x, yOffset + fnY(x), 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: colorHex }));
      return { line, geo, xMin, xMax, N };
    }

    function rebuild() {
      clearGroup(root);
      const a = 1.65;

      // Positive Ion Cores at x = n * a
      for (let n = -2; n <= 2; n++) {
        const x = n * a;
        root.add(SM.createAtom(0.24, 0x38bdf8, { position: new THREE.Vector3(x, -1.65, 0), emissiveIntensity: 0.35 }));
        // Vertical dashed alignment guides from ion core through ψ+ and ψ-
        root.add(SM.createBond(new THREE.Vector3(x, -1.65, 0), new THREE.Vector3(x, 2.2, 0), 0.012, 0x475569, 0.45));
      }
      root.add(SM.createLabel("正离子实晶格 x = na (静电吸引势谷)", new THREE.Vector3(0, -2.25, 0), { color: "#7dd3fc" }));

      // Periodic potential curve U(x) = -|U_G| cos(2πx/a)
      const pot = buildRibbonCurve((x) => -state.uGap * 0.9 * Math.cos((2 * Math.PI * x) / a), -1.65, 0x60a5fa);
      root.add(pot.line);

      // Lower-energy symmetric standing wave density |ψ+(x)|² ∝ cos²(πx/a) (piled ON ion cores!)
      const yValence = -0.15 - state.uGap * 0.7;
      const pPlus = buildRibbonCurve((x) => 0.72 * Math.pow(Math.cos((Math.PI * x) / a), 2), yValence, 0x34d399);
      psiPlusGeo = { geo: pPlus.geo, baseY: yValence, a, isPlus: true };
      root.add(pPlus.line);
      root.add(SM.createLabel("价带顶 |ψ₊|² ∝ cos²(πx/a) [聚集于正离子核 → 低能]", new THREE.Vector3(0, yValence - 0.35, 0), { color: "#6ee7b7" }));

      // Higher-energy antisymmetric standing wave density |ψ-(x)|² ∝ sin²(πx/a) (piled BETWEEN ions!)
      const yCond = 0.85 + state.uGap * 0.7;
      const pMinus = buildRibbonCurve((x) => 0.72 * Math.pow(Math.sin((Math.PI * x) / a), 2), yCond, 0xfb7185);
      psiMinusGeo = { geo: pMinus.geo, baseY: yCond, a, isPlus: false };
      root.add(pMinus.line);
      root.add(SM.createLabel("导带底 |ψ₋|² ∝ sin²(πx/a) [聚集于离子间隙 → 高能]", new THREE.Vector3(0, yCond + 0.98, 0), { color: "#fda4af" }));

      // Energy gap double arrow indicator on right side
      const gapSpan = yCond - yValence;
      if (state.uGap > 0.02) {
        root.add(SM.createArrow(new THREE.Vector3(4.45, yValence, 0), new THREE.Vector3(0, 1, 0), gapSpan, 0xfbbf24, 0.22, 0.08));
        root.add(SM.createLabel(`E_g = ${(2 * state.uGap).toFixed(2)} eV`, new THREE.Vector3(4.55, (yValence + yCond) / 2, 0), { color: "#fde047" }));
      }

      ui.setLegend([
        { color: "#38bdf8", label: "周期正离子核 (+Ze) 与吸引势阱" },
        { color: "#34d399", label: "对称驻波 |ψ₊|² (第一能带顶)" },
        { color: "#fb7185", label: "反对称驻波 |ψ₋|² (第二能带底)" }
      ]);

      ui.setMetrics([
        { label: "周期势傅里叶分量 |U_G|", value: state.uGap.toFixed(2) + " eV" },
        { label: "布里渊区边界禁带 E_g", value: (2 * state.uGap).toFixed(2) + " eV" },
        { label: "区边界群速度 dE/dk", value: "0 (严格驻波!)" },
        { label: "当前能带表示图景", value: state.zoneScheme === "reduced" ? "简约区图景" : state.zoneScheme === "extended" ? "扩展区图景" : "周期区图景" }
      ]);

      drawBandSchemePlot();
    }

    function twoWaveEigen(k, gSign, uGap) {
      // Degenerate perturbation around Bragg plane G = ±2π/a (in normalized k where BZ boundary = ±1, E0(k) = k²):
      const ek = k * k;
      const ekG = Math.pow(k - 2 * gSign, 2);
      const avg = 0.5 * (ek + ekG);
      const diff = 0.5 * Math.sqrt(Math.pow(ek - ekG, 2) + 4 * uGap * uGap);
      return { lower: avg - diff, upper: avg + diff };
    }

    function drawBandSchemePlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;

      const xRange = state.zoneScheme === "reduced" ? 1.25 : 2.35;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: -xRange, xMax: xRange, yMin: 0, yMax: 4.6,
        title: `近自由电子能带色散 (${state.zoneScheme === "reduced" ? "简约区" : state.zoneScheme === "extended" ? "扩展区" : "周期区"}图景, E_g = ${(2 * state.uGap).toFixed(2)}eV)`,
        xLabel: "电子波矢 k / (π/a)",
        yLabel: "能量 E(k)",
        xTickLabels: [
          { val: -2, text: "-2π/a" },
          { val: -1, text: "-π/a" },
          { val: 0, text: "0" },
          { val: 1, text: "+π/a" },
          { val: 2, text: "+2π/a" }
        ]
      });

      // Shade 1st BZ [-1, 1]
      const bx1 = map.toX(-1), bx2 = map.toX(1);
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.fillRect(bx1, map.pad.top, bx2 - bx1, map.ph);

      // Free electron parabola reference
      const freePts = [];
      for (let k = -xRange; k <= xRange; k += 0.04) freePts.push([k, k * k]);
      PH.drawCurve(ctx, map, freePts, { color: "rgba(148,163,184,0.35)", dash: [4, 3], width: 1.3 });

      const u = state.uGap * 0.85;
      if (state.zoneScheme === "extended") {
        // Band 1 in [-1, 1], Band 2 in [-2, -1] & [1, 2]
        const b1 = [], b2L = [], b2R = [];
        for (let k = -1; k <= 1.001; k += 0.02) {
          const g = k >= 0 ? 1 : -1;
          b1.push([k, twoWaveEigen(k, g, u).lower]);
        }
        for (let k = -2.2; k <= -1.0; k += 0.02) b2L.push([k, twoWaveEigen(k, -1, u).upper]);
        for (let k = 1.0; k <= 2.2; k += 0.02) b2R.push([k, twoWaveEigen(k, 1, u).upper]);
        PH.drawCurve(ctx, map, b1, { color: "#34d399", width: 2.5 });
        PH.drawCurve(ctx, map, b2L, { color: "#fb7185", width: 2.5 });
        PH.drawCurve(ctx, map, b2R, { color: "#fb7185", width: 2.5 });
      } else {
        // Reduced or Periodic zone!
        const shifts = state.zoneScheme === "reduced" ? [0] : [-2, 0, 2];
        shifts.forEach((sh) => {
          const b1 = [], b2 = [];
          for (let k = -1; k <= 1.001; k += 0.025) {
            const g = k >= 0 ? 1 : -1;
            b1.push([k + sh, twoWaveEigen(k, g, u).lower]);
            // Folded 2nd band from k_ext = k - 2*sign(k)
            const kExt = k >= 0 ? k - 2 : k + 2;
            const g2 = kExt >= 0 ? 1 : -1;
            b2.push([k + sh, twoWaveEigen(kExt, g2, u).upper]);
          }
          PH.drawCurve(ctx, map, b1, { color: "#34d399", width: sh === 0 ? 2.6 : 1.5 });
          PH.drawCurve(ctx, map, b2, { color: "#fb7185", width: sh === 0 ? 2.6 : 1.5 });
        });
      }
    }

    ui.setControls([
      {
        type: "slider",
        label: "晶格周期势强度 |U_G| (0 = 空晶格自由电子)",
        min: 0.0, max: 0.75, step: 0.03, value: state.uGap,
        unit: " eV",
        onChange: (v) => { state.uGap = v; rebuild(); }
      },
      {
        type: "pills",
        label: "能带色散表示图景切换",
        value: state.zoneScheme,
        options: [
          { label: "简约区图景", value: "reduced" },
          { label: "扩展区图景", value: "extended" },
          { label: "周期区图景", value: "periodic" }
        ],
        onChange: (v) => { state.zoneScheme = v; rebuild(); }
      }
    ]);

    rebuild();

    return {
      update(dt, elapsed) {
        // Subtle breathing shimmer on standing wave probability clouds
        const pulse = 1 + 0.08 * Math.sin(elapsed * 4.0);
        [psiPlusGeo, psiMinusGeo].forEach((obj) => {
          if (!obj) return;
          const arr = obj.geo.attributes.position.array;
          const N = arr.length / 3;
          for (let i = 0; i < N; i++) {
            const x = arr[i * 3];
            const val = obj.isPlus
              ? Math.pow(Math.cos((Math.PI * x) / obj.a), 2)
              : Math.pow(Math.sin((Math.PI * x) / obj.a), 2);
            arr[i * 3 + 1] = obj.baseY + 0.72 * pulse * val;
          }
          obj.geo.attributes.position.needsUpdate = true;
        });
      },
      onResize: drawBandSchemePlot
    };
  };

  // ============================================================================
  // 7.2 布洛赫函数与二维紧束缚三维能带曲面 E(k_x, k_y) (正方晶格 + 石墨烯狄拉克锥)
  // ============================================================================
  function buildEnergySurface(evalE, kMax, colorScheme) {
    const N = 56;
    const pos = [];
    const col = [];
    const cLow = new THREE.Color(colorScheme[0]);
    const cMid = new THREE.Color(colorScheme[1]);
    const cHigh = new THREE.Color(colorScheme[2]);

    function pt(ix, iz) {
      const kx = -kMax + (ix / N) * (2 * kMax);
      const kz = -kMax + (iz / N) * (2 * kMax);
      const e = evalE(kx, kz);
      const norm = Math.max(0, Math.min(1, (e + 2.2) / 4.4));
      const c = norm < 0.5
        ? cLow.clone().lerp(cMid, norm * 2)
        : cMid.clone().lerp(cHigh, (norm - 0.5) * 2);
      return { x: kx, y: e * 0.72, z: kz, c };
    }

    for (let ix = 0; ix < N; ix++) {
      for (let iz = 0; iz < N; iz++) {
        const p00 = pt(ix, iz), p10 = pt(ix + 1, iz), p11 = pt(ix + 1, iz + 1), p01 = pt(ix, iz + 1);
        [p00, p10, p11, p00, p11, p01].forEach((p) => {
          pos.push(p.x, p.y, p.z);
          col.push(p.c.r, p.c.g, p.c.b);
        });
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 55,
      transparent: true,
      opacity: 0.88
    }));
  }

  window.SimRegistry["7-2"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.2, y: 5.2, z: 6.8 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      subMode: "tb3d",     // 'tb3d' | 'bloch'
      lattice: "square",   // 'square' | 'graphene'
      fermiE: -0.4,        // E_F in units of hopping t
      hopT: 1.0,
      blochK: 0.45         // k*a / π for Bloch wave
    };

    let blochHelixGeo = null;

    function evalBand(kx, ky) {
      // kx, ky in [-π, π]
      if (state.lattice === "square") {
        return -state.hopT * (Math.cos(kx) + Math.cos(ky)); // in [-2t, +2t]
      }
      // Graphene honeycomb nearest-neighbor dispersion!
      const f = 1 + 4 * Math.cos((Math.sqrt(3) / 2) * kx) * Math.cos(0.5 * ky) + 4 * Math.pow(Math.cos(0.5 * ky), 2);
      return state.hopT * 0.72 * Math.sqrt(Math.max(0, f));
    }

    function rebuild() {
      clearGroup(root);
      blochHelixGeo = null;

      if (state.subMode === "tb3d") {
        const kLim = Math.PI;
        if (state.lattice === "square") {
          root.add(buildEnergySurface((kx, ky) => evalBand(kx, ky), kLim, [0x0284c7, 0x34d399, 0xfbbf24]));
        } else {
          // Graphene conduction (+π*) AND valence (-π) Dirac cones touching at 6 K/K' points!
          root.add(buildEnergySurface((kx, ky) => evalBand(kx, ky), kLim, [0x34d399, 0x38bdf8, 0xf472b6]));
          root.add(buildEnergySurface((kx, ky) => -evalBand(kx, ky), kLim, [0x1e3a8a, 0x6366f1, 0x34d399]));
        }

        // Translucent Fermi Energy slicing plane y = fermiE * 0.72
        const fPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(kLim * 2.05, kLim * 2.05),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })
        );
        fPlane.rotation.x = -Math.PI / 2;
        fPlane.position.y = state.fermiE * 0.72;
        root.add(fPlane);
        root.add(SM.createLabel(`费米截平面 E_F = ${state.fermiE.toFixed(2)} t`, new THREE.Vector3(0, state.fermiE * 0.72 + 0.35, kLim), { color: "#fde047" }));

        ui.setLegend([
          { color: "#0284c7", label: "能带底部 (电子型正有效质量区)" },
          { color: "#34d399", label: "半满范霍夫奇点 / 狄拉克锥交点" },
          { color: "#fbbf24", label: "可调费米能级等能切割面 E = E_F" }
        ]);
        ui.setMetrics([
          { label: "紧束缚晶格模型", value: state.lattice === "square" ? "二维正方晶格 s带" : "石墨烯蜂窝晶格 π/π*" },
          { label: "最近邻跃迁积分 t", value: state.hopT.toFixed(2) + " eV" },
          { label: "能带总宽度 W", value: (state.lattice === "square" ? 8 * state.hopT : 6 * state.hopT).toFixed(1) + " eV" },
          { label: "费米面拓扑形态", value: state.lattice === "graphene" ? (Math.abs(state.fermiE) < 0.08 ? "零维狄拉克点!" : "狄拉克圆锥截面") : (Math.abs(state.fermiE) < 0.08 ? "正方形鞍点费米面!" : (state.fermiE < 0 ? "闭合电子口袋" : "四角空穴口袋")) }
        ]);
      } else {
        // 7.2 Bloch Theorem 3D Complex Helix ψ_k(x) = u_k(x) exp(i k x)
        const a = 1.65;
        for (let n = -2; n <= 2; n++) {
          root.add(SM.createAtom(0.2, 0x38bdf8, { position: new THREE.Vector3(n * a, 0, 0) }));
        }
        // Periodic cell envelope ±u_k(x)
        const envPos = [], envNeg = [];
        for (let i = 0; i <= 220; i++) {
          const x = -4.2 + (i / 220) * 8.4;
          const u = 0.45 + 0.75 * Math.pow(Math.cos((Math.PI * x) / a), 2);
          envPos.push(new THREE.Vector3(x, u, 0));
          envNeg.push(new THREE.Vector3(x, -u, 0));
        }
        root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(envPos), new THREE.LineBasicMaterial({ color: 0x64748b })));
        root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(envNeg), new THREE.LineBasicMaterial({ color: 0x64748b })));

        blochHelixGeo = new THREE.BufferGeometry();
        blochHelixGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(260 * 3), 3));
        const helixLine = new THREE.Line(blochHelixGeo, new THREE.LineBasicMaterial({ color: 0xfbbf24 }));
        root.add(helixLine);
        root.add(SM.createLabel("三维复波函数螺旋 (x, Re ψ, Im ψ) = u_k(x)e^{ikx}", new THREE.Vector3(0, 1.85, 0), { color: "#fde047" }));

        ui.setLegend([
          { color: "#64748b", label: "晶格周期调幅包络 ±u_k(x) [周期 a]" },
          { color: "#fbbf24", label: "布洛赫波复螺旋 ψ_k(x) = u_k(x)e^{ikx}" },
          { color: "#38bdf8", label: "周期正离子实位点" }
        ]);
        ui.setMetrics([
          { label: "布洛赫波矢 ka / π", value: state.blochK.toFixed(2) },
          { label: "单晶胞平移相移 ka", value: (state.blochK * 180).toFixed(0) + "°" },
          { label: "调幅因子周期性", value: "u_k(x + a) = u_k(x)" },
          { label: "全晶格概率密度 |ψ|²", value: "|u_k(x)|² (严格周期!)" }
        ]);
      }

      drawFermiContourPlot();
    }

    function drawFermiContourPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const size = Math.min(w - 80, h - 42);
      const ox = (w - size) / 2;
      const oy = 26;

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 11px Inter, 'Microsoft YaHei', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`二维布里渊区等能面与费米面截面图 (E_F = ${state.fermiE.toFixed(2)} t)`, w / 2, 16);

      const M = 52;
      const cell = size / M;
      for (let iy = 0; iy < M; iy++) {
        for (let ix = 0; ix < M; ix++) {
          const kx = -Math.PI + (ix / (M - 1)) * 2 * Math.PI;
          const ky = Math.PI - (iy / (M - 1)) * 2 * Math.PI;
          const e = state.lattice === "square"
            ? evalBand(kx, ky)
            : (state.fermiE >= 0 ? evalBand(kx, ky) : -evalBand(kx, ky));
          const onFermi = Math.abs(e - state.fermiE) < 0.13;
          if (onFermi) {
            ctx.fillStyle = "#fbbf24";
          } else {
            const t = Math.max(0, Math.min(1, (e + 2) / 4));
            ctx.fillStyle = `rgb(${Math.floor(15 + 45 * t)}, ${Math.floor(35 + 110 * t)}, ${Math.floor(85 + 120 * (1 - Math.abs(t - 0.5)))})`;
          }
          ctx.fillRect(ox + ix * cell, oy + iy * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(ox, oy, size, size);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("k_x ∈ [-π/a, +π/a]", w / 2, oy + size + 13);
    }

    function buildControls() {
      const ctrls = [
        {
          type: "pills",
          label: "7.2 核心概念切换",
          value: state.subMode,
          options: [
            { label: "三维紧束缚能带曲面", value: "tb3d" },
            { label: "布洛赫波函数复螺旋", value: "bloch" }
          ],
          onChange: (v) => { state.subMode = v; buildControls(); rebuild(); }
        }
      ];

      if (state.subMode === "tb3d") {
        ctrls.push(
          {
            type: "pills",
            label: "二维晶格紧束缚体系",
            value: state.lattice,
            options: [
              { label: "正方晶格 (范霍夫鞍点)", value: "square" },
              { label: "石墨烯 (狄拉克锥!)", value: "graphene" }
            ],
            onChange: (v) => { state.lattice = v; rebuild(); }
          },
          {
            type: "slider",
            label: "费米能级切割高度 E_F / t",
            min: -1.9, max: 1.9, step: 0.05, value: state.fermiE,
            unit: " t",
            onChange: (v) => { state.fermiE = v; rebuild(); }
          },
          {
            type: "slider",
            label: "轨道交叠跃迁积分 t (控制带宽)",
            min: 0.5, max: 1.5, step: 0.05, value: state.hopT,
            unit: " eV",
            onChange: (v) => { state.hopT = v; rebuild(); }
          }
        );
      } else {
        ctrls.push({
          type: "slider",
          label: "布洛赫波矢 ka / π",
          min: 0.05, max: 1.0, step: 0.05, value: state.blochK,
          unit: " π/a",
          onChange: (v) => { state.blochK = v; rebuild(); }
        });
      }
      ui.setControls(ctrls);
    }

    buildControls();
    rebuild();

    return {
      update(dt, elapsed) {
        if (blochHelixGeo) {
          const a = 1.65;
          const k = (state.blochK * Math.PI) / a;
          const arr = blochHelixGeo.attributes.position.array;
          for (let i = 0; i < 260; i++) {
            const x = -4.2 + (i / 259) * 8.4;
            const u = 0.45 + 0.75 * Math.pow(Math.cos((Math.PI * x) / a), 2);
            const ph = k * x - elapsed * 2.8;
            arr[i * 3] = x;
            arr[i * 3 + 1] = u * Math.cos(ph);
            arr[i * 3 + 2] = u * Math.sin(ph);
          }
          blochHelixGeo.attributes.position.needsUpdate = true;
        }
      },
      onResize: drawFermiContourPlot
    };
  };

  // ============================================================================
  // 7.3 克勒尼西-彭尼模型 (Kronig-Penney Model 精确超越方程仿真)
  // ============================================================================
  window.SimRegistry["7-3"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 2.8, z: 10.5 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      barrierP: 2.5 // Dimensionless barrier strength P in [0, 12]
    };

    function kpLHS(alphaA, P) {
      if (Math.abs(alphaA) < 1e-5) return 1 + P;
      return P * (Math.sin(alphaA) / alphaA) + Math.cos(alphaA);
    }

    function computeAllowedBands(P) {
      // Scan αa in [0, 3π] to find allowed energy intervals where |LHS| <= 1
      const bands = [];
      let inBand = false;
      let startX = 0;
      for (let x = 0.01; x <= 3 * Math.PI; x += 0.015) {
        const val = kpLHS(x, P);
        const ok = Math.abs(val) <= 1.0;
        if (ok && !inBand) {
          inBand = true;
          startX = x;
        } else if (!ok && inBand) {
          inBand = false;
          bands.push([startX, x]);
        }
      }
      if (inBand) bands.push([startX, 3 * Math.PI]);
      return bands;
    }

    function rebuild() {
      clearGroup(root);

      // Left side (-2.4): 3D Periodic Square Potential Barrier Chain!
      const barH = Math.min(3.2, 0.2 + state.barrierP * 0.28);
      root.add(SM.createLabel(`实空间周期势垒阵列 (强度 P = ${state.barrierP.toFixed(1)})`, new THREE.Vector3(-2.3, 2.35, 0), { color: "#7dd3fc" }));
      for (let n = -2; n <= 2; n++) {
        const bx = -2.3 + n * 0.95;
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, Math.max(0.05, barH), 1.4),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72 })
        );
        pillar.position.set(bx, -1.6 + barH / 2, 0);
        root.add(pillar);
      }
      // Base line
      root.add(SM.createBond(new THREE.Vector3(-4.6, -1.6, 0), new THREE.Vector3(0.1, -1.6, 0), 0.02, 0x64748b));

      // Right side (+2.5): 3D Allowed Energy Band Tower (E ∝ (αa)²) vs Forbidden Gaps!
      const bands = computeAllowedBands(state.barrierP);
      root.add(SM.createLabel("三维能谱柱：允带(绿) vs 禁带(空隙)", new THREE.Vector3(2.5, 2.35, 0), { color: "#6ee7b7" }));

      // Reference outer frame of energy tower
      root.add(SM.createParallelepiped(
        new THREE.Vector3(2.4, 0, 0), new THREE.Vector3(0, 3.6, 0), new THREE.Vector3(0, 0, 1.6),
        new THREE.Vector3(1.3, -1.6, -0.8), 0x475569, 0.04
      ));

      const eMax = Math.pow(3 * Math.PI, 2);
      bands.forEach(([xa1, xa2], idx) => {
        const e1 = (xa1 * xa1) / eMax;
        const e2 = (xa2 * xa2) / eMax;
        const y1 = -1.6 + e1 * 3.6;
        const y2 = -1.6 + e2 * 3.6;
        const hSlab = Math.max(0.05, y2 - y1);
        const colors = [0x34d399, 0x38bdf8, 0xa78bfa, 0xfbbf24];
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(2.3, hSlab, 1.5),
          new THREE.MeshPhongMaterial({ color: colors[idx % colors.length], transparent: true, opacity: 0.78 })
        );
        slab.position.set(2.5, (y1 + y2) / 2, 0);
        root.add(slab);
        root.add(SM.createLabel(`第${idx + 1}允带`, new THREE.Vector3(4.15, (y1 + y2) / 2, 0), { color: "#e2e8f0", fontSize: 26 }));
      });

      const b1Width = bands.length > 0 ? (Math.pow(bands[0][1], 2) - Math.pow(bands[0][0], 2)) / (Math.PI * Math.PI) : 0;
      const gap1Width = bands.length > 1 ? (Math.pow(bands[1][0], 2) - Math.pow(bands[0][1], 2)) / (Math.PI * Math.PI) : 0;

      ui.setLegend([
        { color: "#38bdf8", label: "周期势垒 U(x) [P 越大束缚越强]" },
        { color: "#34d399", label: "实波矢传播允带 (|cos ka| ≤ 1)" },
        { color: "#475569", label: "虚波矢衰减禁带 (|LHS| > 1)" }
      ]);

      ui.setMetrics([
        { label: "势垒无量纲强度 P", value: state.barrierP.toFixed(2) },
        { label: "物理状态极限", value: state.barrierP < 0.05 ? "自由电子连续谱!" : state.barrierP > 9.5 ? "近孤立势阱分立级!" : "周期晶体能带态" },
        { label: "第一允带宽度 ΔE₁/E₀", value: b1Width.toFixed(3) },
        { label: "第一禁带宽度 E_g1/E₀", value: gap1Width.toFixed(3) }
      ]);

      drawKPPlot(bands);
    }

    function drawKPPlot(bands) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const xMax = 3 * Math.PI;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: xMax, yMin: -2.4, yMax: 2.8,
        title: "克勒尼西-彭尼图解法：(P/αa)sin(αa) + cos(αa) ∈ [-1, +1] 即为允带!",
        xLabel: "能量波数参数 αa = a√(2mE)/ħ",
        yLabel: "超越方程左端项",
        xTickLabels: [
          { val: 0, text: "0" },
          { val: Math.PI, text: "π" },
          { val: 2 * Math.PI, text: "2π" },
          { val: 3 * Math.PI, text: "3π" }
        ]
      });

      // Horizontal [-1, +1] strip
      const yTop1 = map.toY(1.0);
      const yBot1 = map.toY(-1.0);
      ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
      ctx.fillRect(map.pad.left, yTop1, map.pw, yBot1 - yTop1);
      PH.drawCurve(ctx, map, [[0, 1], [xMax, 1]], { color: "#94a3b8", dash: [4, 3], width: 1.2 });
      PH.drawCurve(ctx, map, [[0, -1], [xMax, -1]], { color: "#94a3b8", dash: [4, 3], width: 1.2 });

      // Highlight allowed αa intervals in emerald!
      bands.forEach(([x1, x2]) => {
        const px1 = map.toX(x1), px2 = map.toX(x2);
        ctx.fillStyle = "rgba(52, 211, 153, 0.24)";
        ctx.fillRect(px1, yTop1, Math.max(2, px2 - px1), yBot1 - yTop1);
      });

      const pts = [];
      for (let x = 0.01; x <= xMax; x += 0.03) {
        pts.push([x, kpLHS(x, state.barrierP)]);
      }
      PH.drawCurve(ctx, map, pts, { color: "#38bdf8", width: 2.3 });
    }

    function syncControls() {
      ui.setControls([
        {
          type: "slider",
          label: "周期势垒强度参数 P (0=自由电子 → 12=紧束缚原子能级)",
          min: 0.0, max: 12.0, step: 0.1, value: state.barrierP,
          unit: "",
          onChange: (v) => { state.barrierP = v; rebuild(); }
        },
        {
          type: "pills",
          label: "经典极限一键体验",
          value: "",
          options: [
            { label: "P = 0 (自由电子气)", value: "0.0" },
            { label: "P = 1.5 (弱周期势宽带)", value: "1.5" },
            { label: "P = 4.0 (典型半导体)", value: "4.0" },
            { label: "P = 11 (强束缚窄带)", value: "11.0" }
          ],
          onChange: (v) => {
            state.barrierP = parseFloat(v);
            syncControls();
            rebuild();
          }
        }
      ]);
    }

    syncControls();
    rebuild();
    return { onResize: () => rebuild() };
  };

  // ============================================================================
  // 7.4–7.5 能带轨道数目、有效质量/空穴与导体·半导体·绝缘体分类三维仿真
  // ============================================================================
  window.SimRegistry["7-4"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 2.8, z: 10.6 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      subMode: "materials", // 'materials' (Conductor/Insulator/Intrinsic/N/P Semiconductor) | 'effmass' (Effective Mass & Hole)
      matClass: "intrinsic", // 'metal_half' | 'metal_overlap' | 'insulator' | 'intrinsic' | 'ntype' | 'ptype'
      tempK: 350,
      applyField: true,
      kPos: 0.0 // for effmass manual/animated tracking
    };

    let cbElectrons = [];
    let vbHoles = [];
    let kBall = null, realElecBall = null, equivHoleBall = null;

    function rebuild() {
      clearGroup(root);
      cbElectrons = [];
      vbHoles = [];
      kBall = null; realElecBall = null; equivHoleBall = null;

      if (state.subMode === "materials") {
        const W = 6.2, D = 1.8;

        if (state.matClass === "metal_half") {
          // Half-filled 3s/4s conduction band (Na, Cu: 1 valence electron per primitive cell -> N electrons in 2N states!)
          const emptyTop = new THREE.Mesh(new THREE.BoxGeometry(W, 1.3, D), new THREE.MeshPhongMaterial({ color: 0x334155, transparent: true, opacity: 0.35 }));
          emptyTop.position.y = 0.65;
          const filledBot = new THREE.Mesh(new THREE.BoxGeometry(W, 1.3, D), new THREE.MeshPhongMaterial({ color: 0x0284c7, transparent: true, opacity: 0.68 }));
          filledBot.position.y = -0.65;
          root.add(emptyTop, filledBot);
          root.add(SM.createBond(new THREE.Vector3(-W / 2 - 0.3, 0, 0), new THREE.Vector3(W / 2 + 0.3, 0, 0), 0.025, 0xfbbf24));
          root.add(SM.createLabel("费米能级 E_F 穿过能带中部 (1e⁻/原胞, 半满带!)", new THREE.Vector3(0, 0.25, D / 2 + 0.2), { color: "#fde047" }));

          for (let i = 0; i < 16; i++) {
            const em = SM.createAtom(0.11, 0xfbbf24, { position: new THREE.Vector3((Math.random() - 0.5) * W, 0.12 + Math.random() * 0.3, (Math.random() - 0.5) * 1.2), emissiveIntensity: 0.7 });
            root.add(em);
            cbElectrons.push(em);
          }
        } else if (state.matClass === "metal_overlap") {
          // Divalent metal (Mg, Ca: 2e⁻/cell, Band 1 & Band 2 overlap in energy!)
          const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, D), new THREE.MeshPhongMaterial({ color: 0x0284c7, transparent: true, opacity: 0.62 }));
          b1.position.set(-1.5, -0.4, 0);
          const b2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, D), new THREE.MeshPhongMaterial({ color: 0x34d399, transparent: true, opacity: 0.42 }));
          b2.position.set(1.5, 0.35, 0);
          root.add(b1, b2);
          root.add(SM.createBond(new THREE.Vector3(-3.3, 0.0, 0), new THREE.Vector3(3.3, 0.0, 0), 0.025, 0xfbbf24));
          root.add(SM.createLabel("第一能带与第二能带能量交叠 (如二价金属 Mg, Zn)", new THREE.Vector3(0, 1.9, 0), { color: "#fde047" }));
          for (let i = 0; i < 12; i++) {
            const em = SM.createAtom(0.11, 0xfbbf24, { position: new THREE.Vector3((Math.random() - 0.5) * 5.4, 0.05, (Math.random() - 0.5) * 1.1) });
            root.add(em);
            cbElectrons.push(em);
          }
        } else {
          // Insulator / Intrinsic / N-type / P-type Semiconductor!
          const isInsulator = state.matClass === "insulator";
          const gapH = isInsulator ? 2.3 : 1.15;
          const vbY = -gapH / 2 - 0.6;
          const cbY = gapH / 2 + 0.6;

          const vb = new THREE.Mesh(new THREE.BoxGeometry(W, 1.1, D), new THREE.MeshPhongMaterial({ color: 0x1d4ed8, transparent: true, opacity: 0.72 }));
          vb.position.y = vbY;
          const cb = new THREE.Mesh(new THREE.BoxGeometry(W, 1.1, D), new THREE.MeshPhongMaterial({ color: 0x1e293b, transparent: true, opacity: 0.45 }));
          cb.position.y = cbY;
          root.add(vb, cb);
          root.add(SM.createParallelepiped(new THREE.Vector3(W, 0, 0), new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0, 0, D), new THREE.Vector3(-W / 2, cbY - 0.55, -D / 2), 0x38bdf8, 0));

          root.add(SM.createLabel("导带 (Conduction Band)", new THREE.Vector3(-1.9, cbY + 0.78, 0), { color: "#7dd3fc" }));
          root.add(SM.createLabel("满价带 (Valence Band, 2N容量)", new THREE.Vector3(-1.6, vbY - 0.78, 0), { color: "#93c5fd" }));
          root.add(SM.createLabel(isInsulator ? "宽禁带 E_g > 5 eV" : "禁带 E_g ≈ 1.1 eV", new THREE.Vector3(2.4, 0, 0), { color: "#fde047" }));

          let nElec = 0, nHole = 0;
          if (isInsulator) {
            nElec = state.tempK > 700 ? 1 : 0;
            nHole = nElec;
          } else if (state.matClass === "intrinsic") {
            nElec = Math.max(1, Math.round((state.tempK - 100) / 70));
            nHole = nElec;
          } else if (state.matClass === "ntype") {
            // Donor level E_d right below conduction band!
            const edY = gapH / 2 - 0.12;
            root.add(SM.createBond(new THREE.Vector3(-W / 2, edY, 0), new THREE.Vector3(W / 2, edY, 0), 0.022, 0x34d399));
            root.add(SM.createLabel("施主杂质能级 E_d (如 P 掺入 Si)", new THREE.Vector3(0, edY - 0.25, 0), { color: "#6ee7b7" }));
            nElec = Math.max(3, Math.round(state.tempK / 55));
            nHole = state.tempK > 450 ? 2 : 0;
          } else if (state.matClass === "ptype") {
            // Acceptor level E_a right above valence band!
            const eaY = -gapH / 2 + 0.12;
            root.add(SM.createBond(new THREE.Vector3(-W / 2, eaY, 0), new THREE.Vector3(W / 2, eaY, 0), 0.022, 0xf472b6));
            root.add(SM.createLabel("受主杂质能级 E_a (如 B 掺入 Si)", new THREE.Vector3(0, eaY + 0.25, 0), { color: "#f9a8d4" }));
            nHole = Math.max(3, Math.round(state.tempK / 55));
            nElec = state.tempK > 450 ? 2 : 0;
          }

          for (let i = 0; i < nElec; i++) {
            const em = SM.createAtom(0.12, 0xfbbf24, {
              position: new THREE.Vector3((Math.random() - 0.5) * W, cbY - 0.25 + Math.random() * 0.4, (Math.random() - 0.5) * 1.1),
              emissiveIntensity: 0.75
            });
            root.add(em);
            cbElectrons.push(em);
          }
          for (let i = 0; i < nHole; i++) {
            const hm = new THREE.Mesh(
              new THREE.TorusGeometry(0.12, 0.038, 10, 20),
              new THREE.MeshBasicMaterial({ color: 0xfb7185 })
            );
            hm.position.set((Math.random() - 0.5) * W, vbY + 0.25 - Math.random() * 0.35, (Math.random() - 0.5) * 1.1);
            root.add(hm);
            vbHoles.push(hm);
          }
        }

        if (state.applyField) {
          root.add(SM.createArrow(new THREE.Vector3(1.2, 2.55, 0), new THREE.Vector3(-1, 0, 0), 2.4, 0x38bdf8));
          root.add(SM.createLabel("外电场 E (电子向右 -E，空穴向左 +E!)", new THREE.Vector3(0, 2.92, 0), { color: "#7dd3fc" }));
        }

        const typeLabels = {
          metal_half: ["一价碱金属/贵金属", "0 eV (无隔断)", "半满导带 (N/2N)", "高电导 (dσ/dT < 0)"],
          metal_overlap: ["二价金属 (Mg, Ca)", "能带负禁带(交叠)", "双带部分填充", "优良金属导电"],
          insulator: ["绝缘体 (金刚石/SiO₂)", "~5.5–9.0 eV", "价带全满 (2N)、导带全空", "极高电阻 (σ ≈ 0)"],
          intrinsic: ["本征半导体 (纯 Si/Ge)", "1.12 eV (Si)", "热激发电子 = 空穴 (n=p)", "电导随 T 指数上升!"],
          ntype: ["N 型掺杂半导体", "E_g=1.12eV, ΔE_d≈0.045eV", "多数载流子：导带电子", "施主杂质电离导电"],
          ptype: ["P 型掺杂半导体", "E_g=1.12eV, ΔE_a≈0.045eV", "多数载流子：价带空穴(+e)", "受主捕获价带电子"]
        }[state.matClass];

        ui.setLegend([
          { color: "#fbbf24", label: "导带自由电子 (-e, 逆电场加速)" },
          { color: "#fb7185", label: "价带空穴准粒子 (+e, 顺电场加速!)" },
          { color: "#1d4ed8", label: "满占据价带背景电子 (总电流抵消=0)" }
        ]);
        ui.setMetrics([
          { label: "固体电子结构类别", value: typeLabels[0] },
          { label: "特征能隙参数", value: typeLabels[1] },
          { label: "能带轨道占据特征", value: typeLabels[2] },
          { label: "宏观导电特性", value: typeLabels[3] }
        ]);
      } else {
        // Submode B: Effective Mass m* = ħ² / (d²E/dk²) & Negative Effective Mass / Hole Origin!
        // Show 3D Tight-Binding E(k) curve E(k) = -cos(ka) + 3D real-space comparison of Band-Top Electron vs Equivalent Hole!
        const pts = [];
        for (let i = 0; i <= 160; i++) {
          const kp = -1 + (i / 160) * 2; // k / (π/a)
          pts.push(new THREE.Vector3(kp * 3.2, -1.2 * Math.cos(kp * Math.PI) + 0.5, 0));
        }
        const curveLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
        root.add(curveLine);
        root.add(SM.createLabel("能带 E(k) = E₀ - 2t cos(ka) [拐点 ka=±π/2 有效质量变号!]", new THREE.Vector3(0, 2.2, 0), { color: "#7dd3fc" }));

        kBall = SM.createAtom(0.18, 0xfbbf24, { emissiveIntensity: 0.8 });
        root.add(kBall);

        // Lower tracks: Real-space Band-Top Electron vs Equivalent Positive Hole under constant force!
        root.add(SM.createBond(new THREE.Vector3(-3.2, -1.35, 0), new THREE.Vector3(3.2, -1.35, 0), 0.015, 0x475569));
        root.add(SM.createBond(new THREE.Vector3(-3.2, -2.15, 0), new THREE.Vector3(3.2, -2.15, 0), 0.015, 0x475569));
        root.add(SM.createLabel("实空间电子包络 (布洛赫振荡)", new THREE.Vector3(-2.6, -1.02, 0), { color: "#fde047" }));
        root.add(SM.createLabel("价带顶缺失态 = 等效正空穴 (+e, m*_h > 0)", new THREE.Vector3(-2.2, -1.82, 0), { color: "#fda4af" }));

        realElecBall = SM.createAtom(0.16, 0xfbbf24, { position: new THREE.Vector3(0, -1.35, 0) });
        equivHoleBall = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.045, 10, 20), new THREE.MeshBasicMaterial({ color: 0xfb7185 }));
        equivHoleBall.position.set(0, -2.15, 0);
        root.add(realElecBall, equivHoleBall);

        ui.setLegend([
          { color: "#38bdf8", label: "周期晶格单能带色散曲线 E(k)" },
          { color: "#fbbf24", label: "恒定外力驱动下匀速扫过布里渊区的波包" },
          { color: "#fb7185", label: "能带顶负有效质量区等效正电空穴 (+e)" }
        ]);
      }

      drawPlot(0);
    }

    function drawPlot(curK) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;

      if (state.subMode === "materials") {
        const map = PH.drawFrame(ctx, w, h, {
          xMin: 100, xMax: 650, yMin: -2, yMax: 4.5,
          title: "不同固体电导率 ln σ(T) 温度依赖对比：半导体热激活 vs 金属声子散射",
          xLabel: "绝对温度 T (K)",
          yLabel: "相对对数电导率 ln σ"
        });
        const metalPts = [], semiPts = [], dopedPts = [];
        for (let T = 100; T <= 650; T += 15) {
          metalPts.push([T, 3.8 - (T - 100) * 0.0022]);
          semiPts.push([T, -2.2 + 5.8 * Math.exp(-380 / T)]);
          dopedPts.push([T, T < 250 ? 0.2 + (T - 100) * 0.01 : (T < 460 ? 1.7 - (T - 250) * 0.001 : 1.5 + (T - 460) * 0.009)]);
        }
        PH.drawCurve(ctx, map, metalPts, { color: "#38bdf8", width: 2.0 });
        PH.drawCurve(ctx, map, dopedPts, { color: "#34d399", width: 2.2 });
        PH.drawCurve(ctx, map, semiPts, { color: "#fbbf24", width: 2.2 });
        PH.drawLegend(ctx, map, [
          { color: "#38bdf8", label: "金属 (升温降电导)" },
          { color: "#34d399", label: "掺杂半导体 (电离→饱和→本征)" },
          { color: "#fbbf24", label: "本征半导体 (升温指数剧增)" }
        ]);
      } else {
        // Plot group velocity v_g ∝ sin(ka) and inverse effective mass 1/m* ∝ cos(ka)!
        const map = PH.drawFrame(ctx, w, h, {
          xMin: -1, xMax: 1, yMin: -1.3, yMax: 1.3,
          title: "紧束缚能带群速度 v_g ∝ dE/dk 与逆有效质量 (m*)⁻¹ ∝ d²E/dk²",
          xLabel: "波矢 ka / π (|ka|>π/2 进入能带顶负有效质量区!)",
          yLabel: "归一化值",
          xTickLabels: [
            { val: -1, text: "-π/a" },
            { val: -0.5, text: "-π/2a" },
            { val: 0, text: "0" },
            { val: 0.5, text: "+π/2a" },
            { val: 1, text: "+π/a" }
          ]
        });
        const vgPts = [], imPts = [];
        for (let kp = -1; kp <= 1.001; kp += 0.02) {
          vgPts.push([kp, Math.sin(kp * Math.PI)]);
          imPts.push([kp, Math.cos(kp * Math.PI)]);
        }
        PH.drawCurve(ctx, map, vgPts, { color: "#34d399", width: 2.2 });
        PH.drawCurve(ctx, map, imPts, { color: "#fb7185", width: 2.2 });
        PH.drawPoint(ctx, map, curK, Math.cos(curK * Math.PI), "#fbbf24", 4.5, Math.cos(curK * Math.PI) >= 0 ? "m* > 0" : "m* < 0 (空穴区!)");
        PH.drawLegend(ctx, map, [
          { color: "#34d399", label: "群速度 v_g = ħ⁻¹ dE/dk" },
          { color: "#fb7185", label: "曲率 (m*)⁻¹ = ħ⁻² d²E/dk²" }
        ]);
      }
    }

    function buildControls() {
      const ctrls = [
        {
          type: "pills",
          label: "7.4–7.5 实验主题切换",
          value: state.subMode,
          options: [
            { label: "材料导电性分类与掺杂", value: "materials" },
            { label: "有效质量 m* 与空穴动力学", value: "effmass" }
          ],
          onChange: (v) => { state.subMode = v; buildControls(); rebuild(); }
        }
      ];

      if (state.subMode === "materials") {
        ctrls.push(
          {
            type: "select",
            label: "选择固体材料能带填充类型",
            value: state.matClass,
            options: [
              { label: "金属 (一价半满带: Na, Cu, Au)", value: "metal_half" },
              { label: "金属 (二价能带交叠: Mg, Ca, Zn)", value: "metal_overlap" },
              { label: "绝缘体 (宽禁带满价带: 金刚石, SiO₂)", value: "insulator" },
              { label: "本征半导体 (热激发电子-空穴对: 纯 Si)", value: "intrinsic" },
              { label: "N 型掺杂半导体 (施主能级 E_d: Si:P)", value: "ntype" },
              { label: "P 型掺杂半导体 (受主能级 E_a: Si:B)", value: "ptype" }
            ],
            onChange: (v) => { state.matClass = v; rebuild(); }
          },
          {
            type: "slider",
            label: "样品绝对温度 T (调节热激发载流子浓度!)",
            min: 80, max: 750, step: 10, value: state.tempK,
            unit: " K",
            onChange: (v) => { state.tempK = v; rebuild(); }
          },
          {
            type: "checkbox",
            label: "施加外电场驱动电子与空穴反向输运",
            value: state.applyField,
            onChange: (v) => { state.applyField = v; rebuild(); }
          }
        );
      }
      ui.setControls(ctrls);
    }

    buildControls();
    rebuild();

    return {
      update(dt, elapsed) {
        if (state.subMode === "materials") {
          const drift = state.applyField ? 1.85 : 0.0;
          cbElectrons.forEach((em, idx) => {
            em.position.x += (drift + Math.sin(elapsed * 5 + idx) * 0.3) * dt;
            if (em.position.x > 3.1) em.position.x = -3.1;
          });
          // Holes (+e) move OPPOSITE to electrons (along -X, i.e. WITH electric field E)!
          vbHoles.forEach((hm, idx) => {
            hm.position.x -= (drift + Math.cos(elapsed * 5 + idx) * 0.3) * dt;
            if (hm.position.x < -3.1) hm.position.x = 3.1;
          });
        } else if (kBall) {
          // Under constant force ħ dk/dt = F > 0, k sweeps linearly across [-1, 1] and wraps at BZ boundary (Bloch Oscillation)!
          const kp = ((elapsed * 0.28 + 1) % 2) - 1;
          kBall.position.set(kp * 3.2, -1.2 * Math.cos(kp * Math.PI) + 0.5, 0);

          // Real-space position x(t) = ∫ v_g dt ∝ -cos(k(t)π)!
          const xReal = -2.2 * Math.cos(kp * Math.PI);
          if (realElecBall) realElecBall.position.x = xReal;
          if (equivHoleBall) equivHoleBall.position.x = -xReal;

          const invM = Math.cos(kp * Math.PI);
          ui.setMetrics([
            { label: "瞬时简约波矢 ka / π", value: kp.toFixed(2) },
            { label: "群速度 v_g / v_max", value: Math.sin(kp * Math.PI).toFixed(2) },
            { label: "能带曲率 (m₀/m*)", value: invM.toFixed(2) },
            { label: "动力学加速行为", value: invM >= 0 ? "正有效质量：顺外力加速" : "负有效质量：受晶格反射减速!" }
          ]);
          drawPlot(kp);
        }
      },
      onResize: () => drawPlot(0)
    };
  };
})();
