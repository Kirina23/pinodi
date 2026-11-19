// Web stand only: Linux Chromium has neither San Francisco nor Georgia, so the stand
// loads look-alikes (Inter for SF, PT Serif for Georgia) from /fonts if the stand script copied them there.
export function loadWebFonts() {
  if (typeof document === 'undefined' || document.getElementById('snapdo-fonts')) return;
  const style = document.createElement('style');
  style.id = 'snapdo-fonts';
  style.textContent = [
    "@font-face{font-family:Inter;font-weight:400;src:url(fonts/inter-latin-400.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
    "@font-face{font-family:Inter;font-weight:400;src:url(fonts/inter-cyrillic-400.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}",
    "@font-face{font-family:Inter;font-weight:500;src:url(fonts/inter-latin-500.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
    "@font-face{font-family:Inter;font-weight:500;src:url(fonts/inter-cyrillic-500.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}",
    "@font-face{font-family:Inter;font-weight:600;src:url(fonts/inter-latin-600.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
    "@font-face{font-family:Inter;font-weight:600;src:url(fonts/inter-cyrillic-600.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}",
    "@font-face{font-family:Inter;font-weight:700;src:url(fonts/inter-latin-700.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
    "@font-face{font-family:Inter;font-weight:700;src:url(fonts/inter-cyrillic-700.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}",
    "@font-face{font-family:Georgia;font-weight:400;src:url(fonts/serif-latin-400.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
    "@font-face{font-family:Georgia;font-weight:400;src:url(fonts/serif-cyrillic-400.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}",
    // Text cards: the real Avenir Next if this computer has it (Mac, iPhone), else Nunito Sans.
    "@font-face{font-family:SnapdoAvenir;font-weight:600;src:local('Avenir Next Demi Bold'),local('AvenirNext-DemiBold'),url(fonts/avenir-latin-600.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}",
    "@font-face{font-family:SnapdoAvenir;font-weight:600;src:local('Avenir Next Demi Bold'),local('AvenirNext-DemiBold'),url(fonts/avenir-cyrillic-600.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}",
    'html,body{background:#f7f6f2}',
  ].join('\n');
  document.head.appendChild(style);
}
