export default function AnatomyFigure() {
  return (
    <svg className="anatomy-svg" viewBox="0 0 380 760" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx=".5" cy=".5" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0a585" />
          <stop offset=".4" stopColor="#c4684a" />
          <stop offset="1" stopColor="#6b2c1a" />
        </linearGradient>
        <linearGradient id="mGradL" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0a585" />
          <stop offset=".4" stopColor="#c4684a" />
          <stop offset="1" stopColor="#6b2c1a" />
        </linearGradient>
        <radialGradient id="hd" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#f6cfb5" />
          <stop offset=".6" stopColor="#c08566" />
          <stop offset="1" stopColor="#6b3a25" />
        </radialGradient>
        <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8b59b" />
          <stop offset="1" stopColor="#9b6044" />
        </linearGradient>
        <filter id="blur1"><feGaussianBlur stdDeviation=".6" /></filter>
      </defs>

      <ellipse cx="190" cy="380" rx="170" ry="360" fill="url(#bg)" />

      <g filter="url(#blur1)">
        <ellipse cx="190" cy="68" rx="38" ry="46" fill="url(#hd)" />
        <path d="M158 50 q12 -16 32 -16 q20 0 32 16 q4 18 -2 36 l-60 0 q-6 -18 -2 -36z" fill="#a85234" opacity=".55" />
        <ellipse cx="176" cy="65" rx="6" ry="4" fill="#3a1810" opacity=".7" />
        <ellipse cx="204" cy="65" rx="6" ry="4" fill="#3a1810" opacity=".7" />
        <path d="M188 72 q4 8 4 14 q-4 4 -8 0 q0 -8 4 -14z" fill="#7c3a26" opacity=".7" />
        <path d="M174 92 q16 8 32 0 q-2 10 -16 12 q-14 -2 -16 -12z" fill="#5a2818" opacity=".75" />
        <path d="M156 80 q4 22 16 30 q18 6 36 0 q12 -8 16 -30 q-4 14 -16 22 q-18 6 -36 0 q-12 -8 -16 -22z" fill="#7c3a26" opacity=".4" />

        <path d="M170 108 l-6 24 q26 12 52 0 l-6 -24 q-20 8 -40 0z" fill="url(#sk)" />
        <path d="M174 116 q16 6 32 0 l-2 14 q-14 6 -28 0z" fill="#7c3a26" opacity=".55" />

        <path d="M120 140 q70 -22 140 0 q10 16 6 30 q-76 -20 -152 0 q-4 -14 6 -30z" fill="url(#mGrad)" />
        <path d="M155 144 q35 -12 70 0 q3 8 0 16 q-35 -10 -70 0 q-3 -8 0 -16z" fill="#5a2818" opacity=".5" />
        <path d="M148 158 q42 -8 84 0" stroke="#3a1810" strokeWidth="1.5" fill="none" opacity=".5" />

        <path d="M108 158 q-4 18 0 36 q14 6 24 -2 q4 -18 -2 -36 q-12 -6 -22 2z" fill="url(#mGrad)" />
        <path d="M272 158 q4 18 0 36 q-14 6 -24 -2 q-4 -18 2 -36 q12 -6 22 2z" fill="url(#mGradL)" />
        <path d="M114 168 q8 -2 14 4 q-2 12 -8 18 q-8 -8 -6 -22z" fill="#5a2818" opacity=".4" />
        <path d="M266 168 q-8 -2 -14 4 q2 12 8 18 q8 -8 6 -22z" fill="#5a2818" opacity=".4" />

        <path d="M132 168 q26 -8 56 0 q4 28 -10 50 q-26 6 -42 -10 q-10 -18 -4 -40z" fill="url(#mGrad)" />
        <path d="M248 168 q-26 -8 -56 0 q-4 28 10 50 q26 6 42 -10 q10 -18 4 -40z" fill="url(#mGradL)" />
        <g stroke="#5a2818" strokeWidth=".8" fill="none" opacity=".5">
          <path d="M138 184 q22 -4 42 6" />
          <path d="M142 196 q20 -2 38 8" />
          <path d="M146 208 q16 -2 32 8" />
          <path d="M242 184 q-22 -4 -42 6" />
          <path d="M238 196 q-20 -2 -38 8" />
          <path d="M234 208 q-16 -2 -32 8" />
        </g>
        <path d="M190 168 l0 50" stroke="#3a1810" strokeWidth="2" fill="none" opacity=".7" />
        <ellipse cx="190" cy="172" rx="3" ry="4" fill="#3a1810" opacity=".5" />

        <path d="M104 196 q-8 36 -2 70 q14 6 26 -2 q4 -34 -4 -66 q-12 -8 -20 -2z" fill="url(#mGrad)" />
        <path d="M276 196 q8 36 2 70 q-14 6 -26 -2 q-4 -34 4 -66 q12 -8 20 -2z" fill="url(#mGradL)" />
        <ellipse cx="116" cy="222" rx="8" ry="22" fill="#a85234" opacity=".6" />
        <ellipse cx="264" cy="222" rx="8" ry="22" fill="#a85234" opacity=".6" />

        <path d="M100 266 q-12 38 -8 76 q14 4 24 -2 q6 -38 -2 -74 q-8 -4 -14 0z" fill="url(#mGrad)" />
        <path d="M280 266 q12 38 8 76 q-14 4 -24 -2 q-6 -38 2 -74 q8 -4 14 0z" fill="url(#mGradL)" />

        <ellipse cx="106" cy="354" rx="12" ry="16" fill="url(#sk)" />
        <ellipse cx="274" cy="354" rx="12" ry="16" fill="url(#sk)" />

        <path d="M150 218 q40 -8 80 0 l-4 134 q-36 10 -72 0z" fill="url(#mGrad)" />
        <g fill="#a85234" opacity=".75">
          <rect x="156" y="226" width="22" height="20" rx="3" />
          <rect x="182" y="226" width="22" height="20" rx="3" />
          <rect x="156" y="252" width="22" height="22" rx="3" />
          <rect x="182" y="252" width="22" height="22" rx="3" />
          <rect x="158" y="280" width="20" height="22" rx="3" />
          <rect x="182" y="280" width="20" height="22" rx="3" />
          <rect x="160" y="308" width="18" height="20" rx="3" />
          <rect x="182" y="308" width="18" height="20" rx="3" />
        </g>
        <path d="M190 220 l0 130" stroke="#3a1810" strokeWidth="1.5" fill="none" opacity=".7" />

        <path d="M148 224 q-10 50 -2 124 q-12 4 -16 -4 q-2 -64 6 -118 q4 -6 12 -2z" fill="#a85234" opacity=".7" />
        <path d="M232 224 q10 50 2 124 q12 4 16 -4 q2 -64 -6 -118 q-4 -6 -12 -2z" fill="#a85234" opacity=".7" />

        <path d="M146 350 q44 14 88 0 q4 18 -4 36 q-40 14 -80 0 q-8 -18 -4 -36z" fill="url(#mGrad)" />
        <path d="M158 360 q32 8 64 0 l-12 22 q-20 6 -40 0z" fill="#5a2818" opacity=".55" />

        <path d="M150 384 q-10 70 -4 134 q18 8 32 -2 q6 -64 0 -130 q-14 -10 -28 -2z" fill="url(#mGrad)" />
        <path d="M230 384 q10 70 4 134 q-18 8 -32 -2 q-6 -64 0 -130 q14 -10 28 -2z" fill="url(#mGradL)" />
        <ellipse cx="174" cy="500" rx="10" ry="22" fill="#a85234" opacity=".7" />
        <ellipse cx="206" cy="500" rx="10" ry="22" fill="#a85234" opacity=".7" />

        <ellipse cx="166" cy="528" rx="14" ry="12" fill="url(#sk)" />
        <ellipse cx="214" cy="528" rx="14" ry="12" fill="url(#sk)" />

        <path d="M154 540 q-6 60 0 116 q14 4 24 -2 q2 -58 -4 -114 q-10 -4 -20 0z" fill="url(#mGrad)" />
        <path d="M226 540 q6 60 0 116 q-14 4 -24 -2 q-2 -58 4 -114 q10 -4 20 0z" fill="url(#mGradL)" />

        <path d="M160 640 q12 4 22 0 l-2 16 q-9 4 -18 0z" fill="#7c3a26" />
        <path d="M220 640 q-12 4 -22 0 l2 16 q9 4 18 0z" fill="#7c3a26" />

        <path d="M150 656 q-4 16 0 28 q14 6 28 -2 q4 -16 -2 -26 q-12 -4 -26 0z" fill="url(#sk)" />
        <path d="M210 656 q4 16 0 28 q-14 6 -28 -2 q-4 -16 2 -26 q12 -4 26 0z" fill="url(#sk)" />
      </g>
    </svg>
  );
}
