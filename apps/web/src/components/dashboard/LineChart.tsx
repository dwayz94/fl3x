/** Single-series line chart with y gridlines and sparse x labels. Pure SVG. */
export function LineChart({ points, color = "#FF97CB" }: { points: { label: string; value: number }[]; color?: string }) {
  const W = 800;
  const H = 220;
  const pad = { l: 8, r: 44, t: 10, b: 28 };
  const max = Math.max(4, ...points.map((p) => p.value));
  const nice = Math.ceil(max / 4) * 4;
  const x = (i: number) => pad.l + (i / Math.max(1, points.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / nice) * (H - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const every = Math.max(1, Math.ceil(points.length / 7));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Views over time">
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (nice / 4) * i;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.08)" />
            <text x={W - pad.r + 8} y={y(v) + 4} fill="rgba(255,255,255,0.5)" fontSize="11">
              {v >= 1000 ? `${v / 1000}K` : v}
            </text>
          </g>
        );
      })}
      {points.map((p, i) =>
        i % every === 0 ? (
          <text key={p.label} x={x(i)} y={H - 6} fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">
            {p.label}
          </text>
        ) : null,
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
