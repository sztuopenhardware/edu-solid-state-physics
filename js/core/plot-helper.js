/**
 * 高清 2D 科学绘图引擎 (High-DPI Scientific Canvas Plotter)
 * 用于实时绘制与 3D 场景联动的色散曲线、XRD 衍射谱、势能曲线、热容曲线、费米分布等
 */
window.PlotHelper = (function () {
  function prepare(canvas) {
    if (!canvas) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.floor(rect.width || 380));
    const h = Math.max(150, Math.floor(rect.height || 195));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Subtle dark background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#091122");
    grad.addColorStop(1, "#060b16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    return { ctx, w, h };
  }

  function createMapper(pad, w, h, xMin, xMax, yMin, yMax) {
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;
    const dx = (xMax - xMin) || 1;
    const dy = (yMax - yMin) || 1;
    return {
      pad,
      pw,
      ph,
      xMin,
      xMax,
      yMin,
      yMax,
      toX: (x) => pad.left + ((x - xMin) / dx) * pw,
      toY: (y) => pad.top + ph - ((y - yMin) / dy) * ph
    };
  }

  function drawFrame(ctx, w, h, opts) {
    const pad = Object.assign({ top: 26, right: 16, bottom: 30, left: 44 }, opts.pad || {});
    const map = createMapper(pad, w, h, opts.xMin, opts.xMax, opts.yMin, opts.yMax);

    // Grid lines
    ctx.strokeStyle = "rgba(100, 140, 200, 0.12)";
    ctx.lineWidth = 1;
    const nx = opts.xTicks || 4;
    const ny = opts.yTicks || 4;

    for (let i = 0; i <= nx; i++) {
      const gx = pad.left + (map.pw * i) / nx;
      ctx.beginPath();
      ctx.moveTo(gx, pad.top);
      ctx.lineTo(gx, pad.top + map.ph);
      ctx.stroke();
    }
    for (let j = 0; j <= ny; j++) {
      const gy = pad.top + (map.ph * j) / ny;
      ctx.beginPath();
      ctx.moveTo(pad.left, gy);
      ctx.lineTo(pad.left + map.pw, gy);
      ctx.stroke();
    }

    // Zero reference lines if within range
    ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
    if (opts.yMin < 0 && opts.yMax > 0) {
      const y0 = map.toY(0);
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y0);
      ctx.lineTo(pad.left + map.pw, y0);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (opts.xMin < 0 && opts.xMax > 0) {
      const x0 = map.toX(0);
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x0, pad.top);
      ctx.lineTo(x0, pad.top + map.ph);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Border axes
    ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(pad.left, pad.top, map.pw, map.ph);

    // Title
    if (opts.title) {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 11.5px Inter, 'Microsoft YaHei', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(opts.title, pad.left, 16);
    }

    // Axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10.5px Inter, 'Microsoft YaHei', sans-serif";
    if (opts.xLabel) {
      ctx.textAlign = "center";
      ctx.fillText(opts.xLabel, pad.left + map.pw / 2, h - 6);
    }
    if (opts.yLabel) {
      ctx.save();
      ctx.translate(12, pad.top + map.ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(opts.yLabel, 0, 0);
      ctx.restore();
    }

    // Custom tick labels
    if (opts.xTickLabels) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px 'JetBrains Mono', Consolas, monospace";
      ctx.textAlign = "center";
      opts.xTickLabels.forEach((item) => {
        const tx = map.toX(item.val);
        if (tx >= pad.left - 4 && tx <= pad.left + map.pw + 4) {
          ctx.fillText(item.text, tx, pad.top + map.ph + 13);
        }
      });
    } else if (opts.showAutoTicks !== false) {
      ctx.fillStyle = "#64748b";
      ctx.font = "9.5px 'JetBrains Mono', Consolas, monospace";
      ctx.textAlign = "left";
      ctx.fillText(formatNum(opts.xMin), pad.left, pad.top + map.ph + 12);
      ctx.textAlign = "right";
      ctx.fillText(formatNum(opts.xMax), pad.left + map.pw, pad.top + map.ph + 12);
      ctx.fillText(formatNum(opts.yMax), pad.left - 4, pad.top + 8);
      ctx.fillText(formatNum(opts.yMin), pad.left - 4, pad.top + map.ph);
    }

    return map;
  }

  function formatNum(v) {
    if (Math.abs(v) < 1e-6) return "0";
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  function drawCurve(ctx, map, pts, style = {}) {
    if (!pts || pts.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(map.pad.left, map.pad.top, map.pw, map.ph);
    ctx.clip();

    if (style.fill) {
      const baseY = map.toY(style.fillBase !== undefined ? style.fillBase : map.yMin);
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = map.toX(p[0]);
        const py = map.toY(p[1]);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.lineTo(map.toX(pts[pts.length - 1][0]), baseY);
      ctx.lineTo(map.toX(pts[0][0]), baseY);
      ctx.closePath();
      ctx.fillStyle = style.fill;
      ctx.fill();
    }

    ctx.beginPath();
    if (style.dash) ctx.setLineDash(style.dash);
    pts.forEach((p, idx) => {
      const px = map.toX(p[0]);
      const py = map.toY(p[1]);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = style.color || "#38bdf8";
    ctx.lineWidth = style.width || 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPoint(ctx, map, x, y, color = "#fbbf24", radius = 4.5, label = "") {
    const px = map.toX(x);
    const py = map.toY(y);
    if (px < map.pad.left - 2 || px > map.pad.left + map.pw + 2) return;
    if (py < map.pad.top - 2 || py > map.pad.top + map.ph + 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(251, 191, 36, 0.22)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    if (label) {
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 10.5px 'JetBrains Mono', Inter, sans-serif";
      ctx.textAlign = px > map.pad.left + map.pw * 0.72 ? "right" : "left";
      const offset = px > map.pad.left + map.pw * 0.72 ? -8 : 8;
      ctx.fillText(label, px + offset, Math.max(map.pad.top + 12, py - 6));
    }
    ctx.restore();
  }

  function drawLegend(ctx, map, items) {
    let lx = map.pad.left + map.pw - 6;
    let ly = map.pad.top + 13;
    ctx.save();
    ctx.font = "10.5px Inter, 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "right";
    items.forEach((it) => {
      ctx.fillStyle = it.color;
      ctx.fillText("● " + it.label, lx, ly);
      ly += 14;
    });
    ctx.restore();
  }

  return {
    prepare,
    drawFrame,
    drawCurve,
    drawPoint,
    drawLegend
  };
})();
