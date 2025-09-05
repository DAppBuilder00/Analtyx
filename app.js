(function(){
  // Elements
  const datasetsCount = document.getElementById('datasetsCount')
  const recordsCount = document.getElementById('recordsCount')
  const insightsCount = document.getElementById('insightsCount')
  const kpiTableBody = document.querySelector('#kpiTable tbody')
  const activityEl = document.getElementById('activity')
  const dataPreview = document.getElementById('dataPreview')
  const insightsWindow = document.getElementById('insightsWindow')
  const mainChartCtx = document.getElementById('mainChart').getContext('2d')
  const reportArea = document.getElementById('reportArea')

  // Demo dataset
  const demo = Array.from({length:30}).map((_,i)=>({date:`2025-08-${(i+1).toString().padStart(2,'0')}`,sales:Math.round(200+Math.random()*900+(i%5)*20),users:Math.round(40+Math.random()*120)}))
  let dataset = demo

  // Render metrics
  function renderMetrics(){ datasetsCount.textContent = 1; recordsCount.textContent = dataset.length; insightsCount.textContent = analyze().length }

  // KPIs
  function renderKPIs(){ kpiTableBody.innerHTML=''; const last7 = dataset.slice(-7); const avgSales = Math.round(last7.reduce((s,r)=>s+r.sales,0)/last7.length); const avgUsers = Math.round(last7.reduce((s,r)=>s+r.users,0)/last7.length); const rows = [['Avg Sales (7d)',avgSales,'+2%'],['Avg Users (7d)',avgUsers,'+1%']]; rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td>`; kpiTableBody.appendChild(tr) }) }

  // Activity
  function renderActivity(){ activityEl.innerHTML=''; ['Loaded demo dataset','Generated report','Exported CSV'].forEach(a=>{const li=document.createElement('li');li.textContent=a;activityEl.appendChild(li)}) }

  // Chart
  let chart
  function drawChart(){ const labels = dataset.map(d=>d.date); const data = dataset.map(d=>d.sales); if(chart) chart.destroy(); chart = new Chart(mainChartCtx, {type:'line',data:{labels,datasets:[{label:'Sales',data,fill:true,tension:0.3}]}, options:{plugins:{legend:{display:false}}}}) }

  // Preview
  function renderPreview(){ dataPreview.innerHTML=''; const tbl=document.createElement('table'); tbl.style.width='100%'; tbl.innerHTML = '<tr><th>Date</th><th>Sales</th><th>Users</th></tr>' + dataset.map(r=>`<tr><td>${r.date}</td><td>${r.sales}</td><td>${r.users}</td></tr>`).join(''); dataPreview.appendChild(tbl) }

  // Insights simple rules
  function analyze(){ const last7 = dataset.slice(-7); const avg7 = last7.reduce((s,r)=>s+r.sales,0)/7; const last = last7[last7.length-1].sales; const out = []; if(last>avg7*1.2) out.push({type:'Spike',text:'Sales spike detected'}); if(avg7<300) out.push({type:'Low',text:'7-day average below target'}); insightsWindow.innerHTML = out.length? out.map(i=>`<div><strong>${i.type}</strong><p>${i.text}</p></div>`).join('') : '<div>No alerts</div>'; return out }

  // Reports
  function generateReport(type){ if(type==='summary'){ reportArea.innerHTML = `<pre>${JSON.stringify({records:dataset.length,generated:new Date().toISOString().slice(0,10)},null,2)}</pre>` } else if(type==='kpis'){ reportArea.innerHTML = '<canvas id="rchart" style="max-width:100%"></canvas>'; const ctx = document.getElementById('rchart').getContext('2d'); new Chart(ctx,{type:'bar',data:{labels:dataset.slice(-7).map(d=>d.date),datasets:[{label:'Sales',data:dataset.slice(-7).map(d=>d.sales)}]}}) } else { reportArea.innerHTML = `<pre>${JSON.stringify(dataset.slice(0,200),null,2)}</pre>` } }

  // Exports
  function exportCSV(){ const hdr = ['date','sales','users']; const rows = dataset.map(r=>`${r.date},${r.sales},${r.users}`); const csv = hdr.join(',')+'\n'+rows.join('\n'); const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='report.csv'; a.click(); URL.revokeObjectURL(url) }
  function exportPDF(){ const w = window.open(''); w.document.write('<pre>'+JSON.stringify({data:dataset.slice(0,100)},null,2)+'</pre>'); w.print() }

  // File upload
  document.getElementById('fileInput').addEventListener('change', e=>{ const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ev => { try{ if(f.name.endsWith('.json')){ dataset = JSON.parse(ev.target.result); } else { const lines = ev.target.result.split(/\r?\n/).filter(Boolean); const header = lines.shift().split(','); dataset = lines.map(l=>{ const cols = l.split(','); return {date:cols[0], sales: Number(cols[1]||0), users: Number(cols[2]||0)} }) } renderAll(); alert('Dataset loaded') } catch(err){ alert('Load failed: '+err.message) } }; r.readAsText(f) })

  // Buttons
  document.getElementById('loadDemo').addEventListener('click', ()=>{ dataset = demo; renderAll(); alert('Demo loaded') })
  document.getElementById('btnCSV').addEventListener('click', exportCSV)
  document.getElementById('btnPDF').addEventListener('click', exportPDF)
  document.getElementById('genReport').addEventListener('click', ()=>{ const t = document.getElementById('reportSelect').value; generateReport(t) })

  // Navigation
  document.querySelectorAll('.sidebar a').forEach(a=> a.addEventListener('click', e=>{ e.preventDefault(); document.querySelectorAll('.sidebar a').forEach(x=>x.classList.remove('active')); a.classList.add('active'); document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); const id = a.getAttribute('href').slice(1); document.getElementById(id).classList.add('active') }))

  // Initial render
  function renderAll(){ renderMetrics(); renderKPIs(); renderActivity(); drawChart(); renderPreview(); analyze(); }
  renderAll()
})();