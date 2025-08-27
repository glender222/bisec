// Métodos: Bisección y Falsa Posición con % de error aproximado relativo

export function bisection(f, a, b, errTargetPct = 0.01, maxIt = 100) {
  const t0 = performance.now();
  let fa = f(a), fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) throw new Error('f(a) o f(b) no es finito.');
  if (fa * fb > 0) throw new Error('El intervalo no cambia de signo (f(a)*f(b) > 0).');

  const rows = [];
  let m = (a + b) / 2, fm = f(m), prev = NaN, errPct = Infinity;
  let iter;
  for (iter = 1; iter <= maxIt; iter++) {
    m = (a + b) / 2; fm = f(m);
    if (!Number.isFinite(fm)) throw new Error('f(m) no es finito.');
    if (iter > 1) errPct = Math.abs(m - prev) / Math.max(1, Math.abs(m)) * 100;
    rows.push({ k: iter, a, b, x: m, fx: fm, errPct });
    if (errPct <= errTargetPct || Math.abs(fm) === 0) break;
    if (f(a) * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    prev = m;
  }
  const t1 = performance.now();
  return { root: m, fx: fm, iter, table: rows, a, b, tolReached: (rows.at(-1)?.errPct ?? Infinity) <= errTargetPct, ms: t1 - t0 };
}

export function falsePosition(f, a, b, errTargetPct = 0.01, maxIt = 100) {
  const t0 = performance.now();
  let fa = f(a), fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) throw new Error('f(a) o f(b) no es finito.');
  if (fa * fb > 0) throw new Error('El intervalo no cambia de signo (f(a)*f(b) > 0).');

  const rows = [];
  let xr = a, fxr = f(xr), prev = NaN, errPct = Infinity;
  let iter;
  for (iter = 1; iter <= maxIt; iter++) {
    xr = (a * fb - b * fa) / (fb - fa);
    fxr = f(xr);
    if (!Number.isFinite(fxr)) throw new Error('f(xr) no es finito.');
    if (iter > 1) errPct = Math.abs(xr - prev) / Math.max(1, Math.abs(xr)) * 100;
    rows.push({ k: iter, a, b, x: xr, fx: fxr, errPct });
    if (errPct <= errTargetPct || Math.abs(fxr) === 0) break;
    if (fa * fxr < 0) { b = xr; fb = fxr; } else { a = xr; fa = fxr; }
    prev = xr;
  }
  const t1 = performance.now();
  return { root: xr, fx: fxr, iter, table: rows, a, b, tolReached: (rows.at(-1)?.errPct ?? Infinity) <= errTargetPct, ms: t1 - t0 };
}
