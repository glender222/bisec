// Wrapper de Desmos para graficar f(x), líneas x=a, x=b y punto raíz

let calc = null;
const IDS = { f: 'fx', lineA: 'lineA', lineB: 'lineB', x0: 'x0', y0: 'y0', root: 'root' };

export function initPlot(elemId = 'calculator') {
  const elt = document.getElementById(elemId);
  if (!window.Desmos) throw new Error('Dependency Desmos not loaded');
  calc = Desmos.GraphingCalculator(elt, {
    expressions: false,
    settingsMenu: false,
    zoomButtons: true,
    expressionsTopbar: false,
    keypad: false
  });
}

export function setFunctionLatex(exprInput) {
  if (!calc) throw new Error('Plot not initialized');
  calc.setExpression({ id: IDS.f, latex: `f(x)=${exprInput}` });
}

export function setBoundsFromFn(xmin, xmax, f) {
  if (!calc) throw new Error('Plot not initialized');
  const N = 300; const dx = (xmax - xmin) / (N - 1);
  let ymin = +Infinity, ymax = -Infinity;
  for (let i = 0; i < N; i++) {
    const x = xmin + i * dx; const y = f(x);
    if (Number.isFinite(y)) { if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
  }
  if (!Number.isFinite(ymin) || !Number.isFinite(ymax) || ymin === ymax) { ymin = -1; ymax = 1; }
  const pad = 0.1 * (ymax - ymin || 2);
  calc.setMathBounds({ left: xmin, right: xmax, bottom: ymin - pad, top: ymax + pad });
}

export function setIntervalLines(a, b) {
  if (!calc) throw new Error('Plot not initialized');
  if (a != null && a !== '') calc.setExpression({ id: IDS.lineA, latex: `x=${a}` }); else calc.removeExpression({ id: IDS.lineA });
  if (b != null && b !== '') calc.setExpression({ id: IDS.lineB, latex: `x=${b}` }); else calc.removeExpression({ id: IDS.lineB });
}

export function drawRootPoint(x) {
  if (!calc) throw new Error('Plot not initialized');
  if (!Number.isFinite(x)) { clearRootPoint(); return; }
  calc.setExpression({ id: IDS.x0, latex: `x_0=${x}` });
  calc.setExpression({ id: IDS.y0, latex: `y_0=f(x_0)` });
  calc.setExpression({ id: IDS.root, latex: `(x_0,y_0)`, color: Desmos.Colors.GREEN });
}

export function clearRootPoint(){ if (calc) calc.removeExpression({ id: IDS.root }); }
