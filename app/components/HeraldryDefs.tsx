export default function HeraldryDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <g id="ermineSpot">
          <path d="M0 4 C -1 14 -6 18 -10 34 C -5 30 -2 30 0 30 C 2 30 5 30 10 34 C 6 18 1 14 0 4 Z" />
          <circle cx="0" cy="-6" r="2.4" />
          <circle cx="-7" cy="2" r="2.4" />
          <circle cx="7" cy="2" r="2.4" />
        </g>
        <pattern id="ermineNavy" width="46" height="60" patternUnits="userSpaceOnUse">
          <g fill="#1c3f94">
            <use href="#ermineSpot" transform="translate(12,9)" />
            <use href="#ermineSpot" transform="translate(35,39)" />
          </g>
        </pattern>
        <pattern id="lozengeStripe" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill="#1c3f94" />
          <path d="M11 1 L21 11 L11 21 L1 11 Z" fill="#efb700" />
        </pattern>
        <pattern id="dancettyGold" width="28" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 6 L14 2 L28 6" fill="none" stroke="#efb700" strokeWidth="2" />
        </pattern>
        <pattern id="dancettyRed" width="28" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 6 L14 2 L28 6" fill="none" stroke="#b01225" strokeWidth="2" />
        </pattern>
      </defs>
    </svg>
  );
}
