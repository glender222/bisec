// Convierte la ecuación ingresada a una función numérica f(x) usando expr-eval (global window.exprEval)

export function normalizeExprInput(s) {
  let e = String(s || '').trim();

  // Normalizaciones de caracteres
  e = e
    .replace(/[−–—]/g, '-')   // menos Unicode → '-'
    .replace(/×|·/g, '*')     // multiplicación → '*'
    .replace(/\bX\b/g, 'x')   // X aislada → x
    .replace(/\bsen\s*\(/gi, 'sin(') // "sen(" → "sin("
    .replace(/(\d),(?=\d)/g, '$1.')  // coma decimal → punto
    .replace(/\*\*/g, '^');         // permitir ** como potencia → ^ (expr-eval)

  // Multiplicación implícita básica
  e = e
    .replace(/(\d(?:\.\d+)?)\s*(x)\b/gi, '$1*$2')     // 2x → 2*x
    .replace(/\b(x)\s*(\d(?:\.\d+)?)/gi, '$1*$2')     // x2 → x*2
    .replace(/(\d(?:\.\d+)?)\s*(pi|e)\b/gi, '$1*$2')  // 2pi → 2*pi
    .replace(/\b(pi|e)\s*(x|\()/gi, '$1*$2')          // pi x → pi*x, pi( → pi*(
    .replace(/(\d(?:\.\d+)?|\))\s*(\()/g, '$1*$2')    // 2( o )( → 2*( / )*(
    .replace(/(\))\s*(x|\()/g, '$1*$2');              // )x → )*x, )( → )*(

  return e;
}


export function makeFn(exprInput) {
  if (!window.exprEval || !window.exprEval.Parser) {
    throw new Error('Dependency expr-eval not loaded');
  }
  const Parser = window.exprEval.Parser;
  const expr = normalizeExprInput(exprInput);
  try {
    const node = new Parser({
      operators: { add: true, subtract: true, multiply: true, divide: true, power: true, factorial: false }
    }).parse(expr);
    return node.toJSFunction('x');
  } catch (e) {
    throw new Error('No se pudo parsear f(x). Revisa la sintaxis.');
  }
}
