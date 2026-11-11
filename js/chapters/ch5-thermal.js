/**
 * 第 5 章：声子（II）：热学性质 (Chapter 5: Phonons II: Thermal Properties)
 * 覆盖大纲：5.1 爱因斯坦与德拜热容模型 | 5.2 非谐相互作用与热膨胀 | 5.3 声子导热性与平均自由程
 */
window.SimRegistry = window.SimRegistry || {};

(function () {
  const SM = window.SceneManager;
  const PH = window.PlotHelper;

  function clearGroup(grp) {
    grp.traverse(SM.disposeNode);
    while (grp.children.length) grp.remove(grp.children[0]);
  }

  // Accurate numerical integration for Debye Cv / 3Nk_B
  function debyeCvNorm(tRatio) {
    if (tRatio < 0.008) return (4 * Math.pow(Math.PI, 4) / 5) * Math.pow(tRatio, 3);
    const upper = 1 / tRatio;
    const steps = 80;
    const dx = upper / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
      const x = (i + 0.5) * dx;
      if (x > 35) continue;
      const ex = Math.exp(x);
      const term = (Math.pow(x, 4) * ex) / Math.pow(ex - 1, 2);
      sum += term * dx;
    }
    return 3 * Math.pow(tRatio, 3) * sum;
  }

  function einsteinCvNorm(tRatio) {
    // Choose Θ_E ≈ 0.775 Θ_D (matches high-T expansion) or Θ_E = Θ_D
    if (tRatio < 0.025) return 0;
    const x = 0.8 / tRatio;
    if (x > 40) return 0;
    const ex = Math.exp(x);
    return (x * x * ex) / Math.pow(ex - 1, 2);
  }

  // ============================================================================
  // 5.1 声子比热容：杜隆-珀蒂定律、爱因斯坦模型与德拜 T³ 模型 (三维倒空间德拜球)
  // ============================================================================
  window.SimRegistry["5-1"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.4, z: 6.6 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      tRatio: 0.25,     // T / Θ_D
      material: "Diamond",
      plotMode: "cv"    // 'cv' | 'dos'
    };

    const MAT_DEBYE = {
      Pb: { name: "铅 (Pb)", thetaD: 105 },
      Cu: { name: "铜 (Cu)", thetaD: 343 },
      Si: { name: "硅 (Si)", thetaD: 645 },
      Diamond: { name: "金刚石 (C)", thetaD: 2230 }
    };

    let modeNodes = [];
    let thermalShell = null;

    function rebuild() {
      clearGroup(root);
      modeNodes = [];

      const kD = 2.55;
      // Cutaway outer Debye sphere (octant cutaway x>0, y>0, z>0 left open to inspect interior!)
      const outerWire = new THREE.Mesh(
        new THREE.SphereGeometry(kD, 28, 20),
        new THREE.MeshBasicMaterial({ color: 0x475569, wireframe: true, transparent: true, opacity: 0.22 })
      );
      root.add(outerWire);
      root.add(SM.createLabel("德拜截止球面 k = k_D (总模数 N)", new THREE.Vector3(0, kD + 0.35, 0), { color: "#cbd5e1" }));

      // Inner glowing thermal excitation sphere k_T = min(k_D, k_D * T/Θ_D)
      thermalShell = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 24),
        new THREE.MeshPhongMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.16, depthWrite: false })
      );
      root.add(thermalShell);

      // Discrete k-space normal mode grid inside Debye sphere (with front-top-right octant cutaway for visibility)
      const sp = 0.56;
      for (let ix = -4; ix <= 4; ix++) {
        for (let iy = -4; iy <= 4; iy++) {
          for (let iz = -4; iz <= 4; iz++) {
            if (ix > 0 && iy > 0 && iz > 0) continue; // cutaway window!
            const p = new THREE.Vector3(ix * sp, iy * sp, iz * sp);
            const r = p.length();
            if (r > kD || r < 0.01) continue;
            const omegaFrac = r / kD; // ω / ω_D in (0, 1]
            const mesh = SM.createAtom(0.095, 0x1e3a8a, { position: p });
            mesh.userData = { basePos: p.clone(), omegaFrac };
            root.add(mesh);
            modeNodes.push(mesh);
          }
        }
      }

      updateThermalState();
    }

    function updateThermalState() {
      const kD = 2.55;
      const tR = state.tRatio;
      const activeR = Math.min(kD, Math.max(0.15, tR * kD));
      if (thermalShell) {
        thermalShell.scale.setScalar(activeR);
      }

      let activeCount = 0;
      modeNodes.forEach((m) => {
        const wf = m.userData.omegaFrac;
        // Mean phonon occupation n = 1 / (exp(wf / tR) - 1)
        const x = wf / Math.max(0.02, tR);
        const occ = x > 25 ? 0 : 1 / (Math.exp(x) - 1);
        if (occ > 0.25) activeCount++;

        if (occ > 0.8) {
          m.material.color.setHex(0xfbbf24); // strongly excited
          m.scale.setScalar(1.3);
        } else if (occ > 0.18) {
          m.material.color.setHex(0x34d399); // moderately excited
          m.scale.setScalar(1.08);
        } else {
          m.material.color.setHex(0x1e3a8a); // quantum frozen!
          m.scale.setScalar(0.82);
        }
      });

      const matInfo = MAT_DEBYE[state.material];
      const realT = tR * matInfo.thetaD;
      const cvD = debyeCvNorm(tR);
      const cvE = einsteinCvNorm(tR);

      ui.setLegend([
        { color: "#fbbf24", label: "充分热激发低频声子模 (ħω ≲ k_B T)" },
        { color: "#34d399", label: "部分激发过渡声子模" },
        { color: "#1e3a8a", label: "量子冻结高频模 (ħω ≫ k_B T)" }
      ]);

      ui.setMetrics([
        { label: `实际温度 (${matInfo.name})`, value: realT.toFixed(0) + ` K (Θ_D=${matInfo.thetaD}K)` },
        { label: "德拜比热 C_V / 3Nk_B", value: cvD.toFixed(3) },
        { label: "爱因斯坦比热 / 3Nk_B", value: cvE.toFixed(3) },
        { label: "热激活声子模比例", value: ((activeCount / Math.max(1, modeNodes.length)) * 100).toFixed(1) + "%" }
      ]);

      drawPlot(cvD, cvE);
    }

    function drawPlot(curCvD, curCvE) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;

      if (state.plotMode === "cv") {
        const map = PH.drawFrame(ctx, w, h, {
          xMin: 0, xMax: 1.8, yMin: 0, yMax: 1.15,
          title: "晶格摩尔热容对比：经典极限 vs 德拜 T³ vs 爱因斯坦模型",
          xLabel: "约化温度 T / Θ_D",
          yLabel: "C_V / 3Nk_B"
        });

        // Classical Dulong-Petit = 1.0
        PH.drawCurve(ctx, map, [[0, 1.0], [1.8, 1.0]], { color: "#94a3b8", dash: [5, 3], width: 1.4 });

        const dPts = [], ePts = [];
        for (let t = 0.01; t <= 1.801; t += 0.025) {
          dPts.push([t, debyeCvNorm(t)]);
          ePts.push([t, einsteinCvNorm(t)]);
        }
        PH.drawCurve(ctx, map, ePts, { color: "#f472b6", dash: [3, 2], width: 1.8 });
        PH.drawCurve(ctx, map, dPts, { color: "#38bdf8", fill: "rgba(56,189,248,0.14)", width: 2.5 });
        PH.drawPoint(ctx, map, state.tRatio, curCvD, "#fbbf24", 5, `${(curCvD * 100).toFixed(1)}%`);

        PH.drawLegend(ctx, map, [
          { color: "#38bdf8", label: "德拜模型 (低温∝T³)" },
          { color: "#f472b6", label: "爱因斯坦模型 (指数衰减)" },
          { color: "#94a3b8", label: "杜隆-珀蒂极限 3Nk_B" }
        ]);
      } else {
        // Phonon Density of States D(ω)
        const map = PH.drawFrame(ctx, w, h, {
          xMin: 0, xMax: 1.25, yMin: 0, yMax: 3.3,
          title: "声子态密度 D(ω)：德拜连续谱 ω² 截断 vs 爱因斯坦单频 δ 峰",
          xLabel: "归一化频率 ω / ω_D",
          yLabel: "态密度 D(ω)"
        });
        const dosPts = [], occPts = [];
        for (let wf = 0; wf <= 1.0; wf += 0.02) {
          const d = 3 * wf * wf;
          dosPts.push([wf, d]);
          const x = wf / Math.max(0.02, state.tRatio);
          const thermalWeight = x > 25 ? 0 : d / (Math.exp(x) - 1);
          occPts.push([wf, Math.min(3.2, thermalWeight)]);
        }
        dosPts.push([1.0, 0]);
        PH.drawCurve(ctx, map, dosPts, { color: "#38bdf8", width: 2.3 });
        PH.drawCurve(ctx, map, occPts, { color: "#fbbf24", fill: "rgba(251,191,36,0.22)", width: 1.8 });
        // Einstein delta spike at ω_E = 0.8 ω_D
        PH.drawCurve(ctx, map, [[0.8, 0], [0.8, 2.9]], { color: "#f472b6", width: 3 });
        PH.drawLegend(ctx, map, [
          { color: "#38bdf8", label: "德拜态密度 D(ω)∝ω²" },
          { color: "#fbbf24", label: "当前热激发谱 D(ω)⟨n⟩" },
          { color: "#f472b6", label: "爱因斯坦单频峰 ω_E" }
        ]);
      }
    }

    ui.setControls([
      {
        type: "slider",
        label: "约化温度 T / Θ_D (观察低温声子冻结!)",
        min: 0.04, max: 1.8, step: 0.02, value: state.tRatio,
        unit: " Θ_D",
        onChange: (v) => { state.tRatio = v; updateThermalState(); }
      },
      {
        type: "pills",
        label: "参考固体材料 (对比室温 300K 所处温区!)",
        value: state.material,
        options: [
          { label: "Pb (Θ_D=105K)", value: "Pb" },
          { label: "Cu (Θ_D=343K)", value: "Cu" },
          { label: "Si (Θ_D=645K)", value: "Si" },
          { label: "金刚石 (2230K)", value: "Diamond" }
        ],
        onChange: (v) => {
          state.material = v;
          // Set T to room temperature 300 K for immediate physical intuition!
          state.tRatio = Math.min(1.8, Math.max(0.05, 300 / MAT_DEBYE[v].thetaD));
          updateThermalState();
        }
      },
      {
        type: "pills",
        label: "下方科学图表切换",
        value: state.plotMode,
        options: [
          { label: "热容曲线 C_V(T)", value: "cv" },
          { label: "声子态密度 D(ω)", value: "dos" }
        ],
        onChange: (v) => { state.plotMode = v; updateThermalState(); }
      }
    ]);

    rebuild();

    return {
      update(dt, elapsed) {
        modeNodes.forEach((m, idx) => {
          const wf = m.userData.omegaFrac;
          const x = wf / Math.max(0.02, state.tRatio);
          const occ = x > 25 ? 0 : 1 / (Math.exp(x) - 1);
          const jitter = Math.min(0.06, 0.025 * Math.sqrt(occ));
          m.position.y = m.userData.basePos.y + Math.sin(elapsed * 8 + idx) * jitter;
        });
      },
      onResize: () => updateThermalState()
    };
  };

  // ============================================================================
  // 5.2 非谐晶体相互作用与热膨胀微观机制 (简谐对称势 vs 非谐非对称势)
  // ============================================================================
  window.SimRegistry["5-2"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 2.8, z: 10.2 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      energyE: 0.45, // Thermal energy k_B T (0.05 .. 1.1)
      anharmG: 0.52  // Cubic anharmonicity coefficient g
    };

    // Potential U(x) = x² - g x³ + 0.12 x⁴
    function evalAnharmU(x, g) {
      return x * x - g * x * x * x + 0.11 * Math.pow(x, 4);
    }

    function findTurningPoints(E, g) {
      let xLeft = 0, xRight = 0;
      for (let x = 0; x >= -1.5; x -= 0.005) {
        if (evalAnharmU(x, g) >= E) { xLeft = x; break; }
      }
      for (let x = 0; x <= 2.4; x += 0.005) {
        if (evalAnharmU(x, g) >= E) { xRight = x; break; }
        xRight = x;
      }
      return { xLeft, xRight, xMid: 0.5 * (xLeft + xRight) };
    }

    let harmAtoms = [], anharmAtoms = [];
    let harmSprings = [], anharmSprings = [];
    let endMarker = null;

    function rebuild() {
      clearGroup(root);
      harmAtoms = []; anharmAtoms = [];
      harmSprings = []; anharmSprings = [];

      const N = 7;
      const a0 = 1.05;
      const xStart = -3.2;

      root.add(SM.createLabel("理想简谐晶体 U(x)=cx² (对称振动，热膨胀 = 0)", new THREE.Vector3(0, 2.05, 0), { color: "#93c5fd" }));
      root.add(SM.createLabel("真实非谐晶体 U(x)=cx²-gx³ (左陡右缓，受热膨胀 ΔL > 0!)", new THREE.Vector3(0, -0.55, 0), { color: "#fde047" }));

      // Fixed left wall
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 4.2, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4 })
      );
      wall.position.set(xStart - 0.25, 0.1, 0);
      root.add(wall);

      // Zero-temperature reference line on right end
      const zeroEnd = xStart + (N - 1) * a0;
      root.add(SM.createBond(new THREE.Vector3(zeroEnd, -2.2, 0), new THREE.Vector3(zeroEnd, 1.8, 0), 0.02, 0x64748b, 0.7));
      root.add(SM.createLabel("T=0K 原长基准", new THREE.Vector3(zeroEnd, -2.45, 0), { color: "#94a3b8" }));

      for (let i = 0; i < N; i++) {
        const hAtom = SM.createAtom(0.22, 0x38bdf8, { position: new THREE.Vector3(xStart + i * a0, 1.2, 0) });
        hAtom.userData = { idx: i, xStart, a0 };
        root.add(hAtom);
        harmAtoms.push(hAtom);

        const aAtom = SM.createAtom(0.22, 0xfbbf24, { position: new THREE.Vector3(xStart + i * a0, -1.4, 0) });
        aAtom.userData = { idx: i, xStart, a0 };
        root.add(aAtom);
        anharmAtoms.push(aAtom);
      }

      for (let i = 0; i < N - 1; i++) {
        const sh = SM.createSpringLine(6, 0.085, 0x60a5fa, 36);
        const sa = SM.createSpringLine(6, 0.085, 0xfbbf24, 36);
        root.add(sh, sa);
        harmSprings.push(sh);
        anharmSprings.push(sa);
      }

      endMarker = SM.createArrow(new THREE.Vector3(zeroEnd, -1.95, 0), new THREE.Vector3(1, 0, 0), 0.1, 0x34d399);
      root.add(endMarker);

      updateState();
    }

    function updateState() {
      const tp = findTurningPoints(state.energyE, state.anharmG);
      const strainPct = (tp.xMid / 1.05) * 100 * 0.35;

      ui.setLegend([
        { color: "#38bdf8", label: "简谐势链 (⟨x⟩ = 0，无膨胀)" },
        { color: "#fbbf24", label: "非谐势链 (⟨x⟩ > 0，宏观伸长)" },
        { color: "#34d399", label: "受热净膨胀量 ΔL(T)" }
      ]);

      ui.setMetrics([
        { label: "热激发能级 k_B T", value: state.energyE.toFixed(2) + " ε₀" },
        { label: "左转折点 (硬排斥)", value: tp.xLeft.toFixed(3) + " Å" },
        { label: "右转折点 (软吸引)", value: "+" + tp.xRight.toFixed(3) + " Å" },
        { label: "平均键长热膨胀 ⟨Δx⟩", value: "+" + tp.xMid.toFixed(3) + ` Å (+${strainPct.toFixed(2)}%)` }
      ]);

      drawPotentialPlot(tp);
    }

    function drawPotentialPlot(tp) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: -1.1, xMax: 1.9, yMin: -0.05, yMax: 1.35,
        title: "原子间势阱对比：抛物线简谐势 vs 非对称非谐势 (中点随T右移!)",
        xLabel: "偏离零温平衡间距位移 x",
        yLabel: "势能 U(x)"
      });

      const hPts = [], aPts = [], midTrack = [];
      for (let x = -1.05; x <= 1.85; x += 0.025) {
        if (x * x <= 1.4) hPts.push([x, x * x]);
        const uA = evalAnharmU(x, state.anharmG);
        if (uA <= 1.4 && uA >= -0.1) aPts.push([x, uA]);
      }
      for (let e = 0.02; e <= 1.15; e += 0.05) {
        const t = findTurningPoints(e, state.anharmG);
        midTrack.push([t.xMid, e]);
      }

      PH.drawCurve(ctx, map, hPts, { color: "#60a5fa", dash: [4, 3], width: 1.6 });
      PH.drawCurve(ctx, map, aPts, { color: "#fbbf24", width: 2.4 });
      PH.drawCurve(ctx, map, midTrack, { color: "#34d399", width: 2.0 });

      // Current thermal energy horizontal chord [xLeft, xRight]
      PH.drawCurve(ctx, map, [[tp.xLeft, state.energyE], [tp.xRight, state.energyE]], { color: "#f87171", width: 1.8 });
      PH.drawPoint(ctx, map, tp.xMid, state.energyE, "#34d399", 5, `⟨x⟩=+${tp.xMid.toFixed(2)}`);

      PH.drawLegend(ctx, map, [
        { color: "#fbbf24", label: "非谐势 U(x)" },
        { color: "#60a5fa", label: "简谐抛物线" },
        { color: "#34d399", label: "热膨胀中点轨迹 ⟨x⟩(T)" }
      ]);
    }

    ui.setControls([
      {
        type: "slider",
        label: "晶体温度 / 热振动能量 k_B T",
        min: 0.05, max: 1.05, step: 0.03, value: state.energyE,
        unit: " ε₀",
        onChange: (v) => { state.energyE = v; updateState(); }
      },
      {
        type: "slider",
        label: "三次非谐不对称系数 g (0 = 退化为无膨胀简谐晶体!)",
        min: 0.0, max: 0.65, step: 0.03, value: state.anharmG,
        unit: "",
        onChange: (v) => { state.anharmG = v; updateState(); }
      }
    ]);

    rebuild();

    return {
      update(dt, elapsed) {
        const tp = findTurningPoints(state.energyE, state.anharmG);
        const hAmp = Math.sqrt(state.energyE) * 0.16;
        const aMidStep = tp.xMid * 0.28;
        const aOscAmp = (tp.xRight - tp.xLeft) * 0.085;

        harmAtoms.forEach((a) => {
          const { idx, xStart, a0 } = a.userData;
          if (idx === 0) { a.position.x = xStart; return; }
          a.position.x = xStart + idx * a0 + Math.sin(elapsed * 6.5 + idx * 1.1) * hAmp;
        });

        anharmAtoms.forEach((a) => {
          const { idx, xStart, a0 } = a.userData;
          if (idx === 0) { a.position.x = xStart; return; }
          // Cumulative thermal expansion idx * aMidStep + asymmetric thermal vibration!
          const osc = Math.sin(elapsed * 6.0 + idx * 1.1);
          const asymOsc = osc >= 0 ? osc * aOscAmp * 1.3 : osc * aOscAmp * 0.7;
          a.position.x = xStart + idx * (a0 + aMidStep) + asymOsc;
        });

        for (let i = 0; i < harmSprings.length; i++) {
          harmSprings[i].userData.updateEnds(harmAtoms[i].position, harmAtoms[i + 1].position);
          anharmSprings[i].userData.updateEnds(anharmAtoms[i].position, anharmAtoms[i + 1].position);
        }
      },
      onResize: () => updateState()
    };
  };

  // ============================================================================
  // 5.3 晶格导热性与声子输运 (κ = ⅓ C_V v l — 边界散射、缺陷与高温倒逆散射)
  // ============================================================================
  window.SimRegistry["5-3"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 3.4, z: 9.8 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      tempT: 0.22,     // Reduced T / Θ_D in [0.04, 1.5]
      defectLevel: 0.1 // Impurity concentration in [0, 0.8]
    };

    let phonons = [];
    let defectMeshes = [];

    function calcKappa(t, imp) {
      const cv = debyeCvNorm(t);
      // Scattering rates: 1/l = 1/L_boundary + A_imp * imp + B_umklapp * t * exp(-0.5 / t)
      const invL_bound = 0.25;
      const invL_imp = imp * 2.2;
      const invL_umklapp = 9.5 * t * Math.exp(-0.38 / Math.max(0.03, t));
      const mfp = 1 / (invL_bound + invL_imp + invL_umklapp);
      const kappa = cv * mfp * 2.5;
      return { cv, mfp, kappa, invL_umklapp };
    }

    function rebuild() {
      clearGroup(root);
      phonons = [];
      defectMeshes = [];

      const rodLen = 7.4;
      const rodH = 2.0;

      // Hot reservoir (left, red) & Cold sink (right, cyan)
      const hotBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, rodH + 0.3, rodH + 0.3),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.35 })
      );
      hotBlock.position.set(-rodLen / 2 - 0.45, 0, 0);

      const coldBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, rodH + 0.3, rodH + 0.3),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.25 })
      );
      coldBlock.position.set(rodLen / 2 + 0.45, 0, 0);
      root.add(hotBlock, coldBlock);

      root.add(SM.createLabel("高温热源 T_H", new THREE.Vector3(-rodLen / 2 - 0.45, 1.55, 0), { color: "#fca5a5" }));
      root.add(SM.createLabel("低温热沉 T_C", new THREE.Vector3(rodLen / 2 + 0.45, 1.55, 0), { color: "#7dd3fc" }));

      // Translucent crystal channel
      root.add(SM.createParallelepiped(
        new THREE.Vector3(rodLen, 0, 0),
        new THREE.Vector3(0, rodH, 0),
        new THREE.Vector3(0, 0, rodH),
        new THREE.Vector3(-rodLen / 2, -rodH / 2, -rodH / 2),
        0x94a3b8,
        0.07
      ));

      // Impurity / isotope point defects inside crystal
      const numDefects = Math.round(state.defectLevel * 22);
      for (let i = 0; i < numDefects; i++) {
        const dm = SM.createAtom(0.16, 0xa855f7, {
          position: new THREE.Vector3(
            (Math.random() - 0.5) * (rodLen - 0.8),
            (Math.random() - 0.5) * (rodH - 0.5),
            (Math.random() - 0.5) * (rodH - 0.5)
          )
        });
        root.add(dm);
        defectMeshes.push(dm);
      }

      // Phonon quasiparticle wave-packets
      const numPhonons = Math.min(55, Math.max(10, Math.round(12 + state.tempT * 36)));
      for (let i = 0; i < numPhonons; i++) {
        const pm = SM.createAtom(0.11, 0xfbbf24, {
          position: new THREE.Vector3(
            (Math.random() - 0.5) * rodLen,
            (Math.random() - 0.5) * (rodH - 0.35),
            (Math.random() - 0.5) * (rodH - 0.35)
          ),
          emissiveIntensity: 0.75
        });
        const speed = 2.6;
        const angY = (Math.random() - 0.5) * 0.6;
        const angZ = (Math.random() - 0.5) * 0.6;
        pm.userData = {
          vel: new THREE.Vector3(Math.cos(angY) * speed, Math.sin(angY) * speed, Math.sin(angZ) * speed),
          flashTimer: 0
        };
        root.add(pm);
        phonons.push(pm);
      }

      updateMetricsAndPlot();
    }

    function updateMetricsAndPlot() {
      const res = calcKappa(state.tempT, state.defectLevel);
      const regime = state.tempT < 0.12
        ? "低温边界散射区 (κ∝T³)"
        : (state.tempT < 0.32 ? "导热峰值区 (高自由程)" : "高温倒逆U散射区 (κ∝1/T)");

      ui.setLegend([
        { color: "#fbbf24", label: "向右输运热能的声子波包" },
        { color: "#f87171", label: "发生倒逆(Umklapp)/缺陷散射反转的声子" },
        { color: "#a855f7", label: "晶格点缺陷 / 同位素杂质" }
      ]);

      ui.setMetrics([
        { label: "主导散射机制", value: regime.split(" ")[0] },
        { label: "比热因子 C_V / 3Nk_B", value: res.cv.toFixed(3) },
        { label: "相对声子平均自由程 l", value: res.mfp.toFixed(2) + " L₀" },
        { label: "晶格热导率 κ (相对值)", value: res.kappa.toFixed(2) }
      ]);

      drawPlot(res.kappa);
    }

    function drawPlot(curK) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0.02, xMax: 1.5, yMin: 0, yMax: 2.6,
        title: "晶格热导率温度特性曲线 κ(T) = ⅓ C_V(T) v_s l(T)",
        xLabel: "约化温度 T / Θ_D",
        yLabel: "热导率 κ (arb.)"
      });

      const purePts = [], curPts = [];
      for (let t = 0.03; t <= 1.5; t += 0.02) {
        purePts.push([t, Math.min(2.55, calcKappa(t, 0.0).kappa)]);
        curPts.push([t, Math.min(2.55, calcKappa(t, state.defectLevel).kappa)]);
      }

      PH.drawCurve(ctx, map, purePts, { color: "#64748b", dash: [4, 3], width: 1.5 });
      PH.drawCurve(ctx, map, curPts, { color: "#38bdf8", fill: "rgba(56,189,248,0.16)", width: 2.4 });
      PH.drawPoint(ctx, map, state.tempT, Math.min(2.5, curK), "#fbbf24", 5, `κ=${curK.toFixed(2)}`);
      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: `当前样品 κ(T) (缺陷=${state.defectLevel.toFixed(2)})` },
        { color: "#64748b", label: "高纯无缺陷理想单晶极限" }
      ]);
    }

    ui.setControls([
      {
        type: "slider",
        label: "约化温度 T / Θ_D (观察低温上升→峰值→高温1/T下降!)",
        min: 0.04, max: 1.5, step: 0.02, value: state.tempT,
        unit: " Θ_D",
        onChange: (v) => { state.tempT = v; rebuild(); }
      },
      {
        type: "slider",
        label: "晶体杂质/同位素缺陷浓度 (削平低温导热峰)",
        min: 0.0, max: 0.8, step: 0.05, value: state.defectLevel,
        unit: "",
        onChange: (v) => { state.defectLevel = v; rebuild(); }
      }
    ]);

    rebuild();

    return {
      update(dt) {
        const rodHalf = 3.7;
        const boxHalf = 0.85;
        const res = calcKappa(state.tempT, state.defectLevel);
        const scatterProbPerSec = (res.invL_umklapp + state.defectLevel * 2.5) * 0.55;

        phonons.forEach((pm) => {
          pm.position.addScaledVector(pm.userData.vel, dt);

          // Boundary specular/diffuse reflection on side walls
          if (Math.abs(pm.position.y) > boxHalf) {
            pm.position.y = Math.sign(pm.position.y) * boxHalf;
            pm.userData.vel.y *= -1;
          }
          if (Math.abs(pm.position.z) > boxHalf) {
            pm.position.z = Math.sign(pm.position.z) * boxHalf;
            pm.userData.vel.z *= -1;
          }

          // Random Umklapp / Defect scattering reversing momentum!
          if (Math.random() < scatterProbPerSec * dt) {
            pm.userData.vel.x *= -1;
            pm.userData.vel.y = (Math.random() - 0.5) * 2.2;
            pm.userData.flashTimer = 0.28;
          }

          if (pm.userData.flashTimer > 0) {
            pm.userData.flashTimer -= dt;
            pm.material.color.setHex(0xf87171);
          } else {
            pm.material.color.setHex(pm.userData.vel.x > 0 ? 0xfbbf24 : 0x38bdf8);
          }

          // Re-inject from Hot Reservoir when absorbed at Cold Sink or returning to Hot side
          if (pm.position.x > rodHalf || pm.position.x < -rodHalf) {
            pm.position.x = -rodHalf + 0.05;
            pm.userData.vel.x = Math.abs(pm.userData.vel.x);
          }
        });
      },
      onResize: () => updateMetricsAndPlot()
    };
  };
})();
