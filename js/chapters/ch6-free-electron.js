/**
 * 第 6 章：自由电子费米气 (Chapter 6: Free Electron Fermi Gas)
 * 覆盖大纲：6.1&6.3 势箱能级与三维费米球 | 6.2&6.4&6.7 费米分布温度演化与电子热容 | 6.5 电导率与欧姆定律 | 6.6 磁场运动与霍尔效应
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
  // 6.1 & 6.3 一维势箱能级与三维 k 空间自由电子费米球
  // ============================================================================
  window.SimRegistry["6-1"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.5, z: 6.6 });
    const root = new THREE.Group();
    simGroup.add(root);

    const METALS = {
      Na: { name: "钠 (Na, 1价)", n: 2.65, ef: 3.24, tf: 37700, vf: 1.07, kfScale: 1.55 },
      Li: { name: "锂 (Li, 1价)", n: 4.70, ef: 4.74, tf: 55100, vf: 1.29, kfScale: 1.82 },
      Cu: { name: "铜 (Cu, 1价)", n: 8.47, ef: 7.00, tf: 81600, vf: 1.57, kfScale: 2.15 },
      Al: { name: "铝 (Al, 3价)", n: 18.1, ef: 11.7, tf: 136000, vf: 2.03, kfScale: 2.58 }
    };

    const state = {
      metal: "Cu",
      cutaway: true,
      subView: "fermi3d", // 'fermi3d' | 'box1d'
      quantumN: 3
    };

    let wave1DLine = null;

    function rebuild() {
      clearGroup(root);
      wave1DLine = null;
      const m = METALS[state.metal];

      if (state.subView === "fermi3d") {
        const kF = m.kfScale;
        // Translucent Fermi sphere
        const sphGeo = new THREE.SphereGeometry(kF, 36, 26);
        const sphMat = new THREE.MeshPhongMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        root.add(new THREE.Mesh(sphGeo, sphMat));

        // Equator ring at k_z = 0
        const eq = new THREE.Mesh(
          new THREE.RingGeometry(kF - 0.025, kF + 0.025, 64),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
        );
        eq.rotation.x = Math.PI / 2;
        root.add(eq);

        // Discrete k-space quantum states Δk = 2π/L
        const dk = 0.52;
        let occupiedStates = 0;
        for (let ix = -5; ix <= 5; ix++) {
          for (let iy = -5; iy <= 5; iy++) {
            for (let iz = -5; iz <= 5; iz++) {
              const p = new THREE.Vector3(ix * dk, iy * dk, iz * dk);
              const r = p.length();
              if (r > 2.85) continue;
              if (r <= kF) {
                occupiedStates++;
                if (state.cutaway && ix > 0 && iy > 0 && iz > 0) continue;
                const nearSurface = r > kF - dk * 0.85;
                root.add(SM.createAtom(0.095, nearSurface ? 0xfbbf24 : 0x38bdf8, { position: p }));
              } else if (r < kF + dk * 1.1 && (ix === 0 || iy === 0 || iz === 0)) {
                // Sparse unoccupied states outside k_F
                root.add(SM.createAtom(0.05, 0x475569, { position: p, opacity: 0.45 }));
              }
            }
          }
        }

        root.add(SM.createArrow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.4, 0.3).normalize(), kF, 0xfbbf24, 0.25, 0.09));
        root.add(SM.createLabel(`费米半径 k_F (E_F = ${m.ef} eV)`, new THREE.Vector3(0, kF + 0.38, 0), { color: "#fde047" }));
      } else {
        // 6.1 1D Infinite Potential Well standing wave eigenstates ψ_n(x) = sqrt(2/L) sin(nπx/L)
        const L = 6.0;
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x64748b }));
        leftWall.position.set(-L / 2 - 0.09, 0.4, 0);
        const rightWall = leftWall.clone();
        rightWall.position.set(L / 2 + 0.09, 0.4, 0);
        root.add(leftWall, rightWall);
        root.add(SM.createLabel("U = ∞ (x=0)", new THREE.Vector3(-L / 2, 2.85, 0), { color: "#cbd5e1" }));
        root.add(SM.createLabel("U = ∞ (x=L)", new THREE.Vector3(L / 2, 2.85, 0), { color: "#cbd5e1" }));

        for (let n = 1; n <= 4; n++) {
          const yLevel = -1.6 + n * 0.95;
          root.add(SM.createBond(new THREE.Vector3(-L / 2, yLevel, 0), new THREE.Vector3(L / 2, yLevel, 0), 0.015, 0x475569, 0.6));
          root.add(SM.createLabel(`n=${n} (E_${n}=${n * n}E₁)`, new THREE.Vector3(-L / 2 - 1.05, yLevel, 0), {
            color: n === state.quantumN ? "#fde047" : "#94a3b8"
          }));
          // Two opposite-spin electrons per occupied level
          if (n <= 3) {
            root.add(SM.createAtom(0.13, 0x38bdf8, { position: new THREE.Vector3(-0.25, yLevel, 0.35) }));
            root.add(SM.createAtom(0.13, 0xf472b6, { position: new THREE.Vector3(0.25, yLevel, 0.35) }));
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(140 * 3), 3));
        wave1DLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfbbf24 }));
        root.add(wave1DLine);
      }

      ui.setLegend([
        { color: "#38bdf8", label: "基态被占满的内部 k 量子态 (2e⁻/态)" },
        { color: "#fbbf24", label: "费米面 k = k_F 高速前线电子" },
        { color: "#475569", label: "球外未占据激发空态 (k > k_F)" }
      ]);

      ui.setMetrics([
        { label: "电子浓度 n", value: `${m.n} × 10²² cm⁻³` },
        { label: "费米能量 E_F", value: m.ef.toFixed(2) + " eV" },
        { label: "费米温度 T_F = E_F/k_B", value: m.tf.toLocaleString() + " K" },
        { label: "费米速度 v_F", value: m.vf.toFixed(2) + " × 10⁶ m/s" }
      ]);

      drawDOSPlot(m);
    }

    function drawDOSPlot(m) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: 14, yMin: 0, yMax: 4.0,
        title: "三维自由电子气态密度 D(E) ∝ √E (T=0K 填充至 E_F)",
        xLabel: "电子能量 E (eV)",
        yLabel: "态密度 D(E)"
      });

      const fullPts = [], fillPts = [];
      for (let e = 0; e <= 14; e += 0.15) {
        const d = Math.sqrt(e);
        fullPts.push([e, d]);
        if (e <= m.ef) fillPts.push([e, d]);
      }
      fillPts.push([m.ef, Math.sqrt(m.ef)]);

      PH.drawCurve(ctx, map, fillPts, { color: "#38bdf8", fill: "rgba(56,189,248,0.28)", width: 2.2 });
      PH.drawCurve(ctx, map, fullPts, { color: "#94a3b8", dash: [4, 3], width: 1.6 });
      PH.drawPoint(ctx, map, m.ef, Math.sqrt(m.ef), "#fbbf24", 5, `E_F=${m.ef}eV`);
    }

    ui.setControls([
      {
        type: "pills",
        label: "6.1 / 6.3 维度切换",
        value: state.subView,
        options: [
          { label: "6.3 三维 k 空间费米球", value: "fermi3d" },
          { label: "6.1 一维无限深势箱能级", value: "box1d" }
        ],
        onChange: (v) => { state.subView = v; rebuild(); }
      },
      {
        type: "pills",
        label: "典型金属材料切换",
        value: state.metal,
        options: [
          { label: "Na (1价)", value: "Na" },
          { label: "Li (1价)", value: "Li" },
          { label: "Cu (1价)", value: "Cu" },
          { label: "Al (3价)", value: "Al" }
        ],
        onChange: (v) => { state.metal = v; rebuild(); }
      },
      {
        type: "slider",
        label: "一维驻波量子数 n (仅一维模式生效)",
        min: 1, max: 4, step: 1, value: state.quantumN,
        unit: "",
        onChange: (v) => { state.quantumN = v; if (state.subView === "box1d") rebuild(); }
      },
      {
        type: "checkbox",
        label: "开启费米球八分之一剖切视窗",
        value: state.cutaway,
        onChange: (v) => { state.cutaway = v; rebuild(); }
      }
    ]);

    rebuild();

    return {
      update(dt, elapsed) {
        if (wave1DLine) {
          const L = 6.0;
          const yLevel = -1.6 + state.quantumN * 0.95;
          const arr = wave1DLine.geometry.attributes.position.array;
          for (let i = 0; i < 140; i++) {
            const frac = i / 139;
            const x = -L / 2 + frac * L;
            const psi = 0.55 * Math.sin(state.quantumN * Math.PI * frac) * Math.cos(elapsed * (2 + state.quantumN * 1.4));
            arr[i * 3] = x;
            arr[i * 3 + 1] = yLevel + psi;
            arr[i * 3 + 2] = 0;
          }
          wave1DLine.geometry.attributes.position.needsUpdate = true;
        }
      },
      onResize: () => drawDOSPlot(METALS[state.metal])
    };
  };

  // ============================================================================
  // 6.2 & 6.4 (& 6.7) 费米-狄拉克分布温度演化与电子气热容 C_el = γT
  // ============================================================================
  window.SimRegistry["6-2"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.3, z: 6.6 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      tauRatio: 0.06, // k_B T / E_F (0.005 .. 0.22 for clear visual)
      plotTab: "fd"   // 'fd' (Fermi-Dirac f(E)) | 'heatcap' (C/T vs T² plot)
    };

    function fermiDirac(eRatio, tau) {
      if (tau < 0.002) return eRatio <= 1.0 ? 1.0 : 0.0;
      const x = (eRatio - 1.0) / tau;
      if (x > 35) return 0;
      if (x < -35) return 1;
      return 1 / (Math.exp(x) + 1);
    }

    function rebuild() {
      clearGroup(root);
      const kF = 2.05;

      // Core frozen interior Fermi sea
      const coreR = Math.max(0.4, kF * Math.sqrt(Math.max(0.1, 1 - 1.8 * state.tauRatio)));
      const coreMesh = new THREE.Mesh(
        new THREE.SphereGeometry(coreR, 32, 24),
        new THREE.MeshPhongMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35, depthWrite: false })
      );
      root.add(coreMesh);

      // Reference T=0 sharp Fermi surface wireframe
      const refWire = new THREE.Mesh(
        new THREE.SphereGeometry(kF, 28, 20),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8, wireframe: true, transparent: true, opacity: 0.22 })
      );
      root.add(refWire);

      // Outer thermally smeared halo ~ k_F * sqrt(1 + 2*tau)
      if (state.tauRatio > 0.01) {
        const haloR = kF * Math.sqrt(1 + 2.2 * state.tauRatio);
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(haloR, 32, 24),
          new THREE.MeshPhongMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.14, depthWrite: false })
        );
        root.add(halo);
      }

      // Sample k-points showing deep occupied (blue), inner vacant holes (rose), and outer thermally excited electrons (gold)!
      const sp = 0.46;
      for (let ix = -5; ix <= 5; ix++) {
        for (let iy = -5; iy <= 5; iy++) {
          for (let iz = -5; iz <= 5; iz++) {
            if (ix > 0 && iy > 0 && iz > 0) continue; // cutaway octant
            const p = new THREE.Vector3(ix * sp, iy * sp, iz * sp);
            const r = p.length();
            if (r > 2.75 || r < 0.01) continue;
            const eRatio = (r * r) / (kF * kF);
            const f = fermiDirac(eRatio, state.tauRatio);

            if (eRatio <= 1.0) {
              // Inside T=0 Fermi sphere: if f < 0.82, show some states thermally vacated!
              const isVacated = f < 0.78 && ((Math.abs(ix * 7 + iy * 13 + iz * 19) % 5) === 0);
              root.add(SM.createAtom(isVacated ? 0.085 : 0.085, isVacated ? 0xfb7185 : 0x38bdf8, {
                position: p,
                opacity: isVacated ? 0.9 : 0.65
              }));
            } else if (f > 0.06) {
              // Outside T=0 Fermi sphere: thermally excited electrons!
              if (((Math.abs(ix * 11 + iy * 5 + iz * 17) % 3) === 0) || f > 0.22) {
                root.add(SM.createAtom(0.095, 0xfbbf24, { position: p, emissiveIntensity: 0.55 }));
              }
            }
          }
        }
      }

      const cElNorm = (Math.PI * Math.PI / 2) * state.tauRatio; // C_el / Nk_B
      const classicRatio = (cElNorm / 1.5) * 100; // % of classical (3/2)Nk_B

      ui.setLegend([
        { color: "#38bdf8", label: "泡利锁定内层满占据电子 (f ≈ 1)" },
        { color: "#fb7185", label: "费米面内侧热激发腾出的空态" },
        { color: "#fbbf24", label: "跃迁至 k > k_F 壳层的热激发电子" }
      ]);

      ui.setMetrics([
        { label: "热激发比 k_B T / E_F", value: state.tauRatio.toFixed(3) + ` (≈${(state.tauRatio * 70000).toFixed(0)}K)` },
        { label: "有效受激电子占比", value: `~${(state.tauRatio * 100).toFixed(1)}%` },
        { label: "电子摩尔热容 C_el / Nk_B", value: cElNorm.toFixed(3) },
        { label: "占经典值 (3/2 Nk_B) 比例", value: classicRatio.toFixed(1) + "%" }
      ]);

      drawPlot();
    }

    function drawPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;

      if (state.plotTab === "fd") {
        const map = PH.drawFrame(ctx, w, h, {
          xMin: 0, xMax: 1.8, yMin: 0, yMax: 1.35,
          title: "费米-狄拉克分布 f(E,T) 与热软化占据谱 D(E)·f(E,T)",
          xLabel: "归一化能量 E / E_F",
          yLabel: "占据概率 f(E) / 占据态密度"
        });

        const zeroStep = [[0, 1], [1, 1], [1, 0], [1.8, 0]];
        const fPts = [], occPts = [];
        for (let e = 0; e <= 1.8; e += 0.015) {
          const f = fermiDirac(e, state.tauRatio);
          fPts.push([e, f]);
          occPts.push([e, Math.sqrt(e) * f * 0.92]);
        }

        PH.drawCurve(ctx, map, zeroStep, { color: "#64748b", dash: [4, 3], width: 1.4 });
        PH.drawCurve(ctx, map, occPts, { color: "#fbbf24", fill: "rgba(251,191,36,0.18)", width: 1.8 });
        PH.drawCurve(ctx, map, fPts, { color: "#38bdf8", width: 2.4 });
        PH.drawPoint(ctx, map, 1.0, 0.5, "#34d399", 4.5, "f(μ)=0.5");

        PH.drawLegend(ctx, map, [
          { color: "#38bdf8", label: "费米分布 f(E,T)" },
          { color: "#fbbf24", label: "实际占据谱 √E·f(E)" },
          { color: "#64748b", label: "T=0K 阶跃分布" }
        ]);
      } else {
        // Classic Kittel experimental plot: C/T = γ + A T² vs T²!
        const map = PH.drawFrame(ctx, w, h, {
          xMin: 0, xMax: 20, yMin: 0, yMax: 6.0,
          title: "极低温金属比热线性标定图：C/T = γ(电子截距) + A·T²(声子斜率)",
          xLabel: "T² (K²)",
          yLabel: "C / T (mJ·mol⁻¹·K⁻²)"
        });
        const linePts = [];
        for (let t2 = 0; t2 <= 20; t2 += 1) {
          linePts.push([t2, 1.35 + 0.21 * t2]);
        }
        PH.drawCurve(ctx, map, [[0, 1.35], [20, 1.35]], { color: "#fbbf24", dash: [4, 3], width: 1.6 });
        PH.drawCurve(ctx, map, linePts, { color: "#38bdf8", fill: "rgba(56,189,248,0.14)", width: 2.4 });
        PH.drawPoint(ctx, map, 0, 1.35, "#fbbf24", 5, "截距 γ (电子热容)");
        PH.drawLegend(ctx, map, [
          { color: "#38bdf8", label: "总比热 C/T = γ + AT²" },
          { color: "#fbbf24", label: "纯电子贡献截距 γ" }
        ]);
      }
    }

    ui.setControls([
      {
        type: "slider",
        label: "约化热能 k_B T / E_F (室温金属仅 ~0.004!)",
        min: 0.00, max: 0.22, step: 0.005, value: state.tauRatio,
        unit: " E_F",
        onChange: (v) => { state.tauRatio = v; rebuild(); }
      },
      {
        type: "pills",
        label: "特征温区一键体验",
        value: "",
        options: [
          { label: "绝对零度 (0.000)", value: "0.0" },
          { label: "室温真实尺度 (0.005)", value: "0.005" },
          { label: "放大观察激发壳层 (0.08)", value: "0.08" }
        ],
        onChange: (v) => { state.tauRatio = parseFloat(v); rebuild(); }
      },
      {
        type: "pills",
        label: "科学分析图切换",
        value: state.plotTab,
        options: [
          { label: "6.2 费米分布软化图", value: "fd" },
          { label: "6.4/6.7 低温 C/T-T² 标定线", value: "heatcap" }
        ],
        onChange: (v) => { state.plotTab = v; drawPlot(); }
      }
    ]);

    rebuild();
    return { onResize: drawPlot };
  };

  // ============================================================================
  // 6.5 电导率与欧姆定律：实空间碰撞弛豫 + 动量空间费米球整体平移 δk
  // ============================================================================
  window.SimRegistry["6-5"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 3.4, z: 10.6 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      eField: 1.0,    // Electric field along -X -> electrons drift along +X!
      scatterRate: 0.35 // Phonon + impurity scattering rate 1/τ
    };

    let electrons = [];
    let ions = [];
    let shiftedSphere = null;

    function rebuild() {
      clearGroup(root);
      electrons = [];
      ions = [];

      // Left stage (-2.6, 0, 0): Real Space Drude-Sommerfeld conduction!
      const rx = -2.55;
      root.add(SM.createLabel("【实空间】电子漂移与声子/杂质碰撞散射", new THREE.Vector3(rx, 2.35, 0), { color: "#7dd3fc" }));
      root.add(SM.createParallelepiped(
        new THREE.Vector3(4.2, 0, 0), new THREE.Vector3(0, 2.8, 0), new THREE.Vector3(0, 0, 2.6),
        new THREE.Vector3(rx - 2.1, -1.4, -1.3), 0x475569, 0.05
      ));

      if (Math.abs(state.eField) > 0.05) {
        // Electric field E along -X so electrons (-e) drift toward +X!
        root.add(SM.createArrow(new THREE.Vector3(rx + 1.2, 1.75, 0), new THREE.Vector3(-Math.sign(state.eField), 0, 0), 1.6, 0xf87171));
        root.add(SM.createLabel("外电场 E", new THREE.Vector3(rx + 0.4, 2.02, 0), { color: "#fca5a5" }));
      }

      for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
          for (let iz = -1; iz <= 1; iz++) {
            const p = new THREE.Vector3(rx + ix * 1.25, iy * 0.9, iz * 0.85);
            const isImpurity = ix === 0 && iy === 0 && iz === 0;
            const ion = SM.createAtom(isImpurity ? 0.21 : 0.16, isImpurity ? 0xa855f7 : 0x38bdf8, { position: p, opacity: 0.72 });
            ion.userData.base = p.clone();
            root.add(ion);
            ions.push(ion);
          }
        }
      }

      for (let i = 0; i < 28; i++) {
        const em = SM.createAtom(0.085, 0xfbbf24, {
          position: new THREE.Vector3(rx + (Math.random() - 0.5) * 3.8, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.2),
          emissiveIntensity: 0.75
        });
        em.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5);
        root.add(em);
        electrons.push(em);
      }

      // Right stage (+2.75, 0, 0): k-Space Fermi Sphere rigid displacement δk = -eEτ/ħ!
      const kx = 2.75;
      root.add(SM.createLabel("【k 空间】费米球稳态刚性位移 δk = -eEτ/ħ", new THREE.Vector3(kx, 2.35, 0), { color: "#fde047" }));

      // Equilibrium Fermi sphere wireframe at center
      const eqWire = new THREE.Mesh(
        new THREE.SphereGeometry(1.45, 24, 18),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8, wireframe: true, transparent: true, opacity: 0.3 })
      );
      eqWire.position.set(kx, 0, 0);
      root.add(eqWire);

      // Displaced steady-state Fermi sphere!
      const tau = 1 / Math.max(0.12, state.scatterRate);
      const dkShift = Math.max(-0.85, Math.min(0.85, state.eField * tau * 0.18));
      shiftedSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.45, 32, 24),
        new THREE.MeshPhongMaterial({ color: 0x34d399, transparent: true, opacity: 0.36, depthWrite: false })
      );
      shiftedSphere.position.set(kx + dkShift, 0, 0);
      root.add(shiftedSphere);

      if (Math.abs(dkShift) > 0.04) {
        root.add(SM.createArrow(new THREE.Vector3(kx, 0, 0), new THREE.Vector3(Math.sign(dkShift), 0, 0), Math.abs(dkShift) + 0.25, 0xfbbf24));
        root.add(SM.createLabel("δk", new THREE.Vector3(kx + dkShift / 2, 0.35, 0), { color: "#fde047" }));
      }

      updateReadout();
    }

    function updateReadout() {
      const tau = 1 / Math.max(0.12, state.scatterRate);
      const sigma = tau * 2.2;
      const jCurr = sigma * state.eField;

      if (shiftedSphere) {
        const dkShift = Math.max(-0.85, Math.min(0.85, state.eField * tau * 0.18));
        shiftedSphere.position.x = 2.75 + dkShift;
      }

      ui.setLegend([
        { color: "#fbbf24", label: "导电自由电子 (-e)" },
        { color: "#a855f7", label: "晶格杂质散射中心 (剩余电阻 ρ₀)" },
        { color: "#94a3b8", label: "零场平衡费米球 (⟨k⟩ = 0)" },
        { color: "#34d399", label: "外场稳态偏移费米球 (净电流 J)" }
      ]);

      ui.setMetrics([
        { label: "平均弛豫时间 τ", value: tau.toFixed(2) + " × 10⁻¹⁴ s" },
        { label: "电导率 σ = ne²τ/m", value: sigma.toFixed(2) + " S₀" },
        { label: "费米球位移 δk / k_F", value: (state.eField * tau * 0.08).toFixed(3) },
        { label: "电流密度 J = σE", value: jCurr.toFixed(2) + " J₀" }
      ]);

      drawResistivityPlot();
    }

    function drawResistivityPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: 400, yMin: 0, yMax: 4.5,
        title: "马提森定则 (Matthiessen's Rule)：金属电阻率 ρ(T) = ρ₀(杂质) + ρ_L(T)(声子)",
        xLabel: "绝对温度 T (K)",
        yLabel: "电阻率 ρ (μΩ·cm)"
      });

      const rho0 = state.scatterRate * 1.6;
      const purePts = [], impPts = [];
      for (let T = 0; T <= 400; T += 10) {
        const phononTerm = T < 60 ? Math.pow(T / 60, 5) * 0.25 : 0.25 + (T - 60) * 0.0072;
        purePts.push([T, phononTerm]);
        impPts.push([T, rho0 + phononTerm]);
      }

      PH.drawCurve(ctx, map, purePts, { color: "#64748b", dash: [4, 3], width: 1.5 });
      PH.drawCurve(ctx, map, impPts, { color: "#38bdf8", fill: "rgba(56,189,248,0.14)", width: 2.4 });
      PH.drawPoint(ctx, map, 0, rho0, "#a855f7", 4.5, `剩余电阻 ρ₀=${rho0.toFixed(2)}`);
      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: "实际金属 ρ₀ + ρ_L(T)" },
        { color: "#64748b", label: "理想无杂质纯晶格极限" }
      ]);
    }

    ui.setControls([
      {
        type: "slider",
        label: "外加电场强度 E (验证欧姆定律 J = σE)",
        min: -2.0, max: 2.0, step: 0.1, value: state.eField,
        unit: " E₀",
        onChange: (v) => { state.eField = v; rebuild(); }
      },
      {
        type: "slider",
        label: "散射碰撞率 1/τ (温度声子 + 杂质浓度)",
        min: 0.15, max: 1.5, step: 0.05, value: state.scatterRate,
        unit: " τ₀⁻¹",
        onChange: (v) => { state.scatterRate = v; updateReadout(); }
      }
    ]);

    rebuild();

    return {
      update(dt, elapsed) {
        const rx = -2.55;
        // Vibrate ions slightly proportional to scatterRate
        ions.forEach((ion, i) => {
          const amp = state.scatterRate * 0.06;
          ion.position.x = ion.userData.base.x + Math.sin(elapsed * 9 + i) * amp;
          ion.position.y = ion.userData.base.y + Math.cos(elapsed * 8 + i * 2) * amp;
        });

        // Accelerate electrons along +X (opposite to -X E-field) and scatter with probability dt * scatterRate
        electrons.forEach((em) => {
          em.userData.vel.x += state.eField * 4.2 * dt;
          em.position.addScaledVector(em.userData.vel, dt);

          if (Math.random() < state.scatterRate * 3.2 * dt) {
            // Random isotropic thermal velocity reset upon collision!
            em.userData.vel.set(
              (Math.random() - 0.5) * 2.8,
              (Math.random() - 0.5) * 2.6,
              (Math.random() - 0.5) * 2.6
            );
          }

          // Periodic wrap inside [-2.1, +2.1] box centered at rx
          if (em.position.x > rx + 2.1) em.position.x = rx - 2.1;
          if (em.position.x < rx - 2.1) em.position.x = rx + 2.1;
          if (Math.abs(em.position.y) > 1.35) em.userData.vel.y *= -1;
          if (Math.abs(em.position.z) > 1.25) em.userData.vel.z *= -1;
        });
      },
      onResize: drawResistivityPlot
    };
  };

  // ============================================================================
  // 6.6 磁场中的电子运动：回旋共振与霍尔效应 (Hall Effect) 三维动态仿真
  // ============================================================================
  window.SimRegistry["6-6"] = function (simGroup, ui) {
    SM.setCameraView({ x: 3.2, y: 6.8, z: 8.5 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      carrierType: "electron", // 'electron' (-e, R_H < 0) | 'hole' (+e, R_H > 0)
      bField: 1.2,             // Magnetic field B_y (vertical in 3D scene = +Y!)
      currentI: 1.2,
      viewMode: "hall"         // 'hall' (Hall Bar) | 'cyclotron' (3D Helical Cyclotron Orbit)
    };

    let carriers = [];
    let cyclotronHelix = null;
    let cycParticle = null;

    function rebuild() {
      clearGroup(root);
      carriers = [];
      cyclotronHelix = null;
      cycParticle = null;

      if (state.viewMode === "hall") {
        const Lx = 6.8, Ly = 0.65, Lz = 3.2;
        // Translucent Hall semiconductor/metal slab
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(Lx, Ly, Lz),
          new THREE.MeshPhongMaterial({ color: 0x1e293b, transparent: true, opacity: 0.55 })
        );
        root.add(slab);
        root.add(SM.createParallelepiped(
          new THREE.Vector3(Lx, 0, 0), new THREE.Vector3(0, Ly, 0), new THREE.Vector3(0, 0, Lz),
          new THREE.Vector3(-Lx / 2, -Ly / 2, -Lz / 2), 0x60a5fa, 0
        ));

        // Conventional Current I_x arrow (+X)
        root.add(SM.createArrow(new THREE.Vector3(-Lx / 2 - 1.3, 0, 0), new THREE.Vector3(1, 0, 0), 1.15, 0xfbbf24));
        root.add(SM.createLabel("电流 I_x (+x)", new THREE.Vector3(-Lx / 2 - 0.8, 0.55, 0), { color: "#fde047" }));

        // Vertical Magnetic Field B arrows (along +Y/-Y)
        if (Math.abs(state.bField) > 0.05) {
          const bDir = new THREE.Vector3(0, Math.sign(state.bField), 0);
          [-2.0, 0, 2.0].forEach((bx) => {
            root.add(SM.createArrow(new THREE.Vector3(bx, -1.6 * Math.sign(state.bField), 0), bDir, 3.2, 0x818cf8, 0.28, 0.1));
          });
          root.add(SM.createLabel(`外磁场 B (${state.bField >= 0 ? "向上" : "向下"})`, new THREE.Vector3(2.2, 1.95, 0), { color: "#c7d2fe" }));
        }

        // Check Lorentz deflection direction!
        // Conventional I_x > 0 is along +X.
        // For holes (+e): v = (+v, 0, 0). With B = (0, B, 0): v × B = (v,0,0) × (0,B,0) = (0, 0, v*B) -> +Z (front edge)!
        // For electrons (-e): v = (-v, 0, 0). Force F = -e (v × B) = -e ((-v,0,0)×(0,B,0)) = (0, 0, +e*v*B) -> ALSO +Z (front edge)!!
        // Crucial physics insight: BOTH carriers deflect to the SAME side (+Z when I*B > 0), accumulating OPPOSITE sign charges!
        const deflectSign = Math.sign(state.bField * state.currentI);
        if (deflectSign !== 0) {
          const isElec = state.carrierType === "electron";
          const frontColor = isElec ? 0x38bdf8 : 0xf87171;
          const backColor = isElec ? 0xf87171 : 0x38bdf8;
          const frontSign = isElec ? "−" : "+";
          const backSign = isElec ? "+" : "−";
          const zFront = (Lz / 2 + 0.16) * deflectSign;
          const zBack = -zFront;

          for (let sx = -2.5; sx <= 2.5; sx += 1.0) {
            root.add(SM.createLabel(frontSign, new THREE.Vector3(sx, 0.25, zFront), {
              color: isElec ? "#7dd3fc" : "#fca5a5", fontSize: 28
            }));
            root.add(SM.createLabel(backSign, new THREE.Vector3(sx, 0.25, zBack), {
              color: isElec ? "#fca5a5" : "#7dd3fc", fontSize: 28
            }));
          }

          // Transverse Hall Electric Field E_H pointing from (+) side to (-) side!
          const eHallDirZ = isElec ? deflectSign : -deflectSign;
          root.add(SM.createArrow(
            new THREE.Vector3(0, 0.45, -eHallDirZ * 1.1),
            new THREE.Vector3(0, 0, eHallDirZ),
            2.2,
            0x34d399,
            0.28,
            0.1
          ));
          root.add(SM.createLabel("横向霍尔电场 E_H", new THREE.Vector3(0, 0.95, 0), { color: "#6ee7b7" }));
        }

        // Moving charge carriers inside Hall bar
        const isElec = state.carrierType === "electron";
        for (let i = 0; i < 26; i++) {
          const cm = SM.createAtom(0.11, isElec ? 0x38bdf8 : 0xfb7185, {
            position: new THREE.Vector3((Math.random() - 0.5) * Lx, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * (Lz - 0.5)),
            emissiveIntensity: 0.6
          });
          cm.userData.phase = Math.random();
          root.add(cm);
          carriers.push(cm);
        }
      } else {
        // 3D Helical Cyclotron Resonance Orbit ω_c = |q|B / m*
        const bMag = Math.max(0.3, Math.abs(state.bField));
        const rCyc = 1.8 / bMag;
        root.add(SM.createArrow(new THREE.Vector3(0, -2.5, 0), new THREE.Vector3(0, 1, 0), 5.0, 0x818cf8, 0.3, 0.11));
        root.add(SM.createLabel("磁场 B 轴 (ω_c = eB/m*)", new THREE.Vector3(0, 2.85, 0), { color: "#c7d2fe" }));

        const pts = [];
        const turns = 4.5;
        const chirality = (state.carrierType === "electron" ? 1 : -1) * (state.bField >= 0 ? 1 : -1);
        for (let i = 0; i <= 240; i++) {
          const t = i / 240;
          const ang = chirality * t * turns * Math.PI * 2;
          pts.push(new THREE.Vector3(rCyc * Math.cos(ang), -2.2 + t * 4.4, rCyc * Math.sin(ang)));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 200, 0.035, 8, false);
        cyclotronHelix = new THREE.Mesh(tubeGeo, new THREE.MeshStandardMaterial({
          color: state.carrierType === "electron" ? 0x38bdf8 : 0xfb7185,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.25
        }));
        root.add(cyclotronHelix);

        cycParticle = SM.createAtom(0.18, 0xfbbf24, { emissiveIntensity: 0.8 });
        cycParticle.userData = { rCyc, chirality };
        root.add(cycParticle);
      }

      updateReadout();
    }

    function updateReadout() {
      const signRH = state.carrierType === "electron" ? -1 : +1;
      const vHall = signRH * state.currentI * state.bField * 2.4; // mV
      const omegaC = Math.abs(state.bField) * 176; // GHz at 1T

      ui.setLegend([
        { color: "#38bdf8", label: "电子载流子 (-e, 逆电流方向漂移)" },
        { color: "#fb7185", label: "空穴载流子 (+e, 顺电流方向漂移)" },
        { color: "#818cf8", label: "外加垂直磁感应强度 B" },
        { color: "#34d399", label: "平衡洛伦兹力的横向霍尔电场 E_H" }
      ]);

      ui.setMetrics([
        { label: "主导载流子类型", value: state.carrierType === "electron" ? "电子 (n型, q=-e)" : "空穴 (p型, q=+e)" },
        { label: "霍尔系数 R_H 符号", value: signRH < 0 ? "R_H < 0 (-1/ne)" : "R_H > 0 (+1/pe)" },
        { label: "稳态霍尔电压 V_H", value: (vHall >= 0 ? "+" : "") + vHall.toFixed(2) + " mV" },
        { label: "回旋共振角频率 ω_c", value: omegaC.toFixed(0) + " rad/ns" }
      ]);

      drawHallPlot();
    }

    function drawHallPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: -2.0, xMax: 2.0, yMin: -6.5, yMax: 6.5,
        title: "霍尔电压 V_H(B) 线性曲线 — 斜率正负直接判别 n 型与 p 型导电!",
        xLabel: "磁感应强度 B (T)",
        yLabel: "霍尔电压 V_H (mV)"
      });

      const nLine = [[-2, 2 * state.currentI * 2.4], [2, -2 * state.currentI * 2.4]];
      const pLine = [[-2, -2 * state.currentI * 2.4], [2, 2 * state.currentI * 2.4]];

      PH.drawCurve(ctx, map, nLine, { color: "#38bdf8", width: state.carrierType === "electron" ? 2.6 : 1.3, dash: state.carrierType === "electron" ? null : [4, 3] });
      PH.drawCurve(ctx, map, pLine, { color: "#fb7185", width: state.carrierType === "hole" ? 2.6 : 1.3, dash: state.carrierType === "hole" ? null : [4, 3] });

      const signRH = state.carrierType === "electron" ? -1 : +1;
      const curV = signRH * state.currentI * state.bField * 2.4;
      PH.drawPoint(ctx, map, state.bField, curV, "#fbbf24", 5, `V_H=${curV.toFixed(1)}mV`);
      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: "n型电子导电 (R_H < 0)" },
        { color: "#fb7185", label: "p型空穴导电 (R_H > 0)" }
      ]);
    }

    ui.setControls([
      {
        type: "pills",
        label: "三维实验模式",
        value: state.viewMode,
        options: [
          { label: "霍尔效应动态平衡", value: "hall" },
          { label: "三维螺旋回旋共振轨道", value: "cyclotron" }
        ],
        onChange: (v) => { state.viewMode = v; rebuild(); }
      },
      {
        type: "pills",
        label: "切换载流子电性 (观察霍尔电场反转!)",
        value: state.carrierType,
        options: [
          { label: "电子导电 (n型, R_H < 0)", value: "electron" },
          { label: "空穴导电 (p型, R_H > 0)", value: "hole" }
        ],
        onChange: (v) => { state.carrierType = v; rebuild(); }
      },
      {
        type: "slider",
        label: "垂直磁场强度 B",
        min: -2.0, max: 2.0, step: 0.1, value: state.bField,
        unit: " T",
        onChange: (v) => { state.bField = v; rebuild(); }
      },
      {
        type: "slider",
        label: "纵向驱动电流 I_x",
        min: 0.2, max: 2.0, step: 0.1, value: state.currentI,
        unit: " I₀",
        onChange: (v) => { state.currentI = v; rebuild(); }
      }
    ]);

    rebuild();

    return {
      update(dt, elapsed) {
        if (state.viewMode === "hall") {
          const isElec = state.carrierType === "electron";
          const vx = (isElec ? -1 : 1) * state.currentI * 1.85;
          carriers.forEach((c, idx) => {
            c.position.x += vx * dt;
            // Subtle transient curvature at entry before steady Hall balance
            const deflectSign = Math.sign(state.bField * state.currentI);
            c.position.z += Math.sin(elapsed * 3 + idx) * 0.08 * dt * deflectSign;
            if (c.position.x > 3.35) c.position.x = -3.35;
            if (c.position.x < -3.35) c.position.x = 3.35;
          });
        } else if (cycParticle) {
          const { rCyc, chirality } = cycParticle.userData;
          const t = (elapsed * 0.22) % 1.0;
          const ang = chirality * t * 4.5 * Math.PI * 2;
          cycParticle.position.set(rCyc * Math.cos(ang), -2.2 + t * 4.4, rCyc * Math.sin(ang));
        }
      },
      onResize: drawHallPlot
    };
  };
})();
