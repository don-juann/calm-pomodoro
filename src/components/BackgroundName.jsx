// Calm, layered watercolour waves — soft pastel bands that drift very slowly,
// like a quiet presence breathing nearby. Each layer moves a touch differently.
const LAYERS = [
  { d: 'M0 120 C 300 90 520 150 760 120 C 1010 88 1230 150 1440 110 V1024 H0 Z', fill: '#ead7cb', tx: 8, ty: -5, dur: 19, delay: 0 },
  { d: 'M0 255 C 280 220 540 290 800 255 C 1060 222 1250 295 1440 250 V1024 H0 Z', fill: '#dcdbc6', tx: -10, ty: 6, dur: 23, delay: -3 },
  { d: 'M0 395 C 320 360 560 430 820 398 C 1080 366 1250 430 1440 392 V1024 H0 Z', fill: '#bcd0c4', tx: 7, ty: -7, dur: 21, delay: -6 },
  { d: 'M0 540 C 300 500 520 580 780 545 C 1050 508 1240 585 1440 540 V1024 H0 Z', fill: '#93b8b4', tx: -9, ty: 5, dur: 26, delay: -2 },
  { d: 'M0 685 C 320 648 560 728 820 690 C 1080 652 1250 725 1440 686 V1024 H0 Z', fill: '#7ba8a6', tx: 11, ty: -6, dur: 24, delay: -8 },
  { d: 'M0 820 C 300 786 540 868 800 826 C 1060 788 1250 862 1440 822 V1024 H0 Z', fill: '#a9c5bd', tx: -8, ty: 7, dur: 22, delay: -4 },
  { d: 'M0 930 C 300 902 540 968 800 934 C 1060 902 1250 962 1440 930 V1024 H0 Z', fill: '#e7cabb', tx: 9, ty: -5, dur: 20, delay: -1 },
]

export default function BackgroundName() {
  return (
    <svg
      className="bg-waves"
      viewBox="0 0 1440 1024"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      {/* base wash */}
      <rect x="0" y="0" width="1440" height="1024" fill="#f1e3d7" />
      <g filter="url(#soft)">
        {LAYERS.map((layer, i) => (
          <path
            key={i}
            className="wave"
            d={layer.d}
            fill={layer.fill}
            fillOpacity="0.85"
            style={{
              '--tx': `${layer.tx}px`,
              '--ty': `${layer.ty}px`,
              animationDuration: `${layer.dur}s`,
              animationDelay: `${layer.delay}s`,
            }}
          />
        ))}
      </g>
    </svg>
  )
}
