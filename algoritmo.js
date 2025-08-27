// ===== Utilidades =====
const $ = s => document.querySelector(s);
const fmt = (x, d=6) => Number.isFinite(x) ? Number.parseFloat(x).toFixed(d) : 'NaN';

// Normaliza la expresión del usuario para parser y para Desmos
function normalizeExprInput(s) {
  let e = String(s).trim();
  // aceptar ** como potencia y convertir a ^
  e = e.replace(/\*\*/g, '^');
  // soportar ln como log (natural)
  e = e.replace(/\bln\s*\(/gi, 'log(');
  return e;
}

// Parser numérico (expr-eval)
function makeFn(exprInput) {
  const expr = normalizeExprInput(exprInput);
  try {
    const Parser = exprEval.Parser;
    const node = new Parser({
      operators: { // habilitamos potencia ^
        add: true, subtract: true, multiply: true, divide: true, power: true, factorial: false
      }
    }).parse(expr);
    return node.toJSFunction('x');
  } catch (e) {
    throw new Error('No se pudo parsear f(x). Revisa la sintaxis.');
  }
}

// ===== Desmos =====
const elt = document.getElementById('calculator');
const calc = Desmos.GraphingCalculator(elt, {
  expressions: false,
  settingsMenu: false,
  zoomButtons: true,
  expressionsTopbar: false,
  keypad: false
});

// guarda ids para actualizar sin duplicar
const IDS = { f: 'fx', lineA: 'lineA', lineB: 'lineB', x0: 'x0', y0: 'y0', rootPoint: 'root' };

function updateBounds(xmin, xmax, f) {
  // estimamos y en unos puntos para fijar bounds razonables
  const N = 200;
  const dx = (xmax - xmin) / (N - 1);
  let ymin = +Infinity, ymax = -Infinity;
  for (let i=0;i<N;i++){
    const x = xmin + i*dx;
    const y = f(x);
    if (Number.isFinite(y)) {
      if (y < ymin) ymin = y;
      if (y > ymax) ymax = y;
    }
  }
  if (!Number.isFinite(ymin) || !Number.isFinite(ymax) || ymin === ymax) { ymin = -1; ymax = 1; }
  const pad = 0.1*(ymax - ymin || 2);
  calc.setMathBounds({ left: xmin, right: xmax, bottom: ymin - pad, top: ymax + pad });
}

// Dibuja f(x) en Desmos (tal cual el usuario la escribió, ya normalizada)
function drawFunctionDesmos(exprInput) {
  const ascii = normalizeExprInput(exprInput); // Desmos entiende ^, sin/cos/log, pi, e
  calc.setExpression({ id: IDS.f, latex: `f(x)= ${ascii}` });
}

// Marca líneas x=a y x=b
function drawIntervalLines(a, b) {
  if (a != null && a !== '') calc.setExpression({ id: IDS.lineA, latex: `x=${a}` });
  else calc.removeExpression({ id: IDS.lineA });
  if (b != null && b !== '') calc.setExpression({ id: IDS.lineB, latex: `x=${b}` });
  else calc.removeExpression({ id: IDS.lineB });
}

// Dibuja un punto en (x0, f(x0))
function drawRootPoint(x0) {
  if (!Number.isFinite(x0)) { calc.removeExpression({id: IDS.rootPoint}); return; }
  calc.setExpression({ id: IDS.x0, latex: `x_0=${x0}` });
  calc.setExpression({ id: IDS.y0, latex: `y_0=f(x_0)` });
  calc.setExpression({ id: IDS.rootPoint, latex: `(x_0, y_0)`, color: Desmos.Colors.GREEN });
}

// ===== Métodos numéricos =====
function bisection(f, a, b, errTargetPct = 0.01, maxIt = 100) {
  let fa = f(a), fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) throw new Error('f(a) o f(b) no es finito.');
  if (fa * fb > 0) throw new Error('El intervalo no cambia de signo (f(a)*f(b) > 0).');

  const rows = [];
  let m = (a + b) / 2, fm = f(m), prev = NaN, errPct = Infinity;
  for (let k = 1; k <= maxIt; k++) {
    m = (a + b) / 2; fm = f(m);
    if (!Number.isFinite(fm)) throw new Error('f(m) no es finito.');
    if (k > 1) errPct = Math.abs(m - prev) / Math.max(1, Math.abs(m)) * 100;
    rows.push({ k, a, b, x: m, fx: fm, errPct });
    if (errPct <= errTargetPct || Math.abs(fm) === 0) return { root: m, fx: fm, iter: k, table: rows, a, b, tolReached: true };
    if (f(a) * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    prev = m;
  }
  return { root: m, fx: fm, iter: maxIt, table: rows, a, b, tolReached: false };
}

function falsePosition(f, a, b, errTargetPct = 0.01, maxIt = 100) {
  let fa = f(a), fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) throw new Error('f(a) o f(b) no es finito.');
  if (fa * fb > 0) throw new Error('El intervalo no cambia de signo (f(a)*f(b) > 0).');

  const rows = [];
  let xr = a, fxr = f(xr), prev = NaN, errPct = Infinity;
  for (let k = 1; k <= maxIt; k++) {
    xr = (a * fb - b * fa) / (fb - fa);
    fxr = f(xr);
    if (!Number.isFinite(fxr)) throw new Error('f(xr) no es finito.');
    if (k > 1) errPct = Math.abs(xr - prev) / Math.max(1, Math.abs(xr)) * 100;
    rows.push({ k, a, b, x: xr, fx: fxr, errPct });
    if (errPct <= errTargetPct || Math.abs(fxr) === 0) return { root: xr, fx: fxr, iter: k, table: rows, a, b, tolReached: true };
    if (fa * fxr < 0) { b = xr; fb = fxr; } else { a = xr; fa = fxr; }
    prev = xr;
  }
  return { root: xr, fx: fxr, iter: maxIt, table: rows, a, b, tolReached: false };
}

// ===== UI / Eventos =====
function runPlot() {
  try {
    const expr = $('#expr').value;
    const fn = makeFn(expr);
    const xmin = Number($('#xmin').value), xmax = Number($('#xmax').value);
    if (!Number.isFinite(xmin) || !Number.isFinite(xmax) || xmin === xmax) throw new Error('Rango inválido.');
    drawFunctionDesmos(expr);
    updateBounds(Math.min(xmin, xmax), Math.max(xmin, xmax), fn);

    const a = $('#a').value !== '' ? Number($('#a').value) : null;
    const b = $('#b').value !== '' ? Number($('#b').value) : null;
    drawIntervalLines(a, b);
    drawRootPoint(NaN); // limpiar root
    $('#status').textContent = '';
  } catch (err) {
    $('#status').innerHTML = `<span class="bad">${err.message || err}</span>`;
  }
}

function getInterval() {
  let a = Number($('#a').value), b = Number($('#b').value);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Ingresa a y b.');
  if (a === b) throw new Error('a y b no pueden ser iguales.');
  if (a > b) [a, b] = [b, a];
  drawIntervalLines(a, b);
  return { a, b };
}

function showResults(methodName, res) {
  drawRootPoint(res.root);
  const summary = [
    `Método: <strong>${methodName}</strong>`,
    `Intervalo: [${fmt(res.a)}, ${fmt(res.b)}]`,
    `Raíz ≈ <strong>${fmt(res.root)}</strong>`,
    `f(raíz) ≈ <strong>${fmt(res.fx)}</strong>`,
    `Iteraciones: <strong>${res.iter}</strong>`,
    res.tolReached ? `<span class="ok">Convergió por % de error</span>` : `<span class="bad">Máx. iteraciones alcanzado</span>`
  ].join(' · ');
  $('#resultsSummary').innerHTML = summary;

  let html = '<table><thead><tr><th>k</th><th>a</th><th>b</th><th>x</th><th>f(x)</th><th>error %</th></tr></thead><tbody>';
  res.table.forEach(r => {
    html += `<tr><td>${r.k}</td><td>${fmt(r.a)}</td><td>${fmt(r.b)}</td><td>${fmt(r.x)}</td><td>${fmt(r.fx)}</td><td>${Number.isFinite(r.errPct) ? r.errPct.toFixed(6) : '—'}</td></tr>`;
  });
  html += '</tbody></table>';
  $('#resultsTable').innerHTML = html;
}

function runBisection() {
  try {
    const expr = $('#expr').value; const fn = makeFn(expr);
    const { a, b } = getInterval();
    const errpct = Number($('#errpct').value); const maxit = Number($('#maxit').value);
    const res = bisection(fn, a, b, errpct, maxit);
    $('#status').textContent = '';
    showResults('Bisección', res);
  } catch (err) {
    $('#status').innerHTML = `<span class="bad">${err.message || err}</span>`;
  }
}

function runFalse() {
  try {
    const expr = $('#expr').value; const fn = makeFn(expr);
    const { a, b } = getInterval();
    const errpct = Number($('#errpct').value); const maxit = Number($('#maxit').value);
    const res = falsePosition(fn, a, b, errpct, maxit);
    $('#status').textContent = '';
    showResults('Falsa Posición', res);
  } catch (err) {
    $('#status').innerHTML = `<span class="bad">${err.message || err}</span>`;
  }
}

// Bindings
window.addEventListener('load', runPlot);
$('#btnPlot').addEventListener('click', runPlot);
$('#btnBisec').addEventListener('click', runBisection);
$('#btnFalsa').addEventListener('click', runFalse);
// Enter para re-graficar
['expr','xmin','xmax','a','b','errpct','maxit'].forEach(id=>{
  const el = document.getElementById(id);
  el.addEventListener('keydown', e => { if (e.key === 'Enter') runPlot(); });
});
