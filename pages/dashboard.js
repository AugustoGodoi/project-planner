// ============================================================
//  pages/dashboard.js
// ============================================================

function renderDashboard() {
  App.setActiveNav("/dashboard");
  const u    = App.state.currentUser;
  const mine = App.getMyProjects();
  const tasks = App.getMyTasks();

  const overdue  = tasks.filter(t => App.isOverdue(t));
  const dueSoon  = tasks.filter(t => App.isDueSoon(t));
  const critical = mine.filter(p => p.status === "critical");
  const active   = mine.filter(p => p.status === "active" || p.status === "critical");

  // Alertas
  let alertsHtml = "";
  if (overdue.length)
    alertsHtml += alertRow("error","ti-alert-circle",
      `<strong>${overdue.length} ${App.t("overdue")}</strong> — ${overdue.map(t=>t.name).join(" · ")}`);
  if (dueSoon.length)
    alertsHtml += alertRow("warn","ti-clock",
      `<strong>${dueSoon.length} ${App.t("dueSoon")}</strong> — ${dueSoon.map(t=>t.name).join(" · ")}`);
  if (critical.length)
    alertsHtml += alertRow("info","ti-info-circle",
      `<strong>${critical.map(p=>p.name).join(", ")}</strong> com status crítico`);

  // Métricas
  const metrics = [
    { label: App.t("activeProjects"), val: active.length, sub: "como membro ou owner" },
    { label: App.t("assignedTasks"),  val: tasks.length,  sub: `em ${mine.length} projetos` },
    { label: App.t("overdue"),        val: overdue.length, sub: "prazo vencido", red: overdue.length > 0 },
    { label: App.t("dueSoon"),        val: dueSoon.length, sub: "atenção necessária", amber: dueSoon.length > 0 },
  ];

  // Lista de tarefas
  const taskRows = tasks.slice(0, 8).map(t => {
    const color = App.taskDotColor(t);
    const dateLabel = App.isOverdue(t) ? `<span style="color:var(--c-red)">vencida</span>`
      : `<span style="color:${color==="amber"?"var(--c-amber)":"var(--c-text-3)"}">${App.formatDate(t.endDate)}</span>`;
    return `<div class="task-row">
      <span class="dot dot--${color}"></span>
      <span class="task-row__name">${t.name}</span>
      <span class="task-row__proj">${t.projectName}</span>
      ${dateLabel}
    </div>`;
  }).join("");

  // Mini Gantt
  const allDates = tasks.flatMap(t=>[t.startDate,t.endDate]).filter(Boolean).sort();
  const minD = allDates[0]||"2025-05-01";
  const maxD = allDates[allDates.length-1]||"2025-08-01";
  const span = Math.max(1,(new Date(maxD)-new Date(minD))/864e5);
  const todayPct = Math.max(0,Math.min(100,
    (new Date()-new Date(minD))/864e5/span*100));

  const miniGanttRows = tasks.slice(0,8).map(t=>{
    if(!t.startDate||!t.endDate) return "";
    const left = Math.max(0,(new Date(t.startDate)-new Date(minD))/864e5/span*100);
    const w    = Math.max(2,(new Date(t.endDate)-new Date(t.startDate))/864e5/span*100);
    const col  = App.taskDotColor(t);
    const barColor = {green:"var(--c-green)",blue:"var(--c-blue)",
      amber:"var(--c-amber)",red:"var(--c-red)",gray:"#B4B2A9"}[col];
    return `<div class="mg-row">
      <div class="mg-label" title="${t.name}">${t.name}</div>
      <div class="mg-track">
        <div class="mg-bar" style="left:${left.toFixed(1)}%;width:${w.toFixed(1)}%;background:${barColor}"></div>
        <div class="mg-today" style="left:${todayPct.toFixed(1)}%"></div>
      </div>
    </div>`;
  }).join("");

  // Gráfico de carga (tarefas ativas por semana)
  const weeks = buildWorkloadWeeks(tasks, 8);
  const maxW  = Math.max(1, ...weeks.map(w=>w.count));
  const barsHtml = weeks.map(w => {
    const h = Math.round((w.count/maxW)*80);
    const col = w.count>=5?"var(--c-amber)":w.count>=3?"var(--c-blue)":"var(--c-green)";
    return `<div class="wl-col">
      <div class="wl-bar" style="height:${h}px;background:${col}"></div>
      <span>${w.label}</span>
    </div>`;
  }).join("");

  // Meus projetos
  const projRows = mine.map(p => {
    const pct = App.projectProgress(p);
    const col = App.progressColor(pct);
    return `<div class="proj-row" onclick="App.navigate('/project/${p.id}')" style="cursor:pointer">
      ${App.avatarEl(p.name, 22)}
      <div class="proj-row__info">
        <div class="proj-row__name">${p.name}</div>
        <div class="proj-row__sub">${p.ownerId===u.id?"Owner":"Membro"} · ${(p.tasks||[]).length} ${App.t("tasks")}</div>
      </div>
      <div style="width:70px">
        <div class="progress-track">
          <div class="progress-fill progress-fill--${col||"blue"}" style="width:${pct}%"></div>
        </div>
      </div>
      ${App.statusBadge(p.status)}
    </div>`;
  }).join("");

  App.renderPage(`
    <div class="dash-wrap">
      ${alertsHtml ? `<div class="alerts-col">${alertsHtml}</div>` : ""}

      <div class="metrics-row">
        ${metrics.map(m=>`
          <div class="metric-card">
            <div class="metric-label">${m.label}</div>
            <div class="metric-val" style="${m.red?"color:var(--c-red)":m.amber?"color:var(--c-amber)":""}">${m.val}</div>
            <div class="metric-sub">${m.sub}</div>
          </div>`).join("")}
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card__head">
            <div class="card__title"><i class="ti ti-list-check"></i>${App.t("myTasks")}</div>
          </div>
          <div class="task-list">${taskRows||`<div class="empty-mini">Nenhuma tarefa atribuída.</div>`}</div>
        </div>

        <div class="card">
          <div class="card__head">
            <div class="card__title"><i class="ti ti-chart-gantt"></i>Mini Gantt</div>
          </div>
          <div class="mini-gantt-wrap">
            ${miniGanttRows||`<div class="empty-mini">Sem tarefas para exibir.</div>`}
            <div class="mg-scale">
              <span>${minD.slice(0,7)}</span><span>${maxD.slice(0,7)}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__head">
            <div class="card__title"><i class="ti ti-chart-bar"></i>${App.t("workload")}</div>
          </div>
          <div class="wl-wrap">
            <div class="wl-bars">${barsHtml}</div>
            <div class="wl-legend">
              <span style="color:var(--c-green)">■ Normal (1-2)</span>
              <span style="color:var(--c-blue)">■ Moderado (3-4)</span>
              <span style="color:var(--c-amber)">■ Alto (5+)</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__head">
            <div class="card__title"><i class="ti ti-folders"></i>${App.t("myProjects")}</div>
            <a href="#/projects" class="btn btn--ghost btn--sm">Ver todos</a>
          </div>
          <div class="proj-list">${projRows||`<div class="empty-mini">Nenhum projeto.</div>`}</div>
        </div>
      </div>
    </div>

    <style>
      .dash-wrap{display:flex;flex-direction:column;gap:16px;max-width:1200px;}
      .alerts-col{display:flex;flex-direction:column;gap:8px;}
      .metrics-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
      .metric-card{background:var(--c-surface);border:1px solid var(--c-border);
        border-radius:var(--r-xl);padding:14px 16px;}
      .metric-label{font-size:12px;color:var(--c-text-2);margin-bottom:4px;}
      .metric-val{font-size:28px;font-weight:600;line-height:1;}
      .metric-sub{font-size:11px;color:var(--c-text-3);margin-top:3px;}
      .dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
      .task-list{display:flex;flex-direction:column;}
      .task-row{display:flex;align-items:center;gap:8px;padding:7px 14px;
        border-bottom:1px solid var(--c-border);font-size:12px;}
      .task-row:last-child{border-bottom:none;}
      .task-row__name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .task-row__proj{font-size:11px;color:var(--c-text-3);white-space:nowrap;margin-right:4px;}
      .mini-gantt-wrap{padding:10px 14px;display:flex;flex-direction:column;gap:5px;}
      .mg-row{display:flex;align-items:center;gap:8px;height:22px;}
      .mg-label{font-size:10px;color:var(--c-text-2);width:110px;white-space:nowrap;
        overflow:hidden;text-overflow:ellipsis;flex-shrink:0;}
      .mg-track{flex:1;position:relative;height:8px;background:var(--c-surface-2);border-radius:2px;}
      .mg-bar{position:absolute;top:0;height:8px;border-radius:2px;min-width:4px;}
      .mg-today{position:absolute;top:-5px;bottom:-5px;width:1.5px;background:var(--c-red);opacity:.7;}
      .mg-scale{display:flex;justify-content:space-between;
        font-size:10px;color:var(--c-text-3);margin-top:4px;}
      .wl-wrap{padding:12px 14px;}
      .wl-bars{display:flex;align-items:flex-end;gap:4px;height:90px;margin-bottom:8px;}
      .wl-col{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;}
      .wl-bar{width:100%;border-radius:3px 3px 0 0;min-height:3px;}
      .wl-col span{font-size:9px;color:var(--c-text-3);}
      .wl-legend{display:flex;gap:12px;font-size:10px;flex-wrap:wrap;}
      .proj-list{display:flex;flex-direction:column;}
      .proj-row{display:flex;align-items:center;gap:8px;padding:8px 14px;
        border-bottom:1px solid var(--c-border);transition:background .12s;}
      .proj-row:last-child{border-bottom:none;}
      .proj-row:hover{background:var(--c-surface-2);}
      .proj-row__info{flex:1;min-width:0;}
      .proj-row__name{font-size:12px;font-weight:500;white-space:nowrap;
        overflow:hidden;text-overflow:ellipsis;}
      .proj-row__sub{font-size:11px;color:var(--c-text-3);}
      .empty-mini{padding:20px;text-align:center;font-size:12px;color:var(--c-text-3);}
      @media(max-width:900px){
        .metrics-row{grid-template-columns:1fr 1fr;}
        .dash-grid{grid-template-columns:1fr;}
      }
    </style>
  `);
}

function alertRow(type, icon, html) {
  return `<div class="alert alert--${type}">
    <i class="ti ${icon}"></i>
    <div class="alert__text">${html}</div>
  </div>`;
}

function buildWorkloadWeeks(tasks, n) {
  const weeks = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < n; i++) {
    const ws = new Date(today); ws.setDate(today.getDate() - today.getDay() + i*7);
    const we = new Date(ws); we.setDate(ws.getDate()+6);
    const count = tasks.filter(t => {
      if(!t.startDate||!t.endDate) return false;
      const ts=new Date(t.startDate), te=new Date(t.endDate);
      return ts<=we && te>=ws;
    }).length;
    weeks.push({ label:`S${i+1}`, count });
  }
  return weeks;
}
