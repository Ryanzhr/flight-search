"use client";

import type { PriceTrendPoint } from "@/lib/types";

export function TrendChart({ points }: { points: PriceTrendPoint[] }) {
  if (points.length < 2) return null;
  const width = 640;
  const height = 160;
  const pad = 16;
  const prices = points.map((p) => p.priceCny);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(1, max - min);

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p.priceCny - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="font-display text-2xl text-ink-900">分钟级票价轨迹</h3>
          <p className="mt-1 text-sm text-ink-700/65">
            近窗聚合最低可售价 · ¥{min.toLocaleString("zh-CN")} – ¥
            {max.toLocaleString("zh-CN")}
          </p>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full text-skyline-500"
        role="img"
        aria-label="票价走势"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a9cb0" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#1a9cb0" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#areaFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={coords[coords.length - 1][0]}
          cy={coords[coords.length - 1][1]}
          r="4"
          fill="#d4892a"
        />
      </svg>
    </div>
  );
}
