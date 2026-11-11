/**
 * 第 3 章：晶体结合与弹性常量 (Chapter 3: Crystal Binding & Elastic Constants)
 * 覆盖大纲：3.1 惰性气体晶体 | 3.2 离子晶体马德隆常数 | 3.3 共价晶体与轨道杂化 | 3.4 金属键与氢键 | 3.5-3.6 离子半径比与弹性常量
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
  // 3.1 惰性气体晶体：范德瓦尔斯键与 Lennard-Jones 6-12 势能曲线
  // ============================================================================
  window.SimRegistry["3-1"] = function (simGroup, ui) {
    SM.setCameraView({ x: 0, y: 2.6, z: 7.4 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      rRatio: 1.12, // r / σ, equilibrium at 2^(1/6) ≈ 1.122
      gas: "Ar"     // Ne, Ar, Kr, Xe
    };

    const GAS_INFO = {
      Ne: { sigma: 2.74, epsMeV: 3.1, color: 0xf472b6, name: "氖 (Ne)" },
      Ar: { sigma: 3.40, epsMeV: 10.4, color: 0x38bdf8, name: "氩 (Ar)" },
      Kr: { sigma: 3.65, epsMeV: 14.0, color: 0x34d399, name: "氪 (Kr)" },
      Xe: { sigma: 3.98, epsMeV: 20.0, color: 0xa78bfa, name: "氙 (Xe)" }
    };

    let cloud1 = null, cloud2 = null, spring = null;
    let nuc1 = null, nuc2 = null, forceGroup = null;

    function calcLJ(x) {
      const inv6 = Math.pow(1 / x, 6);
      const rep = 4 * inv6 * inv6;
      const att = -4 * inv6;
      const tot = rep + att;
      // Force F = -dU/dr = 4 * (12 / r^13 - 6 / r^7)
      const force = 4 * (12 * Math.pow(1 / x, 13) - 6 * Math.pow(1 / x, 7));
      return { rep, att, tot, force };
    }

    function rebuild() {
      clearGroup(root);
      const info = GAS_INFO[state.gas];
      const halfD = state.rRatio * 1.45;

      nuc1 = SM.createAtom(0.22, 0xf8fafc, { position: new THREE.Vector3(-halfD, 0, 0) });
      nuc2 = SM.createAtom(0.22, 0xf8fafc, { position: new THREE.Vector3(halfD, 0, 0) });

      cloud1 = SM.createAtom(0.82, info.color, { position: new THREE.Vector3(-halfD, 0, 0), opacity: 0.34, transparent: true });
      cloud2 = SM.createAtom(0.82, info.color, { position: new THREE.Vector3(halfD, 0, 0), opacity: 0.34, transparent: true });

      spring = SM.createSpringLine(10, 0.14, 0x94a3b8);
      spring.userData.updateEnds(nuc1.position, nuc2.position);

      forceGroup = new THREE.Group();
      const lj = calcLJ(state.rRatio);
      const fMag = Math.min(1.6, Math.abs(lj.force) * 0.18);
      if (fMag > 0.04) {
        if (lj.force > 0) {
          // Repulsive: pushing outward!
          forceGroup.add(SM.createArrow(new THREE.Vector3(-halfD - 0.3, 0.95, 0), new THREE.Vector3(-1, 0, 0), fMag, 0xf87171));
          forceGroup.add(SM.createArrow(new THREE.Vector3(halfD + 0.3, 0.95, 0), new THREE.Vector3(1, 0, 0), fMag, 0xf87171));
          forceGroup.add(SM.createLabel("泡利排斥力 (+r⁻¹²)", new THREE.Vector3(0, 1.35, 0), { color: "#fca5a5" }));
        } else {
          // Attractive: pulling inward!
          forceGroup.add(SM.createArrow(new THREE.Vector3(-halfD - 0.1, 0.95, 0), new THREE.Vector3(1, 0, 0), fMag, 0x34d399));
          forceGroup.add(SM.createArrow(new THREE.Vector3(halfD + 0.1, 0.95, 0), new THREE.Vector3(-1, 0, 0), fMag, 0x34d399));
          forceGroup.add(SM.createLabel("范德瓦尔斯吸引力 (-r⁻⁶)", new THREE.Vector3(0, 1.35, 0), { color: "#6ee7b7" }));
        }
      } else {
        forceGroup.add(SM.createLabel("平衡间距 r₀ = 1.122σ (合力 = 0, 势能最低!)", new THREE.Vector3(0, 1.35, 0), { color: "#fde047" }));
      }

      root.add(nuc1, nuc2, cloud1, cloud2, spring, forceGroup);

      ui.setLegend([
        { color: "#f8fafc", label: "满壳层正原子实 (+Ze)" },
        { color: "#38bdf8", label: "量子零点涨落瞬时极化电子云" },
        { color: "#34d399", label: "London 色散吸引力 (-4ε(σ/r)⁶)" },
        { color: "#f87171", label: "短程泡利排斥力 (+4ε(σ/r)¹²)" }
      ]);

      ui.setMetrics([
        { label: "惰性气体元素", value: `${info.name} (σ=${info.sigma}Å)` },
        { label: "实际间距 r", value: (state.rRatio * info.sigma).toFixed(2) + " Å" },
        { label: "相对势能 U / ε", value: lj.tot.toFixed(3) },
        { label: "结合势能 U", value: (lj.tot * info.epsMeV).toFixed(2) + " meV" }
      ]);

      drawPlot(lj);
    }

    function drawPlot(curLJ) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0.88, xMax: 2.3, yMin: -1.35, yMax: 1.8,
        title: "Lennard-Jones 6-12 相互作用势能曲线 U(r)/ε",
        xLabel: "归一化核间距 r / σ",
        yLabel: "U / ε"
      });

      const totPts = [], attPts = [], repPts = [];
      for (let x = 0.88; x <= 2.3; x += 0.015) {
        const v = calcLJ(x);
        if (v.rep <= 3.0) repPts.push([x, v.rep]);
        attPts.push([x, v.att]);
        if (v.tot <= 2.5) totPts.push([x, v.tot]);
      }

      PH.drawCurve(ctx, map, repPts, { color: "#f87171", dash: [4, 3], width: 1.4 });
      PH.drawCurve(ctx, map, attPts, { color: "#34d399", dash: [4, 3], width: 1.4 });
      PH.drawCurve(ctx, map, totPts, { color: "#38bdf8", width: 2.4 });
      PH.drawPoint(ctx, map, state.rRatio, Math.min(1.75, curLJ.tot), "#fbbf24", 5, `r=${state.rRatio.toFixed(2)}σ`);
      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: "总势能 U(r)" },
        { color: "#f87171", label: "排斥 +r⁻¹²" },
        { color: "#34d399", label: "吸引 -r⁻⁶" }
      ]);
    }

    function syncControls() {
      ui.setControls([
        {
          type: "pills",
          label: "惰性气体晶体种类",
          value: state.gas,
          options: [
            { label: "Ne (氖)", value: "Ne" },
            { label: "Ar (氩)", value: "Ar" },
            { label: "Kr (氪)", value: "Kr" },
            { label: "Xe (氙)", value: "Xe" }
          ],
          onChange: (v) => { state.gas = v; rebuild(); }
        },
        {
          type: "slider",
          label: "归一化原子间距 r / σ",
          min: 0.92, max: 2.10, step: 0.01, value: state.rRatio,
          unit: " σ",
          onChange: (v) => { state.rRatio = v; rebuild(); }
        },
        {
          type: "pills",
          label: "特征位置快速定位",
          value: "",
          options: [
            { label: "短程排斥区 (0.97σ)", value: "0.97" },
            { label: "平衡间距 r₀ (1.12σ)", value: "1.12" },
            { label: "范德瓦尔斯吸引区 (1.45σ)", value: "1.45" }
          ],
          onChange: (v) => {
            state.rRatio = parseFloat(v);
            syncControls();
            rebuild();
          }
        }
      ]);
    }

    syncControls();
    rebuild();

    return {
      update(dt, elapsed) {
        if (cloud1 && cloud2 && nuc1 && nuc2) {
          // Correlated instantaneous dipole-induced dipole sloshing!
          const shift = Math.sin(elapsed * 5.2) * (0.14 / Math.pow(state.rRatio, 2));
          cloud1.position.x = nuc1.position.x + shift;
          cloud2.position.x = nuc2.position.x + shift;
          cloud1.scale.set(1 + Math.abs(shift) * 0.45, 1 - Math.abs(shift) * 0.2, 1 - Math.abs(shift) * 0.2);
          cloud2.scale.copy(cloud1.scale);
        }
      },
      onResize: () => rebuild()
    };
  };

  // ============================================================================
  // 3.2 离子晶体：库仑相互作用与马德隆常数 (Madelung) 3D 收敛仿真
  // ============================================================================
  window.SimRegistry["3-2"] = function (simGroup, ui) {
    SM.setCameraView({ x: 6.4, y: 5.0, z: 7.4 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      method: "evjen", // 'evjen' (Neutral Cubes) | 'spherical' (Direct Spherical Shells)
      maxShell: 2      // 1..3 for 3D visual, plots up to 8 shells!
    };

    // Compute Evjen Neutral Cube sums for NaCl up to cube half-width M
    function computeEvjenSeries(maxM) {
      const vals = [];
      for (let M = 1; M <= maxM; M++) {
        let sum = 0;
        for (let i = -M; i <= M; i++) {
          for (let j = -M; j <= M; j++) {
            for (let k = -M; k <= M; k++) {
              if (i === 0 && j === 0 && k === 0) continue;
              let boundaryCount = 0;
              if (Math.abs(i) === M) boundaryCount++;
              if (Math.abs(j) === M) boundaryCount++;
              if (Math.abs(k) === M) boundaryCount++;
              const weight = Math.pow(0.5, boundaryCount);
              const sign = (Math.abs(i + j + k) % 2 === 1) ? 1 : -1;
              const dist = Math.sqrt(i * i + j * j + k * k);
              sum += (sign * weight) / dist;
            }
          }
        }
        vals.push(sum);
      }
      return vals;
    }

    // Compute Naive Spherical Shell sums for NaCl sorted by n² = i²+j²+k²
    function computeSphericalSeries(maxShells) {
      const shellsMap = new Map();
      const lim = 5;
      for (let i = -lim; i <= lim; i++) {
        for (let j = -lim; j <= lim; j++) {
          for (let k = -lim; k <= lim; k++) {
            if (i === 0 && j === 0 && k === 0) continue;
            const d2 = i * i + j * j + k * k;
            if (d2 > 18) continue;
            const sign = (Math.abs(i + j + k) % 2 === 1) ? 1 : -1;
            shellsMap.set(d2, (shellsMap.get(d2) || 0) + sign / Math.sqrt(d2));
          }
        }
      }
      const sortedD2 = Array.from(shellsMap.keys()).sort((a, b) => a - b).slice(0, maxShells);
      const vals = [];
      let running = 0;
      sortedD2.forEach((d2) => {
        running += shellsMap.get(d2);
        vals.push(running);
      });
      return { vals, sortedD2 };
    }

    function rebuild() {
      clearGroup(root);
      const sp = 1.15;
      const M = Math.min(3, state.maxShell);

      if (state.method === "evjen") {
        // Draw Evjen cube [-M, M]^3
        const L = 2 * M * sp;
        root.add(SM.createParallelepiped(
          new THREE.Vector3(L, 0, 0),
          new THREE.Vector3(0, L, 0),
          new THREE.Vector3(0, 0, L),
          new THREE.Vector3(-M * sp, -M * sp, -M * sp),
          0x38bdf8,
          0.05
        ));

        for (let i = -M; i <= M; i++) {
          for (let j = -M; j <= M; j++) {
            for (let k = -M; k <= M; k++) {
              // Keep interior sparse for M=3 so performance stays silky smooth
              if (M === 3 && Math.abs(i) < 3 && Math.abs(j) < 3 && Math.abs(k) < 3 && !(i === 0 && j === 0 && k === 0)) {
                if ((i + j + k) % 2 === 0) continue;
              }
              const pos = new THREE.Vector3(i * sp, j * sp, k * sp);
              if (i === 0 && j === 0 && k === 0) {
                root.add(SM.createAtom(0.26, 0xfbbf24, { position: pos, emissiveIntensity: 0.55 }));
                continue;
              }
              let bCnt = 0;
              if (Math.abs(i) === M) bCnt++;
              if (Math.abs(j) === M) bCnt++;
              if (Math.abs(k) === M) bCnt++;
              const weight = Math.pow(0.5, bCnt);
              const isOpposite = Math.abs(i + j + k) % 2 === 1;
              const col = isOpposite ? 0x34d399 : 0xf87171;
              root.add(SM.createAtom(0.11 + 0.1 * weight, col, { position: pos, opacity: 0.45 + 0.55 * weight }));
            }
          }
        }
      } else {
        // Spherical shells
        const { sortedD2 } = computeSphericalSeries(8);
        const maxD2 = sortedD2[Math.min(sortedD2.length - 1, state.maxShell - 1)];
        const sphR = Math.sqrt(maxD2) * sp;
        const sph = new THREE.Mesh(
          new THREE.SphereGeometry(sphR, 28, 22),
          new THREE.MeshPhongMaterial({ color: 0xf472b6, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
        );
        root.add(sph);

        for (let i = -3; i <= 3; i++) {
          for (let j = -3; j <= 3; j++) {
            for (let k = -3; k <= 3; k++) {
              const d2 = i * i + j * j + k * k;
              if (d2 > maxD2) continue;
              const pos = new THREE.Vector3(i * sp, j * sp, k * sp);
              if (d2 === 0) {
                root.add(SM.createAtom(0.26, 0xfbbf24, { position: pos, emissiveIntensity: 0.55 }));
              } else {
                const isOpposite = Math.abs(i + j + k) % 2 === 1;
                const onOuter = d2 === maxD2;
                root.add(SM.createAtom(onOuter ? 0.21 : 0.14, isOpposite ? 0x34d399 : 0xf87171, { position: pos }));
              }
            }
          }
        }
      }

      const evjenVals = computeEvjenSeries(6);
      const sphVals = computeSphericalSeries(8).vals;
      const curVal = state.method === "evjen"
        ? evjenVals[Math.min(evjenVals.length - 1, state.maxShell - 1)]
        : sphVals[Math.min(sphVals.length - 1, state.maxShell - 1)];

      ui.setLegend([
        { color: "#fbbf24", label: "中心参考阳离子 Na⁺ (原点)" },
        { color: "#34d399", label: "异号吸引离子 Cl⁻ (+1/p_ij)" },
        { color: "#f87171", label: "同号排斥离子 Na⁺ (-1/p_ij)" }
      ]);

      ui.setMetrics([
        { label: "求和截断阶数 N", value: "第 " + state.maxShell + " 阶壳层" },
        { label: "当前部分和 α_N", value: curVal.toFixed(5) },
        { label: "NaCl 精确马德隆常数", value: "1.74756" },
        { label: "相对截断误差", value: (Math.abs(curVal - 1.74756) / 1.74756 * 100).toFixed(2) + "%" }
      ]);

      drawPlot(evjenVals, sphVals);
    }

    function drawPlot(evjenVals, sphVals) {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 1, xMax: 6, yMin: -0.6, yMax: 3.6,
        title: "马德隆常数收敛对比：Evjen 电中性晶胞 vs 直接球壳振荡",
        xLabel: "壳层阶数 N",
        yLabel: "马德隆和 α_N"
      });

      // Exact value line 1.74756
      PH.drawCurve(ctx, map, [[1, 1.74756], [6, 1.74756]], { color: "#fbbf24", dash: [5, 3], width: 1.5 });

      const sphPts = sphVals.slice(0, 6).map((v, idx) => [idx + 1, v]);
      const evjPts = evjenVals.slice(0, 6).map((v, idx) => [idx + 1, v]);

      PH.drawCurve(ctx, map, sphPts, { color: "#f472b6", width: 1.8 });
      PH.drawCurve(ctx, map, evjPts, { color: "#38bdf8", width: 2.4 });

      const idx = Math.min(5, state.maxShell - 1);
      const activeY = state.method === "evjen" ? evjenVals[idx] : sphVals[idx];
      PH.drawPoint(ctx, map, idx + 1, activeY, "#34d399", 5, activeY.toFixed(4));

      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: "Evjen 中性立方体 (快收敛)" },
        { color: "#f472b6", label: "直接球壳求和 (剧烈振荡)" },
        { color: "#fbbf24", label: "精确极限 1.7476" }
      ]);
    }

    ui.setControls([
      {
        type: "pills",
        label: "长程库仑级数求和策略",
        value: state.method,
        options: [
          { label: "Evjen 电中性立方壳层", value: "evjen" },
          { label: "直接等距球壳求和", value: "spherical" }
        ],
        onChange: (v) => { state.method = v; rebuild(); }
      },
      {
        type: "slider",
        label: "外扩壳层阶数 N",
        min: 1, max: 6, step: 1, value: state.maxShell,
        unit: " 阶",
        onChange: (v) => { state.maxShell = v; rebuild(); }
      }
    ]);

    rebuild();
    return { onResize: () => rebuild() };
  };

  // ============================================================================
  // 3.3 共价晶体与原子轨道杂化理论 (sp, sp², sp³ 杂化三维等值面变形)
  // ============================================================================
  function buildOrbitalMesh(evalWavefn, scale = 2.3) {
    // Build polar surface r(θ, φ) = |ψ(θ, φ)| colored by sign of ψ!
    const nTheta = 34;
    const nPhi = 48;
    const pos = [];
    const col = [];
    const cPos = new THREE.Color(0x38bdf8); // + phase lobe
    const cNeg = new THREE.Color(0xfb7185); // - phase back lobe

    function sample(it, ip) {
      const theta = (it / nTheta) * Math.PI;
      const phi = (ip / nPhi) * Math.PI * 2;
      const psi = evalWavefn(theta, phi);
      const r = Math.pow(Math.abs(psi), 1.15) * scale;
      const st = Math.sin(theta);
      return {
        v: new THREE.Vector3(r * st * Math.cos(phi), r * Math.cos(theta), r * st * Math.sin(phi)),
        c: psi >= 0 ? cPos : cNeg
      };
    }

    for (let it = 0; it < nTheta; it++) {
      for (let ip = 0; ip < nPhi; ip++) {
        const p00 = sample(it, ip);
        const p10 = sample(it + 1, ip);
        const p11 = sample(it + 1, ip + 1);
        const p01 = sample(it, ip + 1);

        [p00, p10, p11, p00, p11, p01].forEach((pt) => {
          pos.push(pt.v.x, pt.v.y, pt.v.z);
          col.push(pt.c.r, pt.c.g, pt.c.b);
        });
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      shininess: 65,
      side: THREE.DoubleSide
    });
    return new THREE.Mesh(geo, mat);
  }

  window.SimRegistry["3-3"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.5, y: 4.2, z: 6.2 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      hybrid: "sp3", // 'sp' | 'sp2' | 'sp3'
      mixProgress: 1.0, // 0 = pure unhybridized 2s/2p, 1 = full hybridized orbitals!
      showNeighbors: true
    };

    function rebuild() {
      clearGroup(root);
      root.add(SM.createAtom(0.18, 0xfbbf24, { position: new THREE.Vector3(0, 0, 0) }));

      const t = state.mixProgress;
      // Normalized real basis functions (omitting common 1/sqrt(4π))
      const sFn = () => 0.55;
      const pxFn = (th, ph) => 0.95 * Math.sin(th) * Math.cos(ph);
      const pyFn = (th, ph) => 0.95 * Math.cos(th); // map Three.js Y as Z-axis for planar clarity!
      const pzFn = (th, ph) => 0.95 * Math.sin(th) * Math.sin(ph);

      let bondDirs = [];

      if (state.hybrid === "sp") {
        // 2 linear lobes along ±X
        const fn1 = (th, ph) => (1 - t) * sFn() + t * (0.707 * sFn() + 0.707 * pxFn(th, ph));
        const fn2 = (th, ph) => (1 - t) * pxFn(th, ph) + t * (0.707 * sFn() - 0.707 * pxFn(th, ph));
        root.add(buildOrbitalMesh(fn1, 2.35));
        root.add(buildOrbitalMesh(fn2, 2.35));
        bondDirs = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0)];
      } else if (state.hybrid === "sp2") {
        // 3 trigonal planar lobes in XZ plane (120°) + unhybridized vertical p_y (π orbital)!
        const dirs = [
          [1, 0],
          [-0.5, Math.sqrt(3) / 2],
          [-0.5, -Math.sqrt(3) / 2]
        ];
        const pureFns = [sFn, pxFn, pzFn];
        dirs.forEach(([dx, dz], idx) => {
          const hyb = (th, ph) => (1 / Math.sqrt(3)) * sFn() + Math.sqrt(2 / 3) * (dx * pxFn(th, ph) + dz * pzFn(th, ph));
          const blend = (th, ph) => (1 - t) * pureFns[idx](th, ph) + t * hyb(th, ph);
          root.add(buildOrbitalMesh(blend, 2.25));
          bondDirs.push(new THREE.Vector3(dx, 0, dz));
        });
        // Unhybridized p_z (vertical Y in 3D scene) π orbital in purple!
        const piMesh = buildOrbitalMesh((th, ph) => 0.78 * pyFn(th, ph), 2.1);
        piMesh.material.opacity = 0.35;
        root.add(piMesh);
        root.add(SM.createLabel("未杂化 p_z (离域 π 键)", new THREE.Vector3(0, 2.15, 0), { color: "#c4b5fd" }));
      } else {
        // sp3: 4 tetrahedral directions!
        const tetDirs = [
          new THREE.Vector3(1, 1, 1).normalize(),
          new THREE.Vector3(1, -1, -1).normalize(),
          new THREE.Vector3(-1, 1, -1).normalize(),
          new THREE.Vector3(-1, -1, 1).normalize()
        ];
        const pureFns = [sFn, pxFn, pyFn, pzFn];
        tetDirs.forEach((d, idx) => {
          const hyb = (th, ph) => 0.5 * sFn() + (Math.sqrt(3) / 2) * (d.x * pxFn(th, ph) + d.y * pyFn(th, ph) + d.z * pzFn(th, ph));
          const blend = (th, ph) => (1 - t) * pureFns[idx](th, ph) + t * hyb(th, ph);
          root.add(buildOrbitalMesh(blend, 2.25));
          bondDirs.push(d);
        });
      }

      if (state.showNeighbors && t > 0.55) {
        bondDirs.forEach((d) => {
          const np = d.clone().multiplyScalar(2.45);
          root.add(SM.createAtom(0.24, 0x34d399, { position: np }));
          root.add(SM.createBond(new THREE.Vector3(0, 0, 0), np, 0.035, 0xe2e8f0, 0.6));
        });
      }

      const angleText = state.hybrid === "sp" ? "180.0° (直线型)" : state.hybrid === "sp2" ? "120.0° (平面正三角)" : "109.47° (正四面体)";
      const matEx = state.hybrid === "sp" ? "卡宾碳链 / C₂H₂" : state.hybrid === "sp2" ? "石墨 / 石墨烯 / BN" : "金刚石 / 单晶 Si / Ge";

      ui.setLegend([
        { color: "#38bdf8", label: "杂化轨道成键大瓣 (ψ > 0, 强交叠)" },
        { color: "#fb7185", label: "杂化轨道背向小瓣 (ψ < 0)" },
        { color: "#34d399", label: "最近邻共价配位原子" }
      ]);

      ui.setMetrics([
        { label: "轨道杂化类型", value: state.hybrid.replace("2", "²").replace("3", "³") },
        { label: "成键键角 θ", value: angleText.split(" ")[0] },
        { label: "s 轨道成分占比", value: state.hybrid === "sp" ? "50.0%" : state.hybrid === "sp2" ? "33.3%" : "25.0%" },
        { label: "代表性共价固体", value: matEx }
      ]);

      drawHybridPlot();
    }

    function drawHybridPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: -180, xMax: 180, yMin: 0, yMax: 2.2,
        title: "杂化轨道角向电子云强度 |ψ(θ)|² — 成键方向性增强效应",
        xLabel: "相对成键轴夹角 θ (°)",
        yLabel: "角向概率密度"
      });

      const sCoeff = state.hybrid === "sp" ? Math.sqrt(0.5) : state.hybrid === "sp2" ? Math.sqrt(1 / 3) : 0.5;
      const pCoeff = Math.sqrt(1 - sCoeff * sCoeff);
      const t = state.mixProgress;

      const pureP = [], hybCurve = [];
      for (let deg = -180; deg <= 180; deg += 2) {
        const rad = (deg * Math.PI) / 180;
        const pVal = Math.sqrt(3) * 0.55 * Math.cos(rad);
        pureP.push([deg, pVal * pVal]);
        const psi = (1 - t) * pVal + t * (0.55 * sCoeff + Math.sqrt(3) * 0.55 * pCoeff * Math.cos(rad));
        hybCurve.push([deg, psi * psi]);
      }

      PH.drawCurve(ctx, map, pureP, { color: "#94a3b8", dash: [4, 3], width: 1.5 });
      PH.drawCurve(ctx, map, hybCurve, { color: "#38bdf8", fill: "rgba(56,189,248,0.18)", width: 2.3 });
      PH.drawLegend(ctx, map, [
        { color: "#38bdf8", label: `杂化态 |ψ|² (进度 ${(t * 100).toFixed(0)}%)` },
        { color: "#94a3b8", label: "未杂化纯 p 轨道" }
      ]);
    }

    ui.setControls([
      {
        type: "pills",
        label: "选择杂化轨道构型",
        value: state.hybrid,
        options: [
          { label: "sp (180° 直线)", value: "sp" },
          { label: "sp² (120° 石墨烯)", value: "sp2" },
          { label: "sp³ (109.5° 金刚石)", value: "sp3" }
        ],
        onChange: (v) => { state.hybrid = v; rebuild(); }
      },
      {
        type: "slider",
        label: "轨道杂化混合进度 (0=纯s/p → 1=完全杂化)",
        min: 0, max: 1, step: 0.02, value: state.mixProgress,
        unit: "",
        onChange: (v) => { state.mixProgress = v; rebuild(); }
      },
      {
        type: "checkbox",
        label: "显示配位共价成键近邻原子",
        value: state.showNeighbors,
        onChange: (v) => { state.showNeighbors = v; rebuild(); }
      }
    ]);

    rebuild();
    return { onResize: drawHybridPlot };
  };

  // ============================================================================
  // 3.4 金属键与氢键晶体 (延展性滑移 vs 离子脆断 | 六角冰 Ih 四面体氢键网络)
  // ============================================================================
  window.SimRegistry["3-4"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.5, z: 7.0 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      mode: "metallic", // 'metallic' | 'ionic_slip' | 'ice_hbond'
      slipShift: 0.0    // 0 .. 1.0 lattice spacing
    };

    let electronParticles = [];

    function rebuild() {
      clearGroup(root);
      electronParticles = [];

      if (state.mode === "metallic" || state.mode === "ionic_slip") {
        const isMetal = state.mode === "metallic";
        const sp = 1.25;
        // Cleavage separation when ionic crystal slips near 0.5 period!
        const cleaveLift = (!isMetal && state.slipShift > 0.25) ? Math.sin(Math.min(1, (state.slipShift - 0.25) / 0.5) * Math.PI / 2) * 0.85 : 0;

        for (let iy = -1; iy <= 1; iy++) {
          const isTop = iy >= 1;
          const dx = isTop ? state.slipShift * sp : 0;
          const dy = iy * sp + (isTop ? cleaveLift : 0);

          for (let ix = -2; ix <= 2; ix++) {
            for (let iz = -1; iz <= 1; iz++) {
              const p = new THREE.Vector3(ix * sp + dx, dy, iz * sp);
              if (isMetal) {
                root.add(SM.createAtom(0.28, 0x38bdf8, { position: p }));
              } else {
                const posCharge = Math.abs(ix + iy + iz) % 2 === 0;
                root.add(SM.createAtom(posCharge ? 0.21 : 0.28, posCharge ? 0xa78bfa : 0x34d399, { position: p }));
              }
            }
          }
        }

        if (isMetal) {
          // Delocalized electron sea glowing box + free electrons
          const sea = new THREE.Mesh(
            new THREE.BoxGeometry(6.2, 3.6, 3.6),
            new THREE.MeshPhongMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.14, depthWrite: false })
          );
          root.add(sea);
          for (let e = 0; e < 45; e++) {
            const em = SM.createAtom(0.065, 0xfde047, {
              position: new THREE.Vector3((Math.random() - 0.5) * 5.4, (Math.random() - 0.5) * 3.0, (Math.random() - 0.5) * 2.8),
              emissiveIntensity: 0.7
            });
            em.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.8);
            root.add(em);
            electronParticles.push(em);
          }
          if (state.slipShift > 0.05) {
            root.add(SM.createArrow(new THREE.Vector3(-2.6, sp + 0.55, 0), new THREE.Vector3(1, 0, 0), 1.4, 0xfbbf24));
            root.add(SM.createLabel("切应力滑移：电子海持续屏蔽粘合 → 塑性延展!", new THREE.Vector3(0, 2.25, 0), { color: "#6ee7b7" }));
          }
        } else if (cleaveLift > 0.1) {
          root.add(SM.createLabel("滑移半周期：同号离子正对相斥 → 解理脆断!", new THREE.Vector3(0, 2.55, 0), { color: "#fca5a5" }));
        }

        ui.setLegend(isMetal ? [
          { color: "#38bdf8", label: "金属正离子实阵列" },
          { color: "#fde047", label: "共有化巡游自由电子海 (非定域)" }
        ] : [
          { color: "#a78bfa", label: "阳离子 (+q)" },
          { color: "#34d399", label: "阴离子 (-q)" }
        ]);
        ui.setMetrics([
          { label: "晶体结合类型", value: isMetal ? "金属键 (无方向性)" : "离子键 (静电锁定)" },
          { label: "晶面滑移量 Δx / a", value: state.slipShift.toFixed(2) },
          { label: "力学变形响应", value: isMetal ? "良好延展性 (不断键)" : (cleaveLift > 0.1 ? "同号相斥解理断裂!" : "弹性形变区") },
          { label: "典型结合能范围", value: isMetal ? "1–5 eV/atom" : "6–10 eV/pair" }
        ]);
      } else {
        // Hexagonal Ice Ih tetrahedral open cage network!
        const centers = [];
        const R = 1.35;
        // Two puckered hexagonal rings stacked along Y forming open cage!
        for (let layer = 0; layer < 2; layer++) {
          const yBase = (layer - 0.5) * 1.65;
          for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI) / 3;
            const pucker = (i % 2 === 0 ? 0.24 : -0.24) * (layer === 0 ? 1 : -1);
            centers.push(new THREE.Vector3(R * Math.cos(ang), yBase + pucker, R * Math.sin(ang)));
          }
        }
        // Outer radial neighbors to show 4-fold tetrahedral H-bonding
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3;
          centers.push(new THREE.Vector3(R * 1.85 * Math.cos(ang), (i % 2 === 0 ? -0.6 : 0.6), R * 1.85 * Math.sin(ang)));
        }

        centers.forEach((oPos) => {
          root.add(SM.createAtom(0.24, 0xf87171, { position: oPos })); // Oxygen
        });

        for (let i = 0; i < centers.length; i++) {
          for (let j = i + 1; j < centers.length; j++) {
            const d = centers[i].distanceTo(centers[j]);
            if (d < 1.95) {
              // Covalent O-H on donor (1/3 of O...O distance) + Hydrogen bond (remaining 2/3)!
              const hPos = centers[i].clone().lerp(centers[j], 0.34);
              root.add(SM.createAtom(0.12, 0xffffff, { position: hPos }));
              root.add(SM.createBond(centers[i], hPos, 0.045, 0xf8fafc, 0.95));
              root.add(SM.createBond(hPos, centers[j], 0.022, 0x38bdf8, 0.55));
            }
          }
        }
        root.add(SM.createLabel("六角空旷氢键笼 (配位数=4, 冰密度 0.92 < 水 1.00)", new THREE.Vector3(0, 2.2, 0), { color: "#7dd3fc" }));

        ui.setLegend([
          { color: "#f87171", label: "氧原子 O (四面体氧骨架)" },
          { color: "#ffffff", label: "氢原子 H (极性共价键 O-H)" },
          { color: "#38bdf8", label: "方向性氢键 O-H···O (~0.2 eV)" }
        ]);
        ui.setMetrics([
          { label: "晶体结构", value: "六角冰 Ih (H₂O)" },
          { label: "水分子配位数", value: "4 (氢键四面体)" },
          { label: "单根氢键键能", value: "~0.21 eV (20 kJ/mol)" },
          { label: "反常体积效应", value: "熔化笼塌陷，密度增大9%" }
        ]);
      }

      drawBindingComparisonPlot();
    }

    function drawBindingComparisonPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      const map = PH.drawFrame(ctx, w, h, {
        xMin: 0, xMax: 5, yMin: 0, yMax: 9.5,
        title: "五种晶体基本结合类型典型键能 (eV / 键或原子) 量级对比",
        xLabel: "结合键类型",
        yLabel: "键能 (eV)",
        xTickLabels: [
          { val: 0.5, text: "范德瓦尔斯" },
          { val: 1.5, text: "氢键" },
          { val: 2.5, text: "金属键" },
          { val: 3.5, text: "共价键" },
          { val: 4.5, text: "离子键" }
        ]
      });
      const bars = [
        [0.5, 0.08, "#94a3b8"],
        [1.5, 0.25, "#38bdf8"],
        [2.5, 3.4, "#fbbf24"],
        [3.5, 7.3, "#34d399"],
        [4.5, 8.1, "#a78bfa"]
      ];
      bars.forEach(([x, v, c]) => {
        const bx = map.toX(x) - 14;
        const by = map.toY(v);
        ctx.fillStyle = c;
        ctx.fillRect(bx, by, 28, Math.max(3, map.toY(0) - by));
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "9.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(v + "eV", bx + 14, by - 4);
      });
    }

    ui.setControls([
      {
        type: "pills",
        label: "结合与力学对比实验",
        value: state.mode,
        options: [
          { label: "金属键延展滑移", value: "metallic" },
          { label: "离子键滑移脆断", value: "ionic_slip" },
          { label: "冰 Ih 氢键网络", value: "ice_hbond" }
        ],
        onChange: (v) => { state.mode = v; rebuild(); }
      },
      {
        type: "slider",
        label: "上层晶面切向滑移位移 Δx / a",
        min: 0, max: 1.0, step: 0.02, value: state.slipShift,
        unit: " a",
        onChange: (v) => { state.slipShift = v; rebuild(); }
      }
    ]);

    rebuild();

    return {
      update(dt) {
        electronParticles.forEach((em) => {
          em.position.addScaledVector(em.userData.vel, dt);
          if (Math.abs(em.position.x) > 2.7) em.userData.vel.x *= -1;
          if (Math.abs(em.position.y) > 1.5) em.userData.vel.y *= -1;
          if (Math.abs(em.position.z) > 1.4) em.userData.vel.z *= -1;
        });
      },
      onResize: drawBindingComparisonPlot
    };
  };

  // ============================================================================
  // 3.5–3.6 原子/离子半径比规则与晶体弹性应变张量
  // ============================================================================
  window.SimRegistry["3-5"] = function (simGroup, ui) {
    SM.setCameraView({ x: 5.8, y: 4.5, z: 6.8 });
    const root = new THREE.Group();
    simGroup.add(root);

    const state = {
      subMode: "radius_ratio", // 'radius_ratio' | 'elastic'
      ratio: 0.52,             // r+ / r-
      coordZ: 6,               // 3, 4, 6, 8
      strainType: "uniaxial",  // 'uniaxial' | 'shear' | 'hydro'
      strainVal: 0.16          // exaggerated visual strain
    };

    function rebuild() {
      clearGroup(root);

      if (state.subMode === "radius_ratio") {
        const rMinus = 1.05;
        const rPlus = rMinus * state.ratio;
        const touchDist = rPlus + rMinus;

        root.add(SM.createAtom(rPlus, 0xfbbf24, { position: new THREE.Vector3(0, 0, 0), emissiveIntensity: 0.35 }));

        let dirs = [];
        let critMin = 0.155;
        if (state.coordZ === 3) {
          critMin = 2 / Math.sqrt(3) - 1; // 0.155
          dirs = [0, 1, 2].map((i) => new THREE.Vector3(Math.cos((i * 2 * Math.PI) / 3), 0, Math.sin((i * 2 * Math.PI) / 3)));
        } else if (state.coordZ === 4) {
          critMin = Math.sqrt(3 / 2) - 1; // 0.225
          dirs = [
            new THREE.Vector3(1, 1, 1).normalize(),
            new THREE.Vector3(1, -1, -1).normalize(),
            new THREE.Vector3(-1, 1, -1).normalize(),
            new THREE.Vector3(-1, -1, 1).normalize()
          ];
        } else if (state.coordZ === 6) {
          critMin = Math.sqrt(2) - 1; // 0.414
          dirs = [
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
          ];
        } else {
          critMin = Math.sqrt(3) - 1; // 0.732
          for (const sx of [-1, 1])
            for (const sy of [-1, 1])
              for (const sz of [-1, 1]) dirs.push(new THREE.Vector3(sx, sy, sz).normalize());
        }

        const unstable = state.ratio < critMin - 0.002;
        // Actual center-to-anion distance cannot shrink below anion-anion contact!
        const anionDistFactor = state.coordZ === 8 ? (2 / Math.sqrt(3)) : state.coordZ === 6 ? Math.SQRT2 : state.coordZ === 4 ? Math.sqrt(3 / 2) : (2 / Math.sqrt(3));
        const minCenterDist = rMinus * anionDistFactor;
        const actualDist = Math.max(touchDist, minCenterDist);

        const aPts = dirs.map((d) => d.clone().multiplyScalar(actualDist));
        aPts.forEach((p) => {
          root.add(SM.createAtom(rMinus, unstable ? 0xf87171 : 0x34d399, { position: p, opacity: 0.62, transparent: true }));
        });
        for (let i = 0; i < aPts.length; i++) {
          for (let j = i + 1; j < aPts.length; j++) {
            if (aPts[i].distanceTo(aPts[j]) < rMinus * 2.25) {
              root.add(SM.createBond(aPts[i], aPts[j], 0.025, 0x94a3b8, 0.5));
            }
          }
        }

        root.add(SM.createLabel(
          unstable ? `不稳定! r+/r- < ${critMin.toFixed(3)} (阴离子相撞, 阳离子悬空)` : `几何稳定配位! r+/r- ≥ ${critMin.toFixed(3)}`,
          new THREE.Vector3(0, 2.35, 0),
          { color: unstable ? "#fca5a5" : "#6ee7b7" }
        ));

        ui.setLegend([
          { color: "#fbbf24", label: `中心阳离子 (r+ = ${state.ratio.toFixed(2)} r-)` },
          { color: "#34d399", label: "稳定相切阴离子配位笼" },
          { color: "#f87171", label: "阴离子互挤失稳状态" }
        ]);
        ui.setMetrics([
          { label: "检验配位数 Z", value: state.coordZ + " 配位" },
          { label: "当前半径比 r+/r-", value: state.ratio.toFixed(3) },
          { label: "最低临界比 γ_min", value: critMin.toFixed(3) },
          { label: "鲍林第一规则判定", value: unstable ? "失稳 (需降配位)" : "稳定相切" }
        ]);
      } else {
        // Cubic Crystal Elastic Strain Tensor (Silicon: C11=166, C12=64, C44=80 GPa)
        const C11 = 166, C12 = 64, C44 = 80;
        const poisson = C12 / (C11 + C12); // ~0.278
        const eps = state.strainVal;

        const mat4 = new THREE.Matrix4();
        if (state.strainType === "uniaxial") {
          mat4.makeScale(1 + eps, 1 - poisson * eps, 1 - poisson * eps);
        } else if (state.strainType === "shear") {
          mat4.set(
            1, eps * 0.85, 0, 0,
            eps * 0.85, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
          );
        } else {
          mat4.makeScale(1 - eps * 0.5, 1 - eps * 0.5, 1 - eps * 0.5);
        }

        // Reference undeformed wireframe cube
        const L = 2.8;
        root.add(SM.createParallelepiped(
          new THREE.Vector3(L, 0, 0), new THREE.Vector3(0, L, 0), new THREE.Vector3(0, 0, L),
          new THREE.Vector3(-L / 2, -L / 2, -L / 2), 0x475569, 0
        ));

        // Deformed lattice atoms & bonds
        const a1 = new THREE.Vector3(L, 0, 0).applyMatrix4(mat4);
        const a2 = new THREE.Vector3(0, L, 0).applyMatrix4(mat4);
        const a3 = new THREE.Vector3(0, 0, L).applyMatrix4(mat4);
        const orig = new THREE.Vector3(-L / 2, -L / 2, -L / 2).applyMatrix4(mat4);
        root.add(SM.createParallelepiped(a1, a2, a3, orig, 0x38bdf8, 0.14));

        for (let ix = -1; ix <= 1; ix++) {
          for (let iy = -1; iy <= 1; iy++) {
            for (let iz = -1; iz <= 1; iz++) {
              const p = new THREE.Vector3(ix * (L / 2), iy * (L / 2), iz * (L / 2)).applyMatrix4(mat4);
              root.add(SM.createAtom(0.18, 0x38bdf8, { position: p }));
            }
          }
        }

        // Stress arrows
        if (Math.abs(eps) > 0.01) {
          if (state.strainType === "uniaxial") {
            const dir = eps > 0 ? 1 : -1;
            root.add(SM.createArrow(new THREE.Vector3(1.8, 0, 0), new THREE.Vector3(dir, 0, 0), 0.9, 0xfbbf24));
            root.add(SM.createArrow(new THREE.Vector3(-1.8, 0, 0), new THREE.Vector3(-dir, 0, 0), 0.9, 0xfbbf24));
          } else if (state.strainType === "shear") {
            root.add(SM.createArrow(new THREE.Vector3(-0.6, 1.75, 0), new THREE.Vector3(eps > 0 ? 1 : -1, 0, 0), 1.2, 0xfbbf24));
            root.add(SM.createArrow(new THREE.Vector3(0.6, -1.75, 0), new THREE.Vector3(eps > 0 ? -1 : 1, 0, 0), 1.2, 0xfbbf24));
          }
        }

        const physEps = eps * 0.05; // map visual slider to 0..1.5% real strain
        let uEnergy = 0; // MJ/m³
        if (state.strainType === "uniaxial") {
          const eyy = -poisson * physEps;
          uEnergy = 0.5 * C11 * (physEps * physEps + 2 * eyy * eyy) + C12 * (eyy * eyy + 2 * physEps * eyy);
        } else if (state.strainType === "shear") {
          uEnergy = 0.5 * C44 * (physEps * physEps);
        } else {
          uEnergy = 1.5 * (C11 + 2 * C12) * Math.pow(physEps * 0.5, 2);
        }

        ui.setLegend([
          { color: "#475569", label: "未形变参考立方晶胞" },
          { color: "#38bdf8", label: "弹性应变后晶格与位点" },
          { color: "#fbbf24", label: "外加应力张量方向 σ_ij" }
        ]);
        ui.setMetrics([
          { label: "参考单晶常量 (Si)", value: "C₁₁=166, C₄₄=80 GPa" },
          { label: "体弹性模量 B", value: ((C11 + 2 * C12) / 3).toFixed(1) + " GPa" },
          { label: "泊松比 ν", value: poisson.toFixed(3) },
          { label: "弹性势能密度 u", value: (uEnergy * 1000).toFixed(2) + " MJ/m³" }
        ]);
      }

      drawPlot();
    }

    function drawPlot() {
      const p = PH.prepare(ui.getPlotCanvas());
      if (!p) return;
      const { ctx, w, h } = p;
      if (state.subMode === "radius_ratio") {
        const map = PH.drawFrame(ctx, w, h, {
          xMin: 0.1, xMax: 1.0, yMin: 2, yMax: 9,
          title: "离子半径比 r+/r- 与最大稳定配位数 Z 阶梯相图",
          xLabel: "阳阴离子半径比 γ = r+ / r-",
          yLabel: "稳定配位数 Z"
        });
        const steps = [
          [0.155, 3], [0.225, 3], [0.225, 4], [0.414, 4],
          [0.414, 6], [0.732, 6], [0.732, 8], [1.0, 8]
        ];
        PH.drawCurve(ctx, map, steps, { color: "#38bdf8", width: 2.4 });
        PH.drawPoint(ctx, map, state.ratio, state.coordZ, "#fbbf24", 5, `(${state.ratio.toFixed(2)}, Z=${state.coordZ})`);
      } else {
        const map = PH.drawFrame(ctx, w, h, {
          xMin: -0.3, xMax: 0.3, yMin: 0, yMax: 8,
          title: "胡克定律区二次弹性应变能密度 u(ε) ∝ ½ C ε²",
          xLabel: "形变参数 ε",
          yLabel: "弹性势能 u (arb.)"
        });
        const stiff = state.strainType === "shear" ? 45 : state.strainType === "uniaxial" ? 72 : 90;
        const pts = [];
        for (let e = -0.3; e <= 0.301; e += 0.015) pts.push([e, stiff * e * e]);
        PH.drawCurve(ctx, map, pts, { color: "#34d399", fill: "rgba(52,211,153,0.15)", width: 2.2 });
        PH.drawPoint(ctx, map, state.strainVal, stiff * state.strainVal * state.strainVal, "#fbbf24", 5);
      }
    }

    function buildControls() {
      const ctrls = [
        {
          type: "pills",
          label: "章节子课题切换",
          value: state.subMode,
          options: [
            { label: "3.5/3.6 离子半径比规则", value: "radius_ratio" },
            { label: "晶体弹性常量与应变", value: "elastic" }
          ],
          onChange: (v) => { state.subMode = v; buildControls(); rebuild(); }
        }
      ];

      if (state.subMode === "radius_ratio") {
        ctrls.push(
          {
            type: "pills",
            label: "配位多面体检验 (Z)",
            value: String(state.coordZ),
            options: [
              { label: "Z=3 三角", value: "3" },
              { label: "Z=4 四面体", value: "4" },
              { label: "Z=6 八面体", value: "6" },
              { label: "Z=8 立方体", value: "8" }
            ],
            onChange: (v) => { state.coordZ = Number(v); rebuild(); }
          },
          {
            type: "slider",
            label: "正负离子半径比 r+ / r-",
            min: 0.15, max: 0.98, step: 0.01, value: state.ratio,
            unit: "",
            onChange: (v) => { state.ratio = v; rebuild(); }
          }
        );
      } else {
        ctrls.push(
          {
            type: "pills",
            label: "施加弹性应变模式",
            value: state.strainType,
            options: [
              { label: "单轴拉伸/压缩 (e_xx)", value: "uniaxial" },
              { label: "纯切应变 (e_xy, C₄₄)", value: "shear" },
              { label: "静水压体应变 (B)", value: "hydro" }
            ],
            onChange: (v) => { state.strainType = v; rebuild(); }
          },
          {
            type: "slider",
            label: "应变幅值 (放大显示)",
            min: -0.28, max: 0.28, step: 0.02, value: state.strainVal,
            unit: "",
            onChange: (v) => { state.strainVal = v; rebuild(); }
          }
        );
      }

      ui.setControls(ctrls);
    }

    buildControls();
    rebuild();
    return { onResize: drawPlot };
  };
})();
