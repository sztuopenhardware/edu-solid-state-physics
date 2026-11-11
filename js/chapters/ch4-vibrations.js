/**
 * 第 4 章：声子（I）：晶格振动 (Chapter 4: Phonons I: Crystal Vibrations)
 * 覆盖大纲：4.1 单原子链格波 | 4.2 双原子链声学支与光学支 | 4.3-4.5 弹性波量子化、声子准动量与非弹性散射
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
  // 4.1 一维单原子链晶格振动 (纵波/横波、ω(k) 色散、相速度与群速度、BZ边界驻波)
  // ============================================================================
  window.SimRegistry["4-1"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 3.2, z: 10.5 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      kNorm: 0.35,        // k*a / π, in [-1.5, 1.5]
      polarization: "TA", // 'LA' (longitudinal) | 'TA' (transverse)
      waveType: "travel"  // 'travel' | 'standing'
    };

    const N = 15;
    const a = 0.86;
    let atoms = [];
    let springs = [];
    let envGeo = null;

    function calcOmega(kPi) {
      return 2.0 * Math.abs(Math.sin((kPi * Math.PI) / 2));
    }

    function calcVg(kPi) {
      // Derivative dω/d(ka)
      const ka = kPi * Math.PI;
      const s = Math.sin(ka / 2);
      if (Math.abs(s) < 1e-5) return ka >= 0 ? 1.0 : -1.0;
      return Math.sign(s) * Math.cos(ka / 2);
    }

    function rebuild() {
      clearGroup(root);
      atoms = [];
      springs = [];

      for (let i = 0; i < N; i++) {
        const x0 = (i - (N - 1) / 2) * a;
        // Equilibrium ghost marker
        root.add(SM.createAtom(0.06, 0x475569, { position: new THREE.Vector3(x0, 0, 0), opacity: 0.5 }));
        const atom = SM.createAtom(0.22, i === Math.floor(N / 2) ? 0xfbbf24 : 0x38bdf8, {
          position: new THREE.Vector3(x0, 0, 0)
        });
        atom.userData.x0 = x0;
        atom.userData.idx = i - Math.floor(N / 2);
        root.add(atom);
        atoms.push(atom);
      }

      for (let i = 0; i < N - 1; i++) {
        const sp = SM.createSpringLine(7, 0.09, 0x94a3b8, 48);
        root.add(sp);
        springs.push(sp);
      }

      // Continuous wave envelope curve
      envGeo = new THREE.BufferGeometry();
      envGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(180 * 3), 3));
      const envLine = new THREE.Line(envGeo, new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.72 }));
      root.add(envLine);

      updateMetricsAndPlot();
    }

    function updateMetricsAndPlot() {
      const om = calcOmega(state.kNorm);
      const vg = calcVg(state.kNorm);
      const ka = state.kNorm * Math.PI;
      const vp = Math.abs(ka) < 1e-4 ? 1.0 : om / Math.abs(ka);
      const outsideBZ = Math.abs(state.kNorm) > 1.001;

      ui.setLegend([
        { color: "#38bdf8", label: "晶格原子 (间距 a)" },
        { color: "#fbbf24", label: "原点参考原子 (s = 0)" },
        { color: "#34d399", label: "连续格波正弦包络线" }
      ]);

      ui.setMetrics([
        { label: "简约波矢 k·a / π", value: state.kNorm.toFixed(2) + (outsideBZ ? " (超出1st BZ!)" : "") },
        { label: "角频率 ω / √(C/M)", value: om.toFixed(3) },
        { label: "相速度 v_p / v₀", value: vp.toFixed(3) },
        { label: "群速度 v_g = dω/dk", value: vg.toFixed(3) + (Math.abs(vg) < 0.05 ? " (驻波!)" : "") }
      ]);

      drawPlot(om);
    }

    function drawPlot(curOm) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: -1.5, xMax: 1.5, yMin: 0, yMax: 2.25,
        title: "一维单原子链色散关系 ω(k) = 2√(C/M)|sin(ka/2)|",
        xLabel: "波矢 ka / π (阴影区为第一布里渊区 [-1, +1])",
        yLabel: "ω / √(C/M)",
        xTickLabels: [
          { val: -1, text: "-π/a" },
          { val: 0, text: "0" },
          { val: 1, text: "+π/a" }
        ]
      });

      // Shade 1st Brillouin Zone [-1, 1]
      const xL = map.toX(-1), xR = map.toX(1);
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.fillRect(xL, map.pad.top, xR - xL, map.ph);

      // Linear sound velocity reference lines ω = v0 |k|
      PH.drawCurve(ctx, map, [[-0.7, 0.7 * Math.PI], [0, 0], [0.7, 0.7 * Math.PI]], {
        color: "rgba(148,163,184,0.4)", dash: [4, 3], width: 1.2
      });

      const pts = [];
      for (let kp = -1.5; kp <= 1.501; kp += 0.02) {
        pts.push([kp, calcOmega(kp)]);
      }
      PH.drawCurve(ctx, map, pts, { color: "#38bdf8", width: 2.4 });

      // Tangent line showing group velocity v_g at current k!
      const slope = calcVg(state.kNorm) * Math.PI * (state.kNorm >= 0 ? 1 : -1);
      const dk = 0.28;
      PH.drawCurve(ctx, map, [
        [state.kNorm - dk, curOm - slope * dk],
        [state.kNorm + dk, curOm + slope * dk]
      ], { color: "#34d399", width: 2.0 });

      PH.drawPoint(ctx, map, state.kNorm, curOm, "#fbbf24", 5, `ω=${curOm.toFixed(2)}`);
      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: "晶格色散 ω(k)" },
        { color: "#34d399", label: "切线斜率 = 群速度 v_g" }
      ]);
    }

    function syncControls() {
      ui.setControls([
        {
          type: "pills",
          label: "格波偏振模式",
          value: state.polarization,
          options: [
            { label: "横波 (TA, 直观观察波形)", value: "TA" },
            { label: "纵波 (LA, 疏密压缩波)", value: "LA" }
          ],
          onChange: (v) => { state.polarization = v; rebuild(); }
        },
        {
          type: "slider",
          label: "波矢 ka / π (可拖出 ±1 验证倒格等价性!)",
          min: -1.5, max: 1.5, step: 0.05, value: state.kNorm,
          unit: " π/a",
          onChange: (v) => { state.kNorm = v; updateMetricsAndPlot(); }
        },
        {
          type: "pills",
          label: "典型波矢一键定位",
          value: "",
          options: [
            { label: "长波极限 (0.15)", value: "0.15" },
            { label: "半区波矢 (0.50)", value: "0.50" },
            { label: "BZ边界驻波 (1.00)", value: "1.00" },
            { label: "超区等价 (1.35≡-0.65)", value: "1.35" }
          ],
          onChange: (v) => {
            state.kNorm = parseFloat(v);
            syncControls();
            updateMetricsAndPlot();
          }
        },
        {
          type: "pills",
          label: "行波 / 驻波切换",
          value: state.waveType,
          options: [
            { label: "简谐行波 exp[i(kx-ωt)]", value: "travel" },
            { label: "本征驻波 cos(kx)cos(ωt)", value: "standing" }
          ],
          onChange: (v) => { state.waveType = v; }
        }
      ]);
    }

    syncControls();
    rebuild();

    return {
      update(dt, elapsed) {
        const ka = state.kNorm * Math.PI;
        const om = calcOmega(state.kNorm) * 2.2;
        const amp = state.polarization === "LA" ? 0.28 : 0.62;

        atoms.forEach((atom) => {
          const s = atom.userData.idx;
          const u = state.waveType === "travel"
            ? amp * Math.sin(ka * s - om * elapsed)
            : amp * Math.cos(ka * s) * Math.cos(om * elapsed);
          if (state.polarization === "LA") {
            atom.position.set(atom.userData.x0 + u, 0, 0);
          } else {
            atom.position.set(atom.userData.x0, u, 0);
          }
        });

        for (let i = 0; i < springs.length; i++) {
          springs[i].userData.updateEnds(atoms[i].position, atoms[i + 1].position);
        }

        if (envGeo) {
          // Folded equivalent k in [-π, π] for physical visual guide!
          let kaFold = ((ka + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
          const arr = envGeo.attributes.position.array;
          const xStart = -(N - 1) * a * 0.5;
          const xEnd = (N - 1) * a * 0.5;
          for (let j = 0; j < 180; j++) {
            const x = xStart + (j / 179) * (xEnd - xStart);
            const sCont = x / a;
            const u = state.waveType === "travel"
              ? amp * Math.sin(kaFold * sCont - om * elapsed)
              : amp * Math.cos(kaFold * sCont) * Math.cos(om * elapsed);
            arr[j * 3] = x;
            arr[j * 3 + 1] = state.polarization === "LA" ? u * 1.4 : u;
            arr[j * 3 + 2] = 0;
          }
          envGeo.attributes.position.needsUpdate = true;
        }
      },
      onResize: () => updateMetricsAndPlot()
    };
  };

  // ============================================================================
  // 4.2 一维双原子链：声学支 (Acoustic) vs 光学支 (Optical) 同屏三维对比
  // ============================================================================
  window.SimRegistry["4-2"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 2.8, z: 11.2 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      kNorm: 0.25,     // k*(2a)/π in [0, 1], where 1 = π/(2a) BZ boundary!
      massRatio: 2.5,  // M1 / M2 >= 1.0
      polarization: "TA"
    };

    const numCells = 6; // 12 atoms per chain
    const a = 0.76;     // nearest-neighbor spacing; lattice constant = 2a
    let optAtoms = [], acoAtoms = [];
    let optSprings = [], acoSprings = [];

    function solveDiatomic(kFrac, ratio) {
      // C = 1, M2 = 1, M1 = ratio
      const M1 = ratio, M2 = 1.0;
      const ka = (kFrac * Math.PI) / 2; // since k*(2a) = kFrac * π => k*a = kFrac*π/2
      const sumInv = 1 / M1 + 1 / M2;
      const rad = Math.sqrt(Math.max(0, sumInv * sumInv - (4 * Math.sin(ka) * Math.sin(ka)) / (M1 * M2)));
      const wOpt = Math.sqrt(sumInv + rad);
      const wAco = Math.sqrt(Math.max(0, sumInv - rad));

      // Amplitude ratio v (light M2) / u (heavy M1) from (2C - M1 ω²) u = 2C cos(ka) v
      // Handle ka -> π/2 cleanly!
      let uOpt, vOpt, uAco, vAco;
      const cosKA = Math.cos(ka);
      if (Math.abs(cosKA) < 1e-4) {
        // At BZ boundary ka = π/2:
        // Optical ω+² = 2/M2 -> ONLY light M2 vibrates (uOpt = 0, vOpt = 1)!
        // Acoustic ω-² = 2/M1 -> ONLY heavy M1 vibrates (uAco = 1, vAco = 0)!
        uOpt = 0; vOpt = 1;
        uAco = 1; vAco = 0;
      } else {
        uOpt = 2 * cosKA;
        vOpt = 2 - M1 * wOpt * wOpt;
        const normO = Math.hypot(uOpt, vOpt) || 1;
        uOpt /= normO; vOpt /= normO;

        uAco = 2 * cosKA;
        vAco = 2 - M1 * wAco * wAco;
        const normA = Math.hypot(uAco, vAco) || 1;
        uAco /= normA; vAco /= normA;
      }

      return { wOpt, wAco, uOpt, vOpt, uAco, vAco };
    }

    function rebuild() {
      clearGroup(root);
      optAtoms = []; acoAtoms = [];
      optSprings = []; acoSprings = [];

      const yOpt = 1.35;
      const yAco = -1.35;
      const rHeavy = 0.25;
      const rLight = Math.max(0.14, 0.25 / Math.pow(state.massRatio, 0.28));

      root.add(SM.createLabel("光学支 (Optical ω₊：反相相对振动)", new THREE.Vector3(-2.6, yOpt + 0.9, 0), { color: "#f9a8d4" }));
      root.add(SM.createLabel("声学支 (Acoustic ω₋：同相集体声波)", new THREE.Vector3(-2.6, yAco + 0.9, 0), { color: "#7dd3fc" }));

      for (let n = 0; n < numCells; n++) {
        for (let sub = 0; sub < 2; sub++) {
          const idx = n * 2 + sub;
          const x0 = (idx - (numCells * 2 - 1) / 2) * a;
          const isHeavy = sub === 0;
          const rad = isHeavy ? rHeavy : rLight;
          const col = isHeavy ? 0x38bdf8 : 0xfbbf24;

          const aO = SM.createAtom(rad, col, { position: new THREE.Vector3(x0, yOpt, 0) });
          aO.userData = { x0, y0: yOpt, cell: n, isHeavy };
          root.add(aO);
          optAtoms.push(aO);

          const aA = SM.createAtom(rad, col, { position: new THREE.Vector3(x0, yAco, 0) });
          aA.userData = { x0, y0: yAco, cell: n, isHeavy };
          root.add(aA);
          acoAtoms.push(aA);
        }
      }

      for (let i = 0; i < optAtoms.length - 1; i++) {
        const sO = SM.createSpringLine(6, 0.08, 0xf472b6, 40);
        const sA = SM.createSpringLine(6, 0.08, 0x38bdf8, 40);
        root.add(sO, sA);
        optSprings.push(sO);
        acoSprings.push(sA);
      }

      updateReadout();
    }

    function updateReadout() {
      const sol = solveDiatomic(state.kNorm, state.massRatio);
      const wGapTop = Math.sqrt(2 / 1.0);
      const wGapBot = Math.sqrt(2 / state.massRatio);
      const gapWidth = wGapTop - wGapBot;

      ui.setLegend([
        { color: "#38bdf8", label: `重基元原子 M₁ (${state.massRatio.toFixed(1)} m)` },
        { color: "#fbbf24", label: "轻基元原子 M₂ (1.0 m)" },
        { color: "#f472b6", label: "上链：光学支 ω₊(k)" },
        { color: "#38bdf8", label: "下链：声学支 ω₋(k)" }
      ]);

      ui.setMetrics([
        { label: "简约波矢 k / (π/2a)", value: state.kNorm.toFixed(2) },
        { label: "光学支频率 ω₊", value: sol.wOpt.toFixed(3) + " ω₀" },
        { label: "声学支频率 ω₋", value: sol.wAco.toFixed(3) + " ω₀" },
        { label: "声子禁带宽度 Δω", value: gapWidth.toFixed(3) + " ω₀" }
      ]);

      drawPlot(sol, wGapBot, wGapTop);
    }

    function drawPlot(curSol, wGapBot, wGapTop) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: -1, xMax: 1, yMin: 0, yMax: 2.25,
        title: `双原子链色散关系 (M₁/M₂ = ${state.massRatio.toFixed(1)}) — 阴影为声子禁带`,
        xLabel: "波矢 k / (π / 2a)",
        yLabel: "频率 ω / √(C/M₂)",
        xTickLabels: [
          { val: -1, text: "-π/2a" },
          { val: 0, text: "0" },
          { val: 1, text: "+π/2a" }
        ]
      });

      // Shaded phonon band gap between sqrt(2/M1) and sqrt(2/M2)
      if (wGapTop - wGapBot > 0.02) {
        const yTop = map.toY(wGapTop);
        const yBot = map.toY(wGapBot);
        ctx.fillStyle = "rgba(251, 113, 133, 0.14)";
        ctx.fillRect(map.pad.left, yTop, map.pw, yBot - yTop);
      }

      const optCurve = [], acoCurve = [];
      for (let kf = -1; kf <= 1.001; kf += 0.025) {
        const s = solveDiatomic(Math.abs(kf), state.massRatio);
        optCurve.push([kf, s.wOpt]);
        acoCurve.push([kf, s.wAco]);
      }

      PH.drawCurve(ctx, map, optCurve, { color: "#f472b6", width: 2.4 });
      PH.drawCurve(ctx, map, acoCurve, { color: "#38bdf8", width: 2.4 });
      PH.drawPoint(ctx, map, state.kNorm, curSol.wOpt, "#f472b6", 4.5);
      PH.drawPoint(ctx, map, state.kNorm, curSol.wAco, "#38bdf8", 4.5);
      PH.drawLegend(ctx, map, [
        { color: "#f472b6", label: "光学支 ω₊" },
        { color: "#38bdf8", label: "声学支 ω₋" },
        { color: "#fb7185", label: "频率禁带" }
      ]);
    }

    function syncControls() {
      ui.setControls([
        {
          type: "slider",
          label: "波矢 k / (π/2a) [0=区中心, 1=区边界]",
          min: 0.02, max: 1.0, step: 0.02, value: state.kNorm,
          unit: "",
          onChange: (v) => { state.kNorm = v; updateReadout(); }
        },
        {
          type: "slider",
          label: "基元原子质量比 M₁ / M₂ (1.0 时禁带消失!)",
          min: 1.0, max: 5.0, step: 0.1, value: state.massRatio,
          unit: "",
          onChange: (v) => { state.massRatio = v; rebuild(); }
        },
        {
          type: "pills",
          label: "关键物理极限快速观察",
          value: "",
          options: [
            { label: "k→0 长波反相/同相", value: "0.06" },
            { label: "k=0.5 中间色散", value: "0.50" },
            { label: "k=π/2a 边界轻/重分离!", value: "1.00" }
          ],
          onChange: (v) => {
            state.kNorm = parseFloat(v);
            syncControls();
            updateReadout();
          }
        },
        {
          type: "pills",
          label: "振动偏振方向",
          value: state.polarization,
          options: [
            { label: "横波偏振 (TA/TO)", value: "TA" },
            { label: "纵波偏振 (LA/LO)", value: "LA" }
          ],
          onChange: (v) => { state.polarization = v; }
        }
      ]);
    }

    syncControls();
    rebuild();

    return {
      update(dt, elapsed) {
        const sol = solveDiatomic(state.kNorm, state.massRatio);
        const ka2 = state.kNorm * Math.PI; // k * (2a)
        const ampScale = state.polarization === "LA" ? 0.32 : 0.62;

        optAtoms.forEach((atom) => {
          const { x0, y0, cell, isHeavy } = atom.userData;
          const phase = ka2 * cell + (isHeavy ? 0 : ka2 * 0.5) - sol.wOpt * 2.1 * elapsed;
          const eig = isHeavy ? sol.uOpt : sol.vOpt;
          const disp = ampScale * eig * Math.cos(phase);
          if (state.polarization === "LA") atom.position.set(x0 + disp, y0, 0);
          else atom.position.set(x0, y0 + disp, 0);
        });

        acoAtoms.forEach((atom) => {
          const { x0, y0, cell, isHeavy } = atom.userData;
          const phase = ka2 * cell + (isHeavy ? 0 : ka2 * 0.5) - sol.wAco * 2.1 * elapsed;
          const eig = isHeavy ? sol.uAco : sol.vAco;
          const disp = ampScale * eig * Math.cos(phase);
          if (state.polarization === "LA") atom.position.set(x0 + disp, y0, 0);
          else atom.position.set(x0, y0 + disp, 0);
        });

        for (let i = 0; i < optSprings.length; i++) {
          optSprings[i].userData.updateEnds(optAtoms[i].position, optAtoms[i + 1].position);
          acoSprings[i].userData.updateEnds(acoAtoms[i].position, acoAtoms[i + 1].position);
        }
      },
      onResize: () => updateReadout()
    };
  };

  // ============================================================================
  // 4.3–4.5 弹性波量子化 (声子)、声子准动量与非弹性散射 (N过程 vs U过程)
  // ============================================================================
  window.SimRegistry["4-3"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.2, y: 5.5, z: 7.2 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      subMode: "umklapp", // 'quantized' (4.3 Normal Modes & Phonon Number) | 'umklapp' (4.4-4.5 Quasi-momentum N vs U)
      nx: 2,
      ny: 1,
      tempRatio: 1.2,     // k_B T / ħω
      k1Mag: 0.65,
      k2Mag: 0.62,
      angle2Deg: 28
    };

    let gridAtoms = [];

    function rebuild() {
      clearGroup(root);
      gridAtoms = [];

      if (state.subMode === "quantized") {
        // 2D 9x9 coupled lattice normal mode membrane
        const M = 9;
        const sp = 0.65;
        for (let ix = 0; ix < M; ix++) {
          for (let iz = 0; iz < M; iz++) {
            const x = (ix - (M - 1) / 2) * sp;
            const z = (iz - (M - 1) / 2) * sp;
            const atom = SM.createAtom(0.14, 0x38bdf8, { position: new THREE.Vector3(x, 0, z) });
            atom.userData = { ix, iz, x, z, M };
            root.add(atom);
            gridAtoms.push(atom);
          }
        }
        // Frame border
        const L = (M - 1) * sp;
        root.add(SM.createParallelepiped(
          new THREE.Vector3(L, 0, 0), new THREE.Vector3(0, 0.01, 0), new THREE.Vector3(0, 0, L),
          new THREE.Vector3(-L / 2, 0, -L / 2), 0x64748b, 0
        ));

        const nAvg = 1 / (Math.exp(1 / Math.max(0.05, state.tempRatio)) - 1);
        const energyQuanta = nAvg + 0.5;

        ui.setLegend([
          { color: "#38bdf8", label: "简正模驻波波节 (零振幅)" },
          { color: "#fbbf24", label: "简正模波腹 (振幅 ∝ √(⟨n⟩ + ½))" }
        ]);
        ui.setMetrics([
          { label: "简正振动模指标", value: `(m_x=${state.nx}, m_y=${state.ny})` },
          { label: "平均热声子数 ⟨n_k⟩", value: nAvg.toFixed(2) + " 个声子" },
          { label: "模式总能量 E / ħω", value: energyQuanta.toFixed(2) + " (含½零点能)" },
          { label: "玻色统计属性", value: "声子数不守恒 (S=0)" }
        ]);
      } else {
        // 3D Reciprocal space 1st Brillouin Zone [-π/a, π/a] in XZ plane showing k1 + k2 = k3 + G!
        const bzHalf = 2.0; // represents π/a!
        // 1st BZ square slab in XZ plane
        const bzMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bzHalf * 2, 0.06, bzHalf * 2),
          new THREE.MeshPhongMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.35 })
        );
        root.add(bzMesh);
        root.add(SM.createParallelepiped(
          new THREE.Vector3(bzHalf * 2, 0, 0),
          new THREE.Vector3(0, 0.08, 0),
          new THREE.Vector3(0, 0, bzHalf * 2),
          new THREE.Vector3(-bzHalf, -0.04, -bzHalf),
          0x38bdf8,
          0
        ));
        root.add(SM.createLabel("第一布里渊区 [-π/a, +π/a]", new THREE.Vector3(0, -0.35, bzHalf + 0.35), { color: "#7dd3fc" }));

        // Adjacent 2nd zone ghost frame along +X
        root.add(SM.createParallelepiped(
          new THREE.Vector3(bzHalf * 2, 0, 0),
          new THREE.Vector3(0, 0.05, 0),
          new THREE.Vector3(0, 0, bzHalf * 2),
          new THREE.Vector3(bzHalf, -0.025, -bzHalf),
          0x475569,
          0
        ));

        const k1 = new THREE.Vector3(state.k1Mag * bzHalf, 0.1, 0.25 * bzHalf);
        const rad = (state.angle2Deg * Math.PI) / 180;
        const k2 = new THREE.Vector3(state.k2Mag * Math.cos(rad) * bzHalf, 0.1, state.k2Mag * Math.sin(rad) * bzHalf);
        const kSum = new THREE.Vector3(k1.x + k2.x, 0.1, k1.z + k2.z);

        // Determine if kSum falls outside [-bzHalf, bzHalf]!
        let Gx = 0, Gz = 0;
        if (kSum.x > bzHalf) Gx = 2 * bzHalf;
        if (kSum.x < -bzHalf) Gx = -2 * bzHalf;
        if (kSum.z > bzHalf) Gz = 2 * bzHalf;
        if (kSum.z < -bzHalf) Gz = -2 * bzHalf;

        const isUmklapp = (Gx !== 0 || Gz !== 0);
        const k3 = new THREE.Vector3(kSum.x - Gx, 0.1, kSum.z - Gz);
        const origin = new THREE.Vector3(0, 0.1, 0);

        // Draw k1 from origin, k2 from tip of k1!
        root.add(SM.createArrow(origin, k1, k1.length(), 0x38bdf8, 0.25, 0.09));
        root.add(SM.createLabel("k₁", k1.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0.28, 0)), { color: "#7dd3fc" }));

        root.add(SM.createArrow(k1, k2, k2.length(), 0x818cf8, 0.25, 0.09));
        root.add(SM.createLabel("k₂", k1.clone().addScaledVector(k2, 0.5).add(new THREE.Vector3(0, 0.28, 0)), { color: "#c7d2fe" }));

        if (!isUmklapp) {
          root.add(SM.createArrow(origin, k3, k3.length(), 0x34d399, 0.28, 0.1));
          root.add(SM.createLabel("k₃ = k₁+k₂ (N正常过程, G=0)", k3.clone().add(new THREE.Vector3(0, 0.35, 0)), { color: "#6ee7b7" }));
        } else {
          // Dashed / ghost un-folded k1+k2 outside BZ + glowing -G folding back to k3!
          root.add(SM.createBond(origin, kSum, 0.025, 0x94a3b8, 0.6));
          root.add(SM.createLabel("k₁+k₂ (超出1st BZ)", kSum.clone().add(new THREE.Vector3(0, 0.3, 0)), { color: "#cbd5e1" }));
          const minusG = new THREE.Vector3(-Gx, 0, -Gz);
          root.add(SM.createArrow(kSum, minusG, minusG.length(), 0xf87171, 0.3, 0.11));
          root.add(SM.createLabel("-G (倒格矢折叠)", kSum.clone().addScaledVector(minusG, 0.5).add(new THREE.Vector3(0, 0.38, 0)), { color: "#fca5a5" }));

          root.add(SM.createArrow(origin, k3, k3.length(), 0xfbbf24, 0.28, 0.11));
          root.add(SM.createLabel("k₃ (U倒逆过程：动量反向!)", k3.clone().add(new THREE.Vector3(0, 0.35, 0)), { color: "#fde047" }));
        }

        ui.setLegend([
          { color: "#38bdf8", label: "入射声子准动量 k₁" },
          { color: "#818cf8", label: "第二声子 / 散射转移 k₂" },
          { color: "#34d399", label: "正常过程 (N: G=0, 动量守恒)" },
          { color: "#fbbf24", label: "倒逆过程 (U: G≠0, 动量反转产生热阻!)" }
        ]);
        ui.setMetrics([
          { label: "合成波矢 (k₁+k₂)_x", value: ((kSum.x / bzHalf)).toFixed(2) + " π/a" },
          { label: "散射碰撞类型", value: isUmklapp ? "倒逆过程 (Umklapp!)" : "正常过程 (Normal)" },
          { label: "参与倒格矢 G", value: isUmklapp ? `(${Gx / bzHalf}, ${Gz / bzHalf}) π/a` : "(0, 0)" },
          { label: "折回后真实波矢 k₃_x", value: (k3.x / bzHalf).toFixed(2) + " π/a" }
        ]);
      }

      drawPlot();
    }

    function drawPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0.05, xMax: 3.0, yMin: 0, yMax: 3.2,
        title: "玻色-爱因斯坦声子热平均占据数 ⟨n⟩ = 1 / (exp(ħω/k_BT) - 1)",
        xLabel: "约化温度 k_B T / ħω",
        yLabel: "平均声子数 ⟨n⟩"
      });

      const nPts = [], ePts = [];
      for (let t = 0.08; t <= 3.0; t += 0.03) {
        const n = 1 / (Math.exp(1 / t) - 1);
        nPts.push([t, n]);
        ePts.push([t, n + 0.5]);
      }
      PH.drawCurve(ctx, map, ePts, { color: "#fbbf24", dash: [4, 3], width: 1.6 });
      PH.drawCurve(ctx, map, nPts, { color: "#38bdf8", fill: "rgba(56,189,248,0.15)", width: 2.3 });
      const curN = 1 / (Math.exp(1 / Math.max(0.05, state.tempRatio)) - 1);
      PH.drawPoint(ctx, map, state.tempRatio, Math.min(3.1, curN), "#34d399", 5, `⟨n⟩=${curN.toFixed(2)}`);
      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: "声子数 ⟨n⟩" },
        { color: "#fbbf24", label: "总能量/ħω = ⟨n⟩ + ½(零点能)" }
      ]);
    }

    function buildControls() {
      const ctrls = [
        {
          type: "pills",
          label: "实验主题切换",
          value: state.subMode,
          options: [
            { label: "4.4/4.5 准动量与U倒逆过程", value: "umklapp" },
            { label: "4.3 简正模量子化与声子数", value: "quantized" }
          ],
          onChange: (v) => { state.subMode = v; buildControls(); rebuild(); }
        }
      ];

      if (state.subMode === "umklapp") {
        ctrls.push(
          {
            type: "slider",
            label: "声子 1 波矢大小 |k₁| / (π/a)",
            min: 0.2, max: 0.95, step: 0.05, value: state.k1Mag,
            unit: " π/a",
            onChange: (v) => { state.k1Mag = v; rebuild(); }
          },
          {
            type: "slider",
            label: "声子 2 波矢大小 |k₂| / (π/a)",
            min: 0.15, max: 0.95, step: 0.05, value: state.k2Mag,
            unit: " π/a",
            onChange: (v) => { state.k2Mag = v; rebuild(); }
          },
          {
            type: "slider",
            label: "声子 2 入射夹角 φ",
            min: -90, max: 90, step: 2, value: state.angle2Deg,
            unit: "°",
            onChange: (v) => { state.angle2Deg = v; rebuild(); }
          }
        );
      } else {
        ctrls.push(
          {
            type: "slider",
            label: "简正模波数 m_x",
            min: 1, max: 4, step: 1, value: state.nx,
            unit: "",
            onChange: (v) => { state.nx = v; rebuild(); }
          },
          {
            type: "slider",
            label: "简正模波数 m_y",
            min: 1, max: 4, step: 1, value: state.ny,
            unit: "",
            onChange: (v) => { state.ny = v; rebuild(); }
          },
          {
            type: "slider",
            label: "约化温度 k_B T / ħω",
            min: 0.1, max: 2.8, step: 0.05, value: state.tempRatio,
            unit: "",
            onChange: (v) => { state.tempRatio = v; rebuild(); }
          }
        );
      }

      ui.setControls(ctrls);
    }

    buildControls();
    rebuild();

    return {
      update(dt, elapsed) {
        if (state.subMode === "quantized" && gridAtoms.length > 0) {
          const nAvg = 1 / (Math.exp(1 / Math.max(0.05, state.tempRatio)) - 1);
          const amp = Math.min(0.95, 0.28 * Math.sqrt(nAvg + 0.5));
          gridAtoms.forEach((a) => {
            const { ix, iz, M } = a.userData;
            const s1 = Math.sin((state.nx * Math.PI * ix) / (M - 1));
            const s2 = Math.sin((state.ny * Math.PI * iz) / (M - 1));
            const y = amp * s1 * s2 * Math.cos(elapsed * 4.2);
            a.position.y = y;
            const mag = Math.abs(s1 * s2);
            a.material.color.setHex(mag > 0.55 ? 0xfbbf24 : 0x38bdf8);
          });
        }
      },
      onResize: drawPlot
    };
  };
})();
