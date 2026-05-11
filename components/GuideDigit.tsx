"use client";

export function GuideDigit({ digit }: { digit: number | string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{ zIndex: 5, opacity: 0.15 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="90"
          fontWeight="700"
          fill="#94a3b8"
          fontFamily="inherit"
        >
          {digit}
        </text>
      </svg>
    </div>
  );
}
