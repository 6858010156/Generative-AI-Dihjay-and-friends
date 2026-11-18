'use strict';
const $ = id => document.getElementById(id);
const history = [];
let docs = [], busy = false;
const titles = ['AI Portfolio Management','AI Trading Simulation','ML Stock Prediction & Risks'];
const descriptions = ['How AI can support allocation, diversification, and risk assessment.','Backtesting, paper trading, and evaluating strategies realistically.','Prediction methods, evaluation pitfalls, and why returns are never guaranteed.'];
function openDocument(id) { const doc = docs.find(d => d.id === id); if (!doc) return; $('documentTitle').textContent = `[${id}] ${titles[id-1]}`; $('documentText').textContent = doc.text; $('documentDialog').showModal(); }
$('closeDocument').onclick = () => $('documentDialog').close();
function addMessage(role, content, data) {
  $('chat').querySelector('.welcome')?.remove();
  const box = document.createElement('div'); box.className = 'message ' + role;
  const label = document.createElement('span'); label.className = 'message-label'; label.textContent = role === 'user' ? 'You' : data?.mode === 'excerpts' ? 'Document excerpts · AI unavailable' : 'AI answer · verify against sources';
  box.append(label,document.createTextNode(content));
  if (data?.sources?.length) { const links = document.createElement('div'); links.className = 'source-links'; for (const id of data.sources) { const btn = document.createElement('button'); btn.textContent = `[${id}] ${titles[id-1]}`; btn.onclick = () => openDocument(id); links.append(btn); } box.append(links); }
  $('chat').append(box); $('chat').scrollTop = $('chat').scrollHeight;
}
async function health() { try { const r = await fetch('/api/health'); if (!r.ok) throw Error(); const d = await r.json(); $('connection').textContent = d.ready ? '● Local AI ready' : '● Document mode · AI offline'; $('connection').classList.toggle('ready',d.ready); } catch { $('connection').textContent = 'Server unavailable'; } }
$('chatForm').addEventListener('submit',async e => { e.preventDefault(); if (busy) return; const question = $('question').value.trim(); if (!question) return; busy = true; $('send').disabled = $('clear').disabled = true; document.querySelectorAll('.suggestion').forEach(b => b.disabled = true); $('question').value = ''; addMessage('user',question); $('status').textContent = 'Reading your documents and preparing an answer…';
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(),195000);
  try { const messages = [...history.slice(-10),{role:'user',content:question}]; const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages}),signal:controller.signal}); const d = await r.json(); if (!r.ok) throw Error(d.error || 'Unable to answer.'); addMessage('assistant',d.answer,d); if (d.mode === 'ai') { history.push({role:'user',content:question},{role:'assistant',content:d.answer}); } $('status').textContent = d.mode === 'ai' ? 'All three documents were supplied to the model. Check its citations.' : 'Showing source passages. Start Ollama to enable AI answers.'; }
  catch(err) { $('status').textContent = err.name === 'AbortError' ? 'The model took too long. Please try again.' : err.message; $('question').value = question; }
  finally { clearTimeout(timer); busy = false; $('send').disabled = $('clear').disabled = false; document.querySelectorAll('.suggestion').forEach(b => b.disabled = false); health(); }
});
$('question').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('chatForm').requestSubmit();}});
document.querySelectorAll('.suggestion').forEach(b=>b.onclick=()=>{$('question').value=b.dataset.question;$('chatForm').requestSubmit();});
$('clear').onclick=()=>{if(busy)return;history.length=0;$('chat').replaceChildren();$('status').textContent='New conversation started.';$('question').focus();};
fetch('/api/documents').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{docs=data.documents;$('documents').replaceChildren();docs.forEach(d=>{const card=document.createElement('article');card.className='doc-card';const icon=document.createElement('span');icon.className='doc-icon';icon.textContent='≡';const label=document.createElement('div');label.className='eyebrow';label.textContent=`SOURCE 0${d.id}`;const title=document.createElement('h3');title.textContent=titles[d.id-1];const desc=document.createElement('p');desc.textContent=descriptions[d.id-1];const btn=document.createElement('button');btn.textContent='Read source document ↗';btn.onclick=()=>openDocument(d.id);card.append(icon,label,title,desc,btn);$('documents').append(card);});}).catch(()=>{$('documents').textContent='Source documents could not be loaded. Restart the local server and reload.';});
const money = n => n.toLocaleString('en-US', {style:'currency', currency:'USD', maximumFractionDigits:2});
const percent = n => `${n >= 0 ? '+' : ''}${Number(n.toFixed(2))}%`;
const scenarios = {growth:[12,3], decline:[-20,2], mixed:[2,-3]};
function calculatePortfolio(capital, allocation, stockReturn, bondReturn) {
  const stockCapital = capital * allocation / 100;
  const bondCapital = capital - stockCapital;
  const stockProfit = stockCapital * stockReturn / 100;
  const bondProfit = bondCapital * bondReturn / 100;
  const profit = stockProfit + bondProfit;
  return {stockCapital, bondCapital, stockProfit, bondProfit, profit,
    ending: capital + profit, rate: profit / capital * 100};
}
function simulate() {
  const capital = Number($('capital').value), allocation = Number($('allocation').value);
  const stocks = Number($('stockReturn').value), bonds = Number($('bondReturn').value);
  $('allocationValue').textContent = $('stockLabel').textContent = `${allocation}%`;
  $('bondLabel').textContent = `${100-allocation}%`;
  $('stockBar').style.width = `${allocation}%`;
  const valid = ['capital','stockReturn','bondReturn'].every(id => $(id).value.trim() !== '' && Number.isFinite(Number($(id).value)))
    && capital >= 100 && capital <= 1000000 && stocks >= -100 && stocks <= 1000 && bonds >= -100 && bonds <= 1000;
  $('comparisonChart').replaceChildren(); $('simBreakdown').replaceChildren();
  if (!valid) {
    $('endValue').textContent = '—'; $('returnValue').textContent = 'Check your scenario inputs.';
    $('simExplanation').textContent = 'Enter capital from $100 to $1,000,000 and both returns from −100% to +1,000%.';
    $('comparisonChart').setAttribute('aria-label', 'Comparison unavailable: check scenario inputs.');
    $('comparisonNote').textContent = ''; return;
  }
  const result = calculatePortfolio(capital, allocation, stocks, bonds);
  $('endValue').textContent = money(result.ending);
  $('returnValue').textContent = `${result.profit >= 0 ? '+' : ''}${money(result.profit)} (${percent(result.rate)})`;
  $('returnValue').classList.toggle('negative', result.profit < 0);
  $('simExplanation').textContent = `Weighted return: ${allocation}% × (${percent(stocks)}) + ${100-allocation}% × (${percent(bonds)}) = ${percent(result.rate)}.`;
  for (const [name, amount, profit] of [['Stocks', result.stockCapital, result.stockProfit], ['Bonds', result.bondCapital, result.bondProfit]]) {
    const row = document.createElement('div');
    const label = document.createElement('span'); label.textContent = `${name} · ${money(amount)} invested`;
    const value = document.createElement('strong'); value.textContent = `${profit >= 0 ? '+' : ''}${money(profit)}`;
    value.classList.toggle('negative', profit < 0); row.append(label,value); $('simBreakdown').append(row);
  }
  const comparisons = [
    ['Your mix', result.ending, result.rate],
    ['100% stocks', capital * (1 + stocks / 100), stocks],
    ['100% bonds', capital * (1 + bonds / 100), bonds]
  ];
  const scale = Math.max(capital, ...comparisons.map(item => item[1]));
  const summary = [];
  for (const [name, ending, rate] of comparisons) {
    const row = document.createElement('div'); row.className = 'comparison-row';
    const heading = document.createElement('div'); heading.className = 'comparison-label';
    const label = document.createElement('strong'); label.textContent = name;
    const value = document.createElement('span'); value.textContent = `${money(ending)} (${percent(rate)})`;
    heading.append(label,value);
    const track = document.createElement('div'); track.className = 'comparison-track';
    const bar = document.createElement('div'); bar.className = 'comparison-fill'; bar.style.width = `${Math.max(0,ending) / scale * 100}%`;
    const marker = document.createElement('span'); marker.className = 'capital-marker'; marker.style.left = `${capital / scale * 100}%`;
    track.append(bar,marker); row.append(heading,track); $('comparisonChart').append(row);
    summary.push(`${name}: ${money(ending)}, return ${percent(rate)}`);
  }
  $('comparisonChart').setAttribute('aria-label', summary.join('. '));
  $('comparisonNote').textContent = `Starting amount marker: ${money(capital)}. These comparisons illustrate your assumptions, not which investment will perform best in real markets.`;
}
['capital','allocation'].forEach(id => $(id).addEventListener('input', simulate));
['stockReturn','bondReturn'].forEach(id => $(id).addEventListener('input', () => { $('scenario').value = 'custom'; simulate(); }));
$('scenario').addEventListener('change', () => {
  const preset = scenarios[$('scenario').value];
  if (preset) { $('stockReturn').value = preset[0]; $('bondReturn').value = preset[1]; }
  simulate();
});
$('resetSimulation').onclick = () => {
  $('capital').value = 10000; $('allocation').value = 60; $('scenario').value = 'growth';
  $('stockReturn').value = 12; $('bondReturn').value = 3; simulate();
};
simulate(); health();
