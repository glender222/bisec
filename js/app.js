import { normalizeExprInput, makeFn } from './parser.js';
import { bisection, falsePosition } from './methods.js';
import { initPlot, setFunctionLatex, setBoundsFromFn, setIntervalLines, drawRootPoint, clearRootPoint } from './plot.js';

const $ = s => document.querySelector(s);
const fmt = (x, d=6) => Number.isFinite(x) ? Number.parseFloat(x).toFixed(d) : 'NaN';

function tableHTML(rows){
  let html = '<table class="table"><thead><tr><th>k</th><th>a</th><th>b</th><th>x</th><th>f(x)</th><th>error %</th></tr></thead><tbody>';
  rows.forEach(r=>{ html += `<tr><td>${r.k}</td><td>${fmt(r.a)}</td><td>${fmt(r.b)}</td><td>${fmt(r.x)}</td><td>${fmt(r.fx)}</td><td>${Number.isFinite(r.errPct)? r.errPct.toFixed(6) : '—'}</td></tr>`; });
  html += '</tbody></table>'; return html;
}

function updatePlot(){
  const expr = $('#expr').value;
  const exprLatex = normalizeExprInput(expr);
  const f = makeFn(expr);
  const xmin = Number($('#xmin').value), xmax = Number($('#xmax').value);
  if (!Number.isFinite(xmin) || !Number.isFinite(xmax) || xmin === xmax) throw new Error('Rango inválido.');
  setFunctionLatex(exprLatex);
  setBoundsFromFn(Math.min(xmin,xmax), Math.max(xmin,xmax), f);
  const aVal = $('#a').value !== '' ? Number($('#a').value) : null;
  const bVal = $('#b').value !== '' ? Number($('#b').value) : null;
  setIntervalLines(aVal, bVal);
  clearRootPoint();
  return f;
}

function getInterval(){
  let a = Number($('#a').value), b = Number($('#b').value);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Ingresa a y b.');
  if (a === b) throw new Error('a y b no pueden ser iguales.');
  if (a > b) [a,b] = [b,a];
  setIntervalLines(a,b);
  return {a,b};
}

function showSummary(bi, fa){
  const s = [
    `Bisección: raíz ≈ <strong>${fmt(bi.root)}</strong>, f ≈ ${fmt(bi.fx)}, iters: ${bi.iter}, tiempo: <strong>${bi.ms.toFixed(3)} ms</strong>`,
    `Falsa Pos.: raíz ≈ <strong>${fmt(fa.root)}</strong>, f ≈ ${fmt(fa.fx)}, iters: ${fa.iter}, tiempo: <strong>${fa.ms.toFixed(3)} ms</strong>`
  ].map(x=>`<span class="pill">${x}</span>`).join('');
  $('#summary').innerHTML = s;
}

function runBoth(){
  try{
    const f = updatePlot();
    const {a,b} = getInterval();
    const errpct = Number($('#errpct').value), maxit = Number($('#maxit').value);

    const bi = bisection(f, a, b, errpct, maxit);
    const fa = falsePosition(f, a, b, errpct, maxit);

    $('#tBisec').innerHTML = tableHTML(bi.table);
    $('#tFalsa').innerHTML = tableHTML(fa.table);
    showSummary(bi, fa);

    drawRootPoint(bi.root); // o usa fa.root si prefieres
    $('#status').textContent = '';
  }catch(err){ $('#status').innerHTML = `<span class="bad">${err.message || err}</span>`; }
}

function runOne(which){
  try{
    const f = updatePlot();
    const {a,b} = getInterval();
    const errpct = Number($('#errpct').value), maxit = Number($('#maxit').value);

    if(which==='bisec'){
      const bi = bisection(f, a, b, errpct, maxit);
      $('#tBisec').innerHTML = tableHTML(bi.table);
      $('#tFalsa').innerHTML = '';
      $('#summary').innerHTML = `<span class="pill">Bisección: raíz ≈ <strong>${fmt(bi.root)}</strong>, f ≈ ${fmt(bi.fx)}, iters: ${bi.iter}, tiempo: <strong>${bi.ms.toFixed(3)} ms</strong></span>`;
      drawRootPoint(bi.root);
    } else {
      const fa = falsePosition(f, a, b, errpct, maxit);
      $('#tFalsa').innerHTML = tableHTML(fa.table);
      $('#tBisec').innerHTML = '';
      $('#summary').innerHTML = `<span class="pill">Falsa Posición: raíz ≈ <strong>${fmt(fa.root)}</strong>, f ≈ ${fmt(fa.fx)}, iters: ${fa.iter}, tiempo: <strong>${fa.ms.toFixed(3)} ms</strong></span>`;
      drawRootPoint(fa.root);
    }
    $('#status').textContent = '';
  }catch(err){ $('#status').innerHTML = `<span class="bad">${err.message || err}</span>`; }
}

function clearAll(){
  $('#summary').innerHTML='';
  $('#tBisec').innerHTML='';
  $('#tFalsa').innerHTML='';
  clearRootPoint();
}

// Eventos
initPlot('calculator');
window.addEventListener('load', ()=>{ try { updatePlot(); } catch(e){} });
$('#btnPlot').addEventListener('click', ()=>{ try{ updatePlot(); $('#status').textContent=''; }catch(err){ $('#status').innerHTML = `<span class=bad>${err.message||err}</span>`; }});
$('#btnBoth').addEventListener('click', runBoth);
$('#btnBisec').addEventListener('click', ()=>runOne('bisec'));
$('#btnFalsa').addEventListener('click', ()=>runOne('falsa'));
$('#btnClear').addEventListener('click', clearAll);

// Enter para re-graficar rápido
;['expr','xmin','xmax','a','b','errpct','maxit'].forEach(id=>{
  const el = document.getElementById(id);
  el.addEventListener('keydown', e=>{ if(e.key==='Enter') { try{ updatePlot(); $('#status').textContent=''; }catch(err){ $('#status').innerHTML = `<span class=bad>${err.message||err}</span>`; } } });
});
