/**
 * 《固体物理学》交互式 3D 教学仿真实验平台 — 主控逻辑 (UI Controller & Router)
 */
(function () {
  const DATA = window.SSP_DATA;
  const SM = window.SceneManager;

  // Flatten all cases for sequential prev/next navigation and hash lookup
  const allCases = [];
  DATA.chapters.forEach((ch, cIdx) => {
    ch.cases.forEach((cs, sIdx) => {
      allCases.push({
        chapter: ch,
        chapterIndex: cIdx,
        caseIndex: sIdx,
        data: cs
      });
    });
  });

  let currentEntry = allCases[0];
  let activeTheoryTab = "theory"; // 'theory' | 'objectives' | 'frontier'

  // DOM Elements
  const els = {};

  function cacheElements() {
    els.menubar = document.getElementById("chapterMenubar");
    els.chapterSelect = document.getElementById("chapterSelect");
    els.caseSelect = document.getElementById("caseSelect");
    els.btnPrev = document.getElementById("btnPrevCase");
    els.btnNext = document.getElementById("btnNextCase");
    els.bannerBreadcrumb = document.getElementById("bannerBreadcrumb");
    els.bannerTitle = document.getElementById("bannerTitle");
    els.bannerCaption = document.getElementById("bannerCaption");
    els.stageLegend = document.getElementById("stageLegend");
    els.controlsContainer = document.getElementById("controlsContainer");
    els.metricsContainer = document.getElementById("metricsContainer");
    els.plotCanvas = document.getElementById("plotCanvas");
    els.theoryBody = document.getElementById("theoryBody");
    els.loadingOverlay = document.getElementById("loadingOverlay");

    // Stage buttons
    els.btnResetCam = document.getElementById("btnResetCam");
    els.btnAutoRotate = document.getElementById("btnAutoRotate");
    els.btnPause = document.getElementById("btnPause");
    els.btnToggleAxes = document.getElementById("btnToggleAxes");
    els.btnFullscreen = document.getElementById("btnFullscreen");

    // Modals
    els.btnOpenSyllabus = document.getElementById("btnOpenSyllabus");
    els.btnOpenQuiz = document.getElementById("btnOpenQuiz");
    els.syllabusModal = document.getElementById("syllabusModal");
    els.syllabusModalBody = document.getElementById("syllabusModalBody");
    els.quizModal = document.getElementById("quizModal");
    els.quizModalTitle = document.getElementById("quizModalTitle");
    els.quizModalBody = document.getElementById("quizModalBody");
  }

  // ==================== 1. Chapter Dropdown Navigation Bar ====================
  function buildChapterMenubar() {
    els.menubar.innerHTML = "";

    DATA.chapters.forEach((ch, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "chapter-dropdown" + (idx >= 4 ? " align-right" : "");
      wrap.dataset.chId = ch.id;

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "chapter-trigger";
      trigger.innerHTML = `
        <span class="ch-num">${ch.num}</span>
        <span>${ch.shortTitle}</span>
        <span class="caret">▾</span>
      `;

      const panel = document.createElement("div");
      panel.className = "chapter-menu-panel";

      const head = document.createElement("div");
      head.className = "menu-panel-header";
      head.innerHTML = `
        <span class="menu-panel-title">${ch.fullTitle.split(" (")[0]}</span>
        <span class="menu-panel-meta">${ch.weeks}</span>
      `;
      panel.appendChild(head);

      ch.cases.forEach((cs) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "case-menu-item";
        item.dataset.caseId = cs.id;
        item.innerHTML = `
          <span class="case-code">${cs.code}</span>
          <span class="case-info">
            <span class="case-name">${cs.title}</span>
            <span class="case-desc">${cs.subtitle}</span>
          </span>
        `;
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          closeAllDropdowns();
          selectCaseById(cs.id);
        });
        panel.appendChild(item);
      });

      function adjustDropdownAlignment() {
        const rect = trigger.getBoundingClientRect();
        const alignRight = (rect.left + 380 > window.innerWidth) && (rect.right > 360);
        wrap.classList.toggle("align-right", alignRight);
      }

      // Toggle dropdown on click; also support hover when desktop pointer is used
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasOpen = wrap.classList.contains("open");
        closeAllDropdowns();
        if (!wasOpen) {
          adjustDropdownAlignment();
          wrap.classList.add("open");
        }
      });

      wrap.addEventListener("mouseenter", () => {
        if (window.innerWidth > 960) {
          closeAllDropdowns();
          adjustDropdownAlignment();
          wrap.classList.add("open");
        }
      });
      wrap.addEventListener("mouseleave", () => {
        if (window.innerWidth > 960) {
          wrap.classList.remove("open");
        }
      });

      wrap.appendChild(trigger);
      wrap.appendChild(panel);
      els.menubar.appendChild(wrap);
    });

    document.addEventListener("click", closeAllDropdowns);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllDropdowns();
        els.syllabusModal.classList.remove("open");
        els.quizModal.classList.remove("open");
      }
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".chapter-dropdown.open").forEach((el) => el.classList.remove("open"));
  }

  // ==================== 2. Dual Cascading Native <select> Dropdowns ====================
  function buildSelectDropdowns() {
    els.chapterSelect.innerHTML = "";
    DATA.chapters.forEach((ch) => {
      const opt = document.createElement("option");
      opt.value = ch.id;
      opt.textContent = `${ch.num} · ${ch.shortTitle} (${ch.cases.length}个案例)`;
      els.chapterSelect.appendChild(opt);
    });

    els.chapterSelect.addEventListener("change", () => {
      const ch = DATA.chapters.find((c) => c.id === els.chapterSelect.value);
      if (ch && ch.cases.length > 0) {
        selectCaseById(ch.cases[0].id);
      }
    });

    els.caseSelect.addEventListener("change", () => {
      selectCaseById(els.caseSelect.value);
    });

    els.btnPrev.addEventListener("click", () => {
      const curIdx = allCases.indexOf(currentEntry);
      const prevIdx = (curIdx - 1 + allCases.length) % allCases.length;
      selectCaseById(allCases[prevIdx].data.id);
    });

    els.btnNext.addEventListener("click", () => {
      const curIdx = allCases.indexOf(currentEntry);
      const nextIdx = (curIdx + 1) % allCases.length;
      selectCaseById(allCases[nextIdx].data.id);
    });
  }

  function syncDropdownHighlights() {
    const chId = currentEntry.chapter.id;
    const csId = currentEntry.data.id;

    // Update top chapter menubar
    document.querySelectorAll(".chapter-dropdown").forEach((el) => {
      el.classList.toggle("active-chapter", el.dataset.chId === chId);
    });
    document.querySelectorAll(".case-menu-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.caseId === csId);
    });

    // Update native selects
    els.chapterSelect.value = chId;
    els.caseSelect.innerHTML = "";
    currentEntry.chapter.cases.forEach((cs) => {
      const opt = document.createElement("option");
      opt.value = cs.id;
      opt.textContent = `${cs.code} ${cs.title}`;
      els.caseSelect.appendChild(opt);
    });
    els.caseSelect.value = csId;
  }

  // ==================== 3. UI Hooks for Active 3D Simulation ====================
  let metricNodesCache = [];

  const uiHooks = {
    getPlotCanvas() {
      return els.plotCanvas;
    },

    setLegend(items) {
      els.stageLegend.innerHTML = "";
      (items || []).forEach((it) => {
        const row = document.createElement("div");
        row.className = "legend-item";
        row.innerHTML = `<span class="legend-dot" style="background:${it.color};color:${it.color}"></span><span>${it.label}</span>`;
        els.stageLegend.appendChild(row);
      });
    },

    setMetrics(items) {
      const list = items || [];
      if (metricNodesCache.length !== list.length) {
        els.metricsContainer.innerHTML = "";
        metricNodesCache = list.map(() => {
          const box = document.createElement("div");
          box.className = "metric-box";
          const lbl = document.createElement("div");
          lbl.className = "metric-label";
          const val = document.createElement("div");
          val.className = "metric-value";
          box.appendChild(lbl);
          box.appendChild(val);
          els.metricsContainer.appendChild(box);
          return { lbl, val };
        });
      }
      list.forEach((it, idx) => {
        if (metricNodesCache[idx].lbl.textContent !== it.label) {
          metricNodesCache[idx].lbl.textContent = it.label;
        }
        if (metricNodesCache[idx].val.textContent !== it.value) {
          metricNodesCache[idx].val.textContent = it.value;
        }
      });
    },

    setControls(specs) {
      els.controlsContainer.innerHTML = "";
      (specs || []).forEach((spec) => {
        const grp = document.createElement("div");
        grp.className = "ctrl-group";

        if (spec.type === "slider") {
          const head = document.createElement("div");
          head.className = "ctrl-label-row";
          const lbl = document.createElement("span");
          lbl.className = "ctrl-label";
          lbl.textContent = spec.label;
          const valSpan = document.createElement("span");
          valSpan.className = "ctrl-val";
          const fmtVal = (v) => {
            const decimals = String(spec.step).includes(".") ? String(spec.step).split(".")[1].length : 0;
            return Number(v).toFixed(decimals) + (spec.unit || "");
          };
          valSpan.textContent = fmtVal(spec.value);
          head.appendChild(lbl);
          head.appendChild(valSpan);

          const input = document.createElement("input");
          input.type = "range";
          input.min = spec.min;
          input.max = spec.max;
          input.step = spec.step;
          input.value = spec.value;
          input.addEventListener("input", () => {
            const num = parseFloat(input.value);
            valSpan.textContent = fmtVal(num);
            if (spec.onChange) spec.onChange(num);
          });

          grp.appendChild(head);
          grp.appendChild(input);
        } else if (spec.type === "pills") {
          const lbl = document.createElement("div");
          lbl.className = "ctrl-label";
          lbl.textContent = spec.label;
          const pillWrap = document.createElement("div");
          pillWrap.className = "pill-group";

          spec.options.forEach((opt) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-pill" + (String(opt.value) === String(spec.value) ? " active" : "");
            btn.textContent = opt.label;
            btn.addEventListener("click", () => {
              pillWrap.querySelectorAll(".btn-pill").forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");
              if (spec.onChange) spec.onChange(opt.value);
            });
            pillWrap.appendChild(btn);
          });
          grp.appendChild(lbl);
          grp.appendChild(pillWrap);
        } else if (spec.type === "select") {
          const lbl = document.createElement("div");
          lbl.className = "ctrl-label";
          lbl.textContent = spec.label;
          const sel = document.createElement("select");
          sel.className = "native-select";
          spec.options.forEach((opt) => {
            const o = document.createElement("option");
            o.value = opt.value;
            o.textContent = opt.label;
            sel.appendChild(o);
          });
          sel.value = spec.value;
          sel.addEventListener("change", () => {
            if (spec.onChange) spec.onChange(sel.value);
          });
          grp.appendChild(lbl);
          grp.appendChild(sel);
        } else if (spec.type === "checkbox") {
          const row = document.createElement("label");
          row.className = "toggle-row";
          const span = document.createElement("span");
          span.textContent = spec.label;
          const chk = document.createElement("input");
          chk.type = "checkbox";
          chk.checked = !!spec.value;
          chk.addEventListener("change", () => {
            if (spec.onChange) spec.onChange(chk.checked);
          });
          row.appendChild(span);
          row.appendChild(chk);
          grp.appendChild(row);
        }

        els.controlsContainer.appendChild(grp);
      });
    }
  };

  // ==================== 4. Case Loading & Theory Rendering ====================
  function selectCaseById(caseId, updateHash = true) {
    const found = allCases.find((e) => e.data.id === caseId);
    if (!found) return;
    currentEntry = found;

    if (updateHash) {
      try {
        history.replaceState(null, "", "#case=" + caseId);
      } catch (e) { /* ignore file:// security quirks if any */ }
    }

    syncDropdownHighlights();

    const ch = currentEntry.chapter;
    const cs = currentEntry.data;
    els.bannerBreadcrumb.textContent = `${ch.num} · ${ch.shortTitle} (${ch.weeks})  ▸  节次 ${cs.code}`;
    els.bannerTitle.textContent = `${cs.code} ${cs.title}`;
    els.bannerCaption.textContent = cs.caption;

    renderTheoryPanel();

    const factory = window.SimRegistry && window.SimRegistry[cs.id];
    if (factory) {
      metricNodesCache = [];
      SM.loadSimulation(factory, uiHooks);
    }
  }

  function renderTheoryPanel() {
    const cs = currentEntry.data;
    if (activeTheoryTab === "theory") {
      els.theoryBody.innerHTML = cs.theory;
    } else if (activeTheoryTab === "objectives") {
      els.theoryBody.innerHTML = `<ul class="objective-list">${cs.objectives.map((o) => `<li>${o}</li>`).join("")}</ul>`;
    } else {
      els.theoryBody.innerHTML = `<div class="frontier-box">${cs.frontier}</div>`;
    }
    typesetMath(els.theoryBody);
  }

  function typesetMath(dom) {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(dom, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("KaTeX render warning:", e);
      }
    }
  }

  function bindTheoryTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeTheoryTab = btn.dataset.tab;
        renderTheoryPanel();
      });
    });
  }

  // ==================== 5. Stage Controls & Modals ====================
  function bindStageControls() {
    let isAuto = false;
    let isPaused = false;
    let showAxes = true;

    els.btnResetCam.addEventListener("click", () => SM.resetCamera());

    els.btnAutoRotate.addEventListener("click", () => {
      isAuto = !isAuto;
      SM.setAutoRotate(isAuto);
      els.btnAutoRotate.classList.toggle("active", isAuto);
    });

    els.btnPause.addEventListener("click", () => {
      isPaused = !isPaused;
      SM.setPaused(isPaused);
      els.btnPause.classList.toggle("active", isPaused);
      els.btnPause.textContent = isPaused ? "▶ 继续演化" : "⏸ 暂停演化";
    });

    els.btnToggleAxes.addEventListener("click", () => {
      showAxes = !showAxes;
      SM.setAxesVisible(showAxes);
      els.btnToggleAxes.classList.toggle("active", showAxes);
    });

    els.btnFullscreen.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  function buildModals() {
    // Syllabus Overview Modal
    els.btnOpenSyllabus.addEventListener("click", () => {
      els.syllabusModalBody.innerHTML = "";
      const intro = document.createElement("div");
      intro.className = "frontier-box";
      intro.innerHTML = `
        <strong>课程编号：</strong>${DATA.courseInfo.code} &nbsp;|&nbsp;
        <strong>课程名称：</strong>${DATA.courseInfo.name} &nbsp;|&nbsp;
        <strong>学时学分：</strong>${DATA.courseInfo.credits}<br>
        <strong>教材依据：</strong>${DATA.courseInfo.textbook} —— 点击下方任意教学节次即可直接进入对应 3D 交互仿真实验！
      `;
      els.syllabusModalBody.appendChild(intro);

      DATA.chapters.forEach((ch) => {
        const blk = document.createElement("div");
        blk.className = "syllabus-chapter-block";
        blk.innerHTML = `
          <div class="syllabus-chapter-head">
            <h3>${ch.fullTitle}</h3>
            <span class="badge-pill">${ch.weeks}</span>
          </div>
        `;
        const grid = document.createElement("div");
        grid.className = "syllabus-cases-grid";
        ch.cases.forEach((cs) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "case-menu-item" + (cs.id === currentEntry.data.id ? " active" : "");
          btn.innerHTML = `
            <span class="case-code">${cs.code}</span>
            <span class="case-info">
              <span class="case-name">${cs.title}</span>
              <span class="case-desc">${cs.subtitle}</span>
            </span>
          `;
          btn.addEventListener("click", () => {
            els.syllabusModal.classList.remove("open");
            selectCaseById(cs.id);
          });
          grid.appendChild(btn);
        });
        blk.appendChild(grid);
        els.syllabusModalBody.appendChild(blk);
      });

      els.syllabusModal.classList.add("open");
    });

    // Chapter In-class Quiz Modal
    els.btnOpenQuiz.addEventListener("click", () => {
      const ch = currentEntry.chapter;
      els.quizModalTitle.textContent = `${ch.num} · ${ch.shortTitle} — 随堂概念检测`;
      els.quizModalBody.innerHTML = "";

      (ch.quizzes || []).forEach((qz) => {
        const card = document.createElement("div");
        card.className = "quiz-question-card";
        const qTitle = document.createElement("div");
        qTitle.className = "quiz-q-title";
        qTitle.textContent = qz.q;
        card.appendChild(qTitle);

        const optsWrap = document.createElement("div");
        optsWrap.className = "quiz-options";
        const explain = document.createElement("div");
        explain.className = "quiz-explain";
        explain.textContent = "【物理图像解析】" + qz.explain;

        qz.options.forEach((optText, idx) => {
          const ob = document.createElement("button");
          ob.type = "button";
          ob.className = "quiz-opt-btn";
          ob.textContent = optText;
          ob.addEventListener("click", () => {
            optsWrap.querySelectorAll(".quiz-opt-btn").forEach((b, bIdx) => {
              b.classList.remove("correct", "wrong");
              if (bIdx === qz.answer) b.classList.add("correct");
            });
            if (idx !== qz.answer) ob.classList.add("wrong");
            explain.classList.add("visible");
          });
          optsWrap.appendChild(ob);
        });

        card.appendChild(optsWrap);
        card.appendChild(explain);
        els.quizModalBody.appendChild(card);
      });

      els.quizModal.classList.add("open");
    });

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        els.syllabusModal.classList.remove("open");
        els.quizModal.classList.remove("open");
      });
    });

    [els.syllabusModal, els.quizModal].forEach((m) => {
      m.addEventListener("click", (e) => {
        if (e.target === m) m.classList.remove("open");
      });
    });
  }

  // ==================== 6. Bootstrapping ====================
  function boot() {
    cacheElements();
    buildChapterMenubar();
    buildSelectDropdowns();
    bindTheoryTabs();
    bindStageControls();
    buildModals();

    SM.init("webglContainer");

    // Check URL hash (#case=2-3)
    const hash = window.location.hash || "";
    const match = hash.match(/case=([0-9]+-[0-9]+)/);
    const initialId = match ? match[1] : allCases[0].data.id;
    selectCaseById(initialId, false);

    if (els.loadingOverlay) {
      els.loadingOverlay.classList.add("hidden");
    }

    // Re-typeset math if KaTeX finishes loading asynchronously
    window.addEventListener("katex-ready", () => renderTheoryPanel());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
