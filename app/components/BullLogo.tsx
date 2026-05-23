'use client';

/**
 * BullLogo — Birmingham bull head mark.
 *
 * Props:
 *   size      — pixel dimension (default 120). SVG scales perfectly at any size.
 *   color     — fill colour (default 'currentColor' so it inherits from CSS)
 *   className — passthrough for Tailwind / CSS classes
 *
 * Usage examples:
 *   <BullLogo />                          dark bull, inherits text colour
 *   <BullLogo size={200} />               larger
 *   <BullLogo color="#f5f3ee" />          paper-coloured bull on dark bg
 *   <BullLogo color="var(--ink)" />       explicit ink colour
 */

interface BullLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function BullLogo({ size = 120, color = 'currentColor', className }: BullLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill={color}
      className={className}
      aria-label="Birmingham bull"
      role="img"
    >
      {/* Left horn — outer sweep */}
      <path d="M 98 42 C 85 38 68 28 52 14 C 38 2 22 -2 14 8 C 8 15 12 28 22 36 C 32 44 46 46 58 48 C 68 50 80 50 90 52 Z" />
      {/* Left horn — inner detail line */}
      <path d="M 90 54 C 78 52 64 50 52 44 C 40 38 28 32 22 38 C 30 40 40 44 52 50 C 62 54 76 56 88 58 Z" />

      {/* Right horn — outer sweep */}
      <path d="M 102 42 C 115 38 132 28 148 14 C 162 2 178 -2 186 8 C 192 15 188 28 178 36 C 168 44 154 46 142 48 C 132 50 120 50 110 52 Z" />
      {/* Right horn — inner detail line */}
      <path d="M 110 54 C 122 52 136 50 148 44 C 160 38 172 32 178 38 C 170 40 160 44 148 50 C 138 54 124 56 112 58 Z" />

      {/* Main head */}
      <path d="
        M 72 58
        C 60 58 46 62 40 72
        C 34 82 36 96 40 108
        C 44 120 52 130 60 138
        C 68 146 78 152 88 156
        C 92 158 96 160 100 160
        C 104 160 108 158 112 156
        C 122 152 132 146 140 138
        C 148 130 156 120 160 108
        C 164 96 166 82 160 72
        C 154 62 140 58 128 58
        Z
      " />

      {/* Left brow ridge */}
      <path d="M 68 78 C 72 70 82 66 90 68 C 84 72 78 76 74 82 Z" fill="white" />
      {/* Right brow ridge */}
      <path d="M 132 78 C 128 70 118 66 110 68 C 116 72 122 76 126 82 Z" fill="white" />

      {/* Left eye socket / brow shadow */}
      <path d="M 62 84 C 66 76 76 72 86 74 C 92 76 96 82 94 88 C 92 94 84 98 76 96 C 68 94 60 90 62 84 Z" fill="white" />
      {/* Right eye socket / brow shadow */}
      <path d="M 138 84 C 134 76 124 72 114 74 C 108 76 104 82 106 88 C 108 94 116 98 124 96 C 132 94 140 90 138 84 Z" fill="white" />

      {/* Left pupil */}
      <ellipse cx="78" cy="86" rx="7" ry="6" />
      {/* Right pupil */}
      <ellipse cx="122" cy="86" rx="7" ry="6" />

      {/* Left eye highlight */}
      <ellipse cx="76" cy="84" rx="2.5" ry="2" fill="white" />
      {/* Right eye highlight */}
      <ellipse cx="120" cy="84" rx="2.5" ry="2" fill="white" />

      {/* Nose bridge */}
      <path d="M 94 100 C 92 108 92 118 94 128 C 96 134 100 138 100 138 C 100 138 104 134 106 128 C 108 118 108 108 106 100 Z" fill="white" />

      {/* Snout */}
      <path d="
        M 72 132
        C 72 124 80 118 100 118
        C 120 118 128 124 128 132
        C 128 142 120 150 100 152
        C 80 150 72 142 72 132 Z
      " />

      {/* Left nostril */}
      <ellipse cx="86" cy="136" rx="8" ry="6" fill="white" />
      {/* Right nostril */}
      <ellipse cx="114" cy="136" rx="8" ry="6" fill="white" />

      {/* Chin detail */}
      <path d="M 84 152 C 88 156 94 158 100 158 C 106 158 112 156 116 152 C 110 154 106 156 100 156 C 94 156 90 154 84 152 Z" fill="white" />
    </svg>
  );
}
