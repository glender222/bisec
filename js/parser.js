export function normalizeExprInput(s) {
  let e = String(s || '').trim();

  // Normalizaciones básicas de caracteres
  e = e
    .replace(/[−–—]/g, '-')            // menos Unicode → '-'
    .replace(/×|·/g, '*')              // multiplicación → '*'
    .replace(/\bX\b/g, 'x')            // X aislada → x
    .replace(/\bsen\s*\(/gi, 'sin(')   // sen( → sin(
    .replace(/\bln\s*\(/gi, 'log(')    // ln( → log(
    .replace(/(\d),(?=\d)/g, '$1.')    // coma decimal → punto
    .replace(/\*\*/g, '^')             
    .replace(/\bexp\s*\(/gi, 'e^(');   // exp( → e^(

  // Multiplicación implícita
  e = e
    .replace(/(\d(?:\.\d+)?)\s*(x)\b/gi, '$1*$2')      // 2x → 2*x
    .replace(/\b(x)\s*(\d(?:\.\d+)?)/gi, '$1*$2')      // x2 → x*2
    .replace(/(\d(?:\.\d+)?)\s*(pi|e)\b/gi, '$1*$2')   // 2pi → 2*pi
    .replace(/\b(pi|e)\s*(x|\()/gi, '$1*$2')           // pi x → pi*x, pi( → pi*(
    .replace(/(\d(?:\.\d+)?|\))\s*(\()/g, '$1*$2')     // 2( o )( → 2*( o )*(
    .replace(/(\))\s*(x|\()/g, '$1*$2');               // )x → )*x, )( → )*(

  // 🔥 Potencias con exponente negativo sin paréntesis
  // Convierte e^-1 → e^(-1), x^-2 → x^(-2)
  e = e.replace(/([A-Za-z0-9\)\]])\^-(\d+(\.\d+)?)/g, '$1^(-$2)');

  return e;
}

export function makeFn(exprInput) {
  if (!window.exprEval || !window.exprEval.Parser) {
    throw new Error('Dependency expr-eval not loaded');
  }
  
  const Parser = window.exprEval.Parser;
  const expr = normalizeExprInput(exprInput);
  
  try {
    const parser = new Parser({
      operators: { 
        add: true, 
        subtract: true, 
        multiply: true, 
        divide: true, 
        power: true, 
        factorial: false 
      }
    });
    
    // Agregar funciones matemáticas personalizadas
    parser.functions.sin = Math.sin;
    parser.functions.cos = Math.cos;
    parser.functions.tan = Math.tan;
    parser.functions.log = Math.log;  // logaritmo natural
    parser.functions.exp = Math.exp;
    parser.functions.sqrt = Math.sqrt;
    parser.functions.abs = Math.abs;
    parser.functions.asin = Math.asin;
    parser.functions.acos = Math.acos;
    parser.functions.atan = Math.atan;
    
    const node = parser.parse(expr);

    // Agregar constantes
    node.consts.e = Math.E;
    node.consts.pi = Math.PI;

    return node.toJSFunction('x');
  } catch (e) {
    console.error('Error parsing expression:', e);
    console.error('Expression:', expr);
    throw new Error(`No se pudo parsear f(x): "${expr}". Error: ${e.message}`);
  }
}