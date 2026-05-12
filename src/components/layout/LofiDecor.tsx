"use client";

// ─── Sidebar: thin climbing vine on the far-left margin ───────────────────────
// Stays in the first 14px (left padding zone), never crossing icons or text.
// White/cream on pink — visible but not dominant.

export function SidebarEdgeVine() {
  return (
    <svg
      viewBox="0 0 16 900"
      width="16"
      height="900"
      className="absolute left-0 top-0 pointer-events-none select-none"
      aria-hidden="true"
      opacity="0.28"
    >
      <path
        d="M7,0 C9,55 5,110 8,170 C11,230 6,285 9,345 C12,405 7,460 9,520 C11,575 7,630 8,690 C9,745 6,800 8,900"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* small leaves pointing inward */}
      <g transform="translate(8,75) rotate(82)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
      <g transform="translate(8,160) rotate(78)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
      <g transform="translate(8,255) rotate(84)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
      <g transform="translate(8,350) rotate(80)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
      <g transform="translate(8,445) rotate(76)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
      <g transform="translate(8,540) rotate(82)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
      <g transform="translate(8,640) rotate(78)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
      <g transform="translate(8,740) rotate(80)">
        <path d="M0,0 C-3,5 -2,11 0,15 C2,11 3,5 0,0 Z" fill="rgba(255,255,255,0.9)"/>
      </g>
    </svg>
  );
}

// ─── Content: soft botanical background overlay ────────────────────────────────
// Sits behind all cards (cards have white backgrounds that cover it).
// Visible only in the background margins — a premium watermark effect.
// Warm cream tone to match the light background.

export function ContentVineBackground() {
  const leaf = (x: number, y: number, rot: number, scale = 1) => (
    <g key={`${x}-${y}`} transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
      <path d="M0,0 C-6,9 -5,20 0,27 C5,20 6,9 0,0 Z" fill="#9A8D7C"/>
      <line x1="0" y1="1" x2="0" y2="25" stroke="#9A8D7C" strokeWidth="0.6" opacity="0.6"/>
    </g>
  );

  const smallLeaf = (x: number, y: number, rot: number) => (
    <g key={`s${x}-${y}`} transform={`translate(${x},${y}) rotate(${rot})`}>
      <path d="M0,0 C-4,6 -3,13 0,17 C3,13 4,6 0,0 Z" fill="#9A8D7C"/>
    </g>
  );

  return (
    <svg
      viewBox="0 0 1400 900"
      width="100%"
      height="900"
      preserveAspectRatio="xMidYMin meet"
      className="absolute top-0 left-0 pointer-events-none select-none"
      aria-hidden="true"
      opacity="0.17"
    >
      {/* ── Top garland vine ── */}
      <path
        d="M0,55 C80,42 160,62 260,50 C360,38 440,64 540,52 C640,40 720,66 820,54 C920,42 1000,68 1100,56 C1200,44 1300,62 1400,50"
        stroke="#8A7D6C"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      {/* secondary stem */}
      <path
        d="M0,62 C100,72 200,56 320,66 C440,76 520,60 640,70 C760,80 840,64 960,74 C1060,82 1160,68 1280,76"
        stroke="#8A7D6C"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* hanging stems from top vine */}
      <path d="M200,52 C202,65 198,78 204,92" stroke="#8A7D6C" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      <path d="M460,54 C463,68 460,82 466,98" stroke="#8A7D6C" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      <path d="M700,56 C703,70 700,84 706,100" stroke="#8A7D6C" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      <path d="M950,55 C953,68 950,80 956,95" stroke="#8A7D6C" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      <path d="M1200,52 C1203,65 1200,78 1206,92" stroke="#8A7D6C" strokeWidth="0.8" fill="none" strokeLinecap="round"/>

      {/* large leaves along top vine */}
      {leaf(100, 50, -18, 1.1)}
      {leaf(204, 92, 15, 1.0)}
      {leaf(310, 46, 22, 1.2)}
      {leaf(466, 98, -12, 1.0)}
      {leaf(570, 52, -25, 1.1)}
      {leaf(706, 100, 18, 1.0)}
      {leaf(800, 48, -20, 1.15)}
      {leaf(956, 95, 10, 1.0)}
      {leaf(1060, 54, -22, 1.1)}
      {leaf(1206, 92, 16, 1.05)}
      {leaf(1340, 50, -15, 1.0)}

      {/* ── Scattered background leaves ── */}
      {/* upper zone */}
      {smallLeaf(60, 120, 35)}
      {smallLeaf(85, 138, -20)}
      {smallLeaf(380, 140, -30)}
      {smallLeaf(405, 158, 15)}
      {smallLeaf(650, 130, 25)}
      {smallLeaf(675, 148, -18)}
      {smallLeaf(900, 135, -35)}
      {smallLeaf(920, 152, 12)}
      {smallLeaf(1150, 128, 28)}
      {smallLeaf(1170, 145, -22)}
      {smallLeaf(1360, 140, -10)}

      {/* mid zone */}
      {smallLeaf(40, 280, 40)}
      {smallLeaf(68, 298, -15)}
      {smallLeaf(200, 310, -28)}
      {smallLeaf(500, 295, 22)}
      {smallLeaf(520, 312, -18)}
      {smallLeaf(760, 300, -32)}
      {smallLeaf(780, 318, 14)}
      {smallLeaf(1020, 290, 25)}
      {smallLeaf(1040, 308, -20)}
      {smallLeaf(1300, 285, -15)}
      {smallLeaf(1320, 302, 28)}
      {smallLeaf(1380, 295, -8)}

      {/* lower mid zone */}
      {smallLeaf(30, 440, -25)}
      {smallLeaf(55, 458, 18)}
      {smallLeaf(280, 450, 30)}
      {smallLeaf(300, 468, -12)}
      {smallLeaf(580, 440, -22)}
      {smallLeaf(600, 455, 16)}
      {smallLeaf(840, 448, 28)}
      {smallLeaf(858, 462, -18)}
      {smallLeaf(1100, 438, -30)}
      {smallLeaf(1118, 455, 15)}
      {smallLeaf(1360, 445, 22)}

      {/* lower zone */}
      {smallLeaf(45, 600, 35)}
      {smallLeaf(320, 615, -20)}
      {smallLeaf(620, 605, 25)}
      {smallLeaf(640, 622, -15)}
      {smallLeaf(880, 598, -28)}
      {smallLeaf(900, 614, 18)}
      {smallLeaf(1160, 608, 30)}
      {smallLeaf(1180, 625, -12)}
      {smallLeaf(1370, 600, -20)}

      {/* ── Right-edge vine strip ── */}
      <path
        d="M1370,160 C1362,210 1368,260 1360,310 C1352,360 1366,410 1358,460 C1350,510 1364,560 1356,610"
        stroke="#8A7D6C"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {smallLeaf(1360, 210, -70)}
      {smallLeaf(1355, 310, -75)}
      {smallLeaf(1360, 410, -68)}
      {smallLeaf(1356, 510, -72)}

      {/* ── Bottom-right corner curl ── */}
      <path
        d="M1400,820 C1375,805 1355,790 1335,770 C1315,750 1305,728 1285,715"
        stroke="#8A7D6C"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M1400,850 C1370,838 1348,822 1325,808 C1302,794 1286,775 1265,762"
        stroke="#8A7D6C"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* tendril */}
      <path d="M1287,716 C1280,708 1282,700 1288,702 C1294,704 1292,712 1286,710"
        stroke="#8A7D6C" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7"/>
      {smallLeaf(1335, 770, -42)}
      {smallLeaf(1300, 730, -55)}
      {smallLeaf(1325, 808, -38)}
      {smallLeaf(1288, 775, -50)}
    </svg>
  );
}
