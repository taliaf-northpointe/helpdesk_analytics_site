"use client";

// ─── Sidebar: vertical vine along the left edge ───────────────────────────────

export function SidebarVine() {
  return (
    <svg
      viewBox="0 0 52 380"
      width="52"
      height="380"
      className="absolute left-0 top-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* main stem */}
      <path
        d="M20,0 C25,45 13,90 22,135 C31,180 16,225 24,270 C32,315 17,345 20,380"
        stroke="rgba(170,230,170,0.32)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* leaf 1 – right */}
      <ellipse cx="35" cy="42" rx="14" ry="6" fill="rgba(155,215,155,0.28)" transform="rotate(28 35 42)" />
      <line x1="22" y1="39" x2="35" y2="42" stroke="rgba(155,215,155,0.25)" strokeWidth="1.2" />

      {/* leaf 2 – left */}
      <ellipse cx="5" cy="82" rx="13" ry="5.5" fill="rgba(145,205,145,0.28)" transform="rotate(-38 5 82)" />
      <line x1="20" y1="86" x2="5" y2="82" stroke="rgba(145,205,145,0.25)" strokeWidth="1.2" />

      {/* leaf 3 – right */}
      <ellipse cx="37" cy="126" rx="14" ry="6" fill="rgba(155,215,155,0.28)" transform="rotate(22 37 126)" />
      <line x1="23" y1="123" x2="37" y2="126" stroke="rgba(155,215,155,0.25)" strokeWidth="1.2" />

      {/* leaf 4 – left */}
      <ellipse cx="4" cy="168" rx="12" ry="5" fill="rgba(145,205,145,0.28)" transform="rotate(-46 4 168)" />
      <line x1="19" y1="166" x2="4" y2="168" stroke="rgba(145,205,145,0.25)" strokeWidth="1.2" />

      {/* leaf 5 – right */}
      <ellipse cx="36" cy="210" rx="13" ry="5.5" fill="rgba(155,215,155,0.28)" transform="rotate(32 36 210)" />
      <line x1="22" y1="208" x2="36" y2="210" stroke="rgba(155,215,155,0.25)" strokeWidth="1.2" />

      {/* leaf 6 – left */}
      <ellipse cx="5" cy="252" rx="12" ry="5" fill="rgba(145,205,145,0.28)" transform="rotate(-28 5 252)" />
      <line x1="20" y1="254" x2="5" y2="252" stroke="rgba(145,205,145,0.25)" strokeWidth="1.2" />

      {/* leaf 7 – right */}
      <ellipse cx="35" cy="295" rx="13" ry="5.5" fill="rgba(155,215,155,0.28)" transform="rotate(18 35 295)" />
      <line x1="22" y1="292" x2="35" y2="295" stroke="rgba(155,215,155,0.25)" strokeWidth="1.2" />

      {/* tendrils */}
      <path d="M23,132 C40,120 46,102 38,94"  stroke="rgba(155,215,155,0.18)" strokeWidth="1.4" fill="none" />
      <path d="M21,215 C6,203 2,186 10,178"   stroke="rgba(155,215,155,0.18)" strokeWidth="1.4" fill="none" />
      <path d="M23,298 C38,287 43,270 35,263"  stroke="rgba(155,215,155,0.18)" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

// ─── Sidebar: sleeping gray cat ───────────────────────────────────────────────

export function SleepingCat() {
  return (
    <svg
      viewBox="0 0 88 62"
      width="88"
      height="62"
      className="pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* tail curling behind body */}
      <path
        d="M10,52 Q2,62 18,62 Q34,62 34,48"
        stroke="rgba(230,230,230,0.48)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {/* body */}
      <ellipse cx="28" cy="46" rx="21" ry="13" fill="rgba(228,228,228,0.28)" />
      {/* head */}
      <circle cx="56" cy="30" r="17" fill="rgba(228,228,228,0.32)" />
      {/* ear left */}
      <path d="M40,17 L37,6 L49,14 Z"  fill="rgba(228,228,228,0.32)" />
      {/* ear right */}
      <path d="M65,14 L72,4 L70,16 Z" fill="rgba(228,228,228,0.32)" />
      {/* inner ear */}
      <path d="M41,16 L39,8 L48,13 Z"  fill="rgba(255,175,195,0.38)" />
      <path d="M66,14 L71,6 L69,15 Z"  fill="rgba(255,175,195,0.38)" />
      {/* sleeping eyes ~~ */}
      <path d="M47,29 Q52,24 56,29" stroke="rgba(70,40,50,0.5)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M57,29 Q62,24 66,29" stroke="rgba(70,40,50,0.5)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* nose */}
      <path
        d="M53,34 L56,38 L59,34"
        fill="rgba(255,145,175,0.55)"
        stroke="rgba(255,125,160,0.45)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* whiskers */}
      <line x1="37" y1="34" x2="50" y2="35"  stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <line x1="37" y1="38" x2="50" y2="37"  stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <line x1="62" y1="35" x2="75" y2="34"  stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <line x1="62" y1="37" x2="75" y2="38"  stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      {/* zzz */}
      <text x="73" y="17" fill="rgba(255,255,255,0.38)" fontSize="10" fontFamily="Georgia,serif" fontStyle="italic">z</text>
      <text x="80" y="9"  fill="rgba(255,255,255,0.28)" fontSize="7"  fontFamily="Georgia,serif" fontStyle="italic">z</text>
    </svg>
  );
}

// ─── Sidebar: small bearded dragon on a vine ──────────────────────────────────

export function SidebarBeardie() {
  return (
    <svg
      viewBox="0 0 72 58"
      width="72"
      height="58"
      className="pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* vine branch it's sitting on */}
      <path
        d="M0,50 Q30,42 72,50"
        stroke="rgba(155,215,155,0.35)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* body */}
      <ellipse cx="34" cy="38" rx="20" ry="10" fill="rgba(215,180,130,0.34)" />
      {/* head */}
      <ellipse cx="53" cy="30" rx="14" ry="10" fill="rgba(215,180,130,0.36)" />
      {/* beard / chin spikes */}
      <path
        d="M40,36 L38,43 L42,37 L41,44 L45,38 L44,45 L48,38 L48,45 L52,37 L52,44 L55,36"
        fill="rgba(180,145,95,0.42)"
        stroke="rgba(180,145,95,0.3)"
        strokeWidth="0.5"
      />
      {/* eye */}
      <circle cx="57" cy="26" r="3.5" fill="rgba(255,210,130,0.7)" />
      <circle cx="57" cy="26" r="1.9" fill="rgba(45,25,8,0.62)" />
      <circle cx="57.8" cy="25.2" r="0.7" fill="rgba(255,255,255,0.75)" />
      {/* back spikes */}
      <path
        d="M16,29 L14,22 M22,26 L21,19 M28,24 L27,17 M34,23 L34,16 M40,24 L40,17 M46,25 L46,18"
        stroke="rgba(170,135,88,0.32)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* front legs */}
      <path d="M20,42 L12,50" stroke="rgba(195,160,112,0.38)" strokeWidth="4" strokeLinecap="round" />
      <path d="M28,46 L20,54" stroke="rgba(195,160,112,0.38)" strokeWidth="4" strokeLinecap="round" />
      {/* back leg */}
      <path d="M46,42 L54,50" stroke="rgba(195,160,112,0.38)" strokeWidth="4" strokeLinecap="round" />
      {/* tail */}
      <path
        d="M14,37 Q6,41 8,48"
        stroke="rgba(195,160,112,0.38)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Header: horizontal vine cluster (right side) ────────────────────────────

export function HeaderVine() {
  return (
    <svg
      viewBox="0 0 220 72"
      width="220"
      height="72"
      className="absolute right-0 bottom-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* back stem */}
      <path
        d="M220,72 Q195,48 170,60 Q145,72 118,46 Q91,20 70,36"
        stroke="#90C890"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* front stem */}
      <path
        d="M220,72 Q200,38 178,52 Q156,66 140,36"
        stroke="#80BC80"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* leaves */}
      <ellipse cx="168" cy="58" rx="12" ry="5.5" fill="#78B878" opacity="0.48" transform="rotate(-22 168 58)" />
      <ellipse cx="120" cy="44" rx="13" ry="5.5" fill="#6AAA6A" opacity="0.45" transform="rotate(28 120 44)" />
      <ellipse cx="192" cy="52" rx="11" ry="5"   fill="#78B878" opacity="0.48" transform="rotate(-12 192 52)" />
      <ellipse cx="144" cy="32" rx="10" ry="4.5" fill="#6AAA6A" opacity="0.42" transform="rotate(18 144 32)" />
      <ellipse cx="88"  cy="33" rx="10" ry="4.5" fill="#78B878" opacity="0.4"  transform="rotate(-30 88 33)"  />
      {/* tendril */}
      <path d="M170,57 C178,46 186,43 188,50" stroke="#90C890" strokeWidth="1.5" fill="none" opacity="0.35" />
      <path d="M120,43 C112,34 108,26 116,24"  stroke="#90C890" strokeWidth="1.5" fill="none" opacity="0.3"  />
    </svg>
  );
}

// ─── Header: snake peeking from the right corner ─────────────────────────────

export function HeaderSnake() {
  return (
    <svg
      viewBox="0 0 100 62"
      width="100"
      height="62"
      className="absolute right-0 bottom-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* body — s-curve coming from bottom-right */}
      <path
        d="M100,62 Q82,34 60,46 Q38,58 18,30"
        stroke="#8DC88D"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        opacity="0.72"
      />
      {/* sheen */}
      <path
        d="M100,62 Q82,34 60,46 Q38,58 18,30"
        stroke="#AEDAAE"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* head */}
      <ellipse
        cx="15" cy="27"
        rx="12" ry="8.5"
        fill="#7CBD7C"
        opacity="0.88"
        transform="rotate(-28 15 27)"
      />
      {/* eye */}
      <circle cx="11" cy="22" r="3.2" fill="#1E3A1E" opacity="0.82" />
      <circle cx="11.8" cy="21.4" r="1.1" fill="white" opacity="0.65" />
      {/* tongue */}
      <path
        d="M5,26 L-1,23 M5,26 L0,29"
        stroke="#E07070"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
