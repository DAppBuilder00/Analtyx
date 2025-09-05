(function(){
  // Elements
  const datasetsCount = document.getElementById('datasetsCount')
  const recordsCount  = document.getElementById('recordsCount')
  const insightsCount = document.getElementById('insightsCount')
  const kpiTableBody  = document.querySelector('#kpiTable tbody')
  const activityEl    = document.getElementById('activity')
  const dataPreview   = document.getElementById('dataPreview')
  const insightsWin   = document.getElementById('insightsWindow')
  const mainChartCtx  = document.getElementById('mainChart').getContext('2d')
  const reportArea    = document.getElementById('reportArea')
  const fileInput     = document.getElementById('fileInput')
  const reportSelect  = document.getElementById('reportSelect')

  // Demo dataset (30 days)
  const demo = Array.from({length:30}).map((_,i)=>({
    date: new Date(Date.UTC(2025,7,i+1)).toISOString().slice(0,10),
    sales: Math.round(200 + Math.random()*900 + (i%5)*20),
    users: Math.round(40 + Math.random()*120),
    region: ['North','South','East','West'][i%4]
  }))

  // App state
  let datasets = [ {meta:{name:'Demo Dataset',created:new Date().toISOString().slice(0,10)}, records: demo} ]
  let active = datasets[0]

  // Chart instance
  let chart = null

  // UTIL: safe average
  function avg(arr){ if(!arr || !arr.length) return 0; return arr.reduce((s,v)=>s+v,0)/arr.length }

  // Render functions
  function renderMetrics(){
    document.getElementById('datasetsCount').textContent = datasets.length
    document.getElementById('recordsCount').textContent = active.records.length
    document.getElementById('insightsCount').textContent = analyze().length
  }

  function renderKPIs(){
    kpiTableBody.innerHTML = ''
    const last7 = active.records.slice(-7)
    const avgSales = Math.round(avg(last7.map(r=>r.sales)))
    const avgUsers = Math.round(avg(last7.map(r=>r.users)))
    const regionTotals = {}
    active.records.forEach(r=> regionTotals[r.region] = (regionTotals[r.region]||0) + (r.sales||0))
    const topRegion = Object.entries(regionTotals).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'
    const rows = [
      ['Avg Sales (7d)', avgSales, '↑2%'],
      ['Avg Users (7d)', avgUsers, '→1%'],
      ['Top Region', topRegion, '↑5%']
    ]
    rows.forEach(r=>{
      const tr = document.createElement('tr')
      tr.innerHTML = `<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td>`
      kpiTableBody.appendChild(tr)
    })
  }

  function renderActivity(){
    activityEl.innerHTML = ''
    const acts = [
      `Loaded dataset: ${active.meta.name}`,
      'Generated a report',
      'Exported CSV'
    ]
    acts.forEach(a=>{
      const li = document.createElement('li'); li.textContent = a; activityEl.appendChild(li)
    })
  }

  function drawChart(){
    const labels = active.records.map(r=>r.date)
    const data = active.records.map(r=>r.sales)
    if(chart) chart.destroy()
    chart = new Chart(mainChartCtx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Sales', data, fill: true, tension: 0.35 }] },
      options: {
        plugins: { legend:{ display:false } },
        interaction: { intersect: false, mode: 'index' },
        scales: { x:{ display:true }, y:{ beginAtZero:true } }
      }
    })
  }

  function renderPreview(){
    dataPreview.innerHTML = ''
    const tbl = document.createElement('table')
    tbl.style.width = '100%'
    tbl.innerHTML = `<thead><tr><th>Date</th><th>Sales</th><th>Users</th><th>Region</th></tr></thead>`
      + `<tbody>${active.records.slice(0,200).map(r=>`<tr><td>${r.date}</td><td>${r.sales}</td><td>${r.users}</td><td>${r.region||''}</td></tr>`).join('')}</tbody>`
    dataPreview.appendChild(tbl)
  }

  // Insight rules engine (simple)
  function analyze(){
    const recs = active.records
    if(!recs.length) return []
    const last7 = recs.slice(-7)
    const avg7 = avg(last7.map(r=>r.sales))
    const last = last7[last7.length-1].sales
    const out = []
    if(last > avg7 * 1.2) out.push({ type:'Spike', text:`Sales spike: ${last} (>20% of 7d avg ${Math.round(avg7)})` })
    if(avg7 < 300) out.push({ type:'Warning', text:'7-day average sales below 300 — consider promotion' })
    // render
    const win = document.getElementById('insightsWindow')
    if(out.length === 0) win.innerHTML = '<div>No alerts — performance within normal range.</div>'
    else win.innerHTML = out.map(i=>`<div style="margin-bottom:8px"><strong>${i.type}</strong><div>${i.text}</div></div>`).join('')
    return out
  }

  // Report generator
  function generateReport(type){
    reportArea.innerHTML = ''
    if(type === 'summary'){
      const summary = {
        name: active.meta.name,
        records: active.records.length,
        generated: new Date().toISOString().slice(0,10),
        avgSales7: Math.round(avg(active.records.slice(-7).map(r=>r.sales)))
      }
      reportArea.innerHTML = `<pre>${JSON.stringify(summary,null,2)}</pre>`
    } else if(type === 'kpis'){
      reportArea.innerHTML = `<canvas id="rchart" style="max-width:100%"></canvas>`
      const ctx = document.getElementById('rchart').getContext('2d')
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: active.records.slice(-14).map(r=>r.date),
          datasets: [{ label:'Sales', data: active.records.slice(-14).map(r=>r.sales) }]
        }
      })
    } else { // raw dataset
      reportArea.innerHTML = `<pre>${JSON.stringify(active.records.slice(0,500),null,2)}</pre>`
    }
  }

  // Export CSV
  function exportCSV(){
    if(!active.records.length){ alert('No data to export'); return }
    const header = ['date','sales','users','region']
    const rows = active.records.map(r => [
      r.date||'',
      r.sales||'',
      r.users||'',
      r.region||''
    ].map(cell=> `"${String(cell).replace(/"/g,'""')}"`).join(','))
    const csv = header.join(',') + '\\n' + rows.join('\\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${active.meta.name.replace(/\s+/g,'_')}_export.csv`; a.click(); URL.revokeObjectURL(url)
    alert('CSV exported')
  }

  // Export PDF using html2canvas + jsPDF
  async function exportPDF(){
    // capture reportArea or dashboard
    const area = reportArea.innerHTML.trim() ? reportArea : document.querySelector('#dashboard')
    const canvas = await html2canvas(area, { scale: 1.5 })
    const imgData = canvas.toDataURL('image/png')
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({ orientation:'landscape' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgW = pageWidth
    const imgH = (canvas.height * imgW) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH > pageHeight ? pageHeight : imgH)
    pdf.save(`${active.meta.name.replace(/\s+/g,'_')}_report.pdf`)
  }

  // CSV parser (simple, supports no-quoted CSV; limited but practical)
  function parseCSV(text){
    const lines = text.split(/\\r?\\n/).filter(Boolean)
    if(lines.length === 0) return []
    const header = lines.shift().split(',').map(h => h.trim())
    return lines.map(l => {
      const cols = l.split(',')
      const obj = {}
      header.forEach((h,i) => { obj[h] = cols[i] !== undefined ? cols[i].trim() : '' })
      // coerce common fields
      if(obj.sales !== undefined) obj.sales = Number(obj.sales)
      if(obj.users !== undefined) obj.users = Number(obj.users)
      return obj
    })
  }

  // File loader (CSV/JSON)
  function handleFileUpload(file){
    const reader = new FileReader()
    reader.onload = function(e){
      try{
        const text = e.target.result
        let newRecords = []
        if(file.name.toLowerCase().endsWith('.json')){
          const parsed = JSON.parse(text)
          // accept array or object with records
          newRecords = Array.isArray(parsed) ? parsed : (parsed.records || [])
        } else {
          newRecords = parseCSV(text)
        }
        const ds = { meta:{ name: file.name, created: new Date().toISOString().slice(0,10) }, records: newRecords }
        datasets.push(ds)
        active = ds
        renderAll()
        alert('Dataset loaded: ' + file.name)
      } catch(err){
        alert('Failed to load file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  // Search (simple)
  function doSearch(q){
    if(!q){ reportArea.innerHTML = ''; return }
    const matches = active.records.filter(r => Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase()))
    reportArea.innerHTML = `<div class="glass"><h4>Search results (${matches.length})</h4><pre>${JSON.stringify(matches.slice(0,200),null,2)}</pre></div>`
  }

  // Navigation wiring
  document.querySelectorAll('.sidebar a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      document.querySelectorAll('.sidebar a').forEach(x => x.classList.remove('active'))
      a.classList.add('active')
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
      const id = a.getAttribute('href').slice(1)
      document.getElementById(id).classList.add('active')
    })
  })

  // UI wiring
  document.getElementById('genReport').addEventListener('click', () => generateReport(reportSelect.value))
  document.getElementById('btnCSV').addEventListener('click', exportCSV)
  document.getElementById('btnPDF').addEventListener('click', () => {
    exportPDF().catch(err=>alert('PDF export failed: '+err.message))
  })
  document.getElementById('loadDemo').addEventListener('click', () => {
    const ds = { meta:{ name: 'Demo Dataset', created: new Date().toISOString().slice(0,10)}, records: demo.slice() }
    datasets.push(ds)
    active = ds
    renderAll()
    alert('Demo dataset loaded')
  })
  fileInput && fileInput.addEventListener('change', e => {
    const f = e.target.files[0]; if(!f) return; handleFileUpload(f)
  })
  document.getElementById('search').addEventListener('input', e => doSearch(e.target.value))

  // Initial render
  function renderAll(){
    renderMetrics(); renderKPIs(); renderActivity(); drawChart(); renderPreview(); analyze()
  }
  renderAll()
})();
