/* ============================================================
   REBUILT — charts.js
   No chart library — just enough hand-rolled SVG to keep the app
   dependency-free and fast. Two shapes: a radial ring (level /
   completion-rate) and a simple bar chart (weekly trends).
   ============================================================ */

window.REBUILT = window.REBUILT || {};

REBUILT.Charts = (function () {

  /** A circular progress ring with a number in the middle. Returns an SVG string. */
  function radialProgress(opts) {
    const size = opts.size || 160;
    const stroke = opts.strokeWidth || 12;
    const pct = Math.max(0, Math.min(100, opts.pct));
    const r = (size - stroke) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - pct / 100);
    const color = opts.color || "var(--accent)";
    const track = opts.trackColor || "var(--ring-track)";

    return `
      <svg class="radial-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${opts.ariaLabel || ""}">
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"></circle>
        <circle class="radial-ring__value" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}"
          stroke-width="${stroke}" stroke-linecap="round"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          transform="rotate(-90 ${c} ${c})"></circle>
      </svg>
    `;
  }

  /**
   * Simple bar chart. `data` = [{ label, value }]. Returns an SVG string.
   * Bars are drawn left-to-right regardless of page text direction so the
   * time axis always reads chronologically.
   */
  function barChart(data, opts) {
    opts = opts || {};
    const width = opts.width || 320;
    const height = opts.height || 140;
    const gap = opts.gap != null ? opts.gap : 10;
    const padBottom = 22;
    const padTop = 10;
    const maxValue = opts.maxValue || Math.max(1, ...data.map((d) => d.value));
    const barWidth = (width - gap * (data.length - 1)) / data.length;
    const color = opts.color || "var(--accent-2)";

    const bars = data
      .map((d, i) => {
        const x = i * (barWidth + gap);
        const usableHeight = height - padBottom - padTop;
        const barHeight = maxValue > 0 ? (d.value / maxValue) * usableHeight : 0;
        const y = padTop + (usableHeight - barHeight);
        const radius = Math.min(6, barWidth / 2);
        return `
          <g class="bar-chart__col">
            <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 2)}" rx="${radius}" fill="${d.color || color}">
              <title>${d.label}: ${d.value}${opts.suffix || ""}</title>
            </rect>
            <text x="${x + barWidth / 2}" y="${height - 4}" text-anchor="middle" class="bar-chart__label">${d.label}</text>
          </g>
        `;
      })
      .join("");

    return `
      <svg class="bar-chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" style="direction:ltr">
        ${bars}
      </svg>
    `;
  }

  return { radialProgress, barChart };
})();
