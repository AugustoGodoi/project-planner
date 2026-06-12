// ============================================================
//  pages/project-gantt.js
// ============================================================

let _ganttScale = "week";
let _ganttCollapsed = new Set();

// ── Helpers de data ──────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0,10); }

function daysBetween(a, b) {
  return Math.round((new Date(b+"T00:00:00") - new Date(a+"T00:00:00")) / 864e5);
}

function addDays(iso, n) {
  const d = new Date(iso+"T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0,10);
}

function durationDays(task) {
  if (!task.startDate || !task.endDate) return null;
  return daysBetween(task.startDate, task.endDate) + 1;
}

// ── Renderização principal ───────────────────────────────────
function renderProjectGantt(parts) {
  App.setActiveNav("/projects");
  const id = parts[1];
  const p  = App.getProject(id);

  if (!p) {
    App.renderPage(`<div class="empty-state">
      <i class="ti ti-folder-off"></i>
      <h3>Projeto não encontrado</h3>
      <button class="btn btn--secondary" onclick="App.navigate('/projects')">← Projetos</button>
    </div>`);
    return;
  }

  const tasks = buildWBS(p.tasks || []);
  const stats = calcStats(p.tasks || []);
  const pct   = App.projectProgress(p);

  App.renderPage(`
    <div class="gantt-page">
      <div class="gp-topbar">
        <div class="gp-topbar__left">
          <button class="btn btn--ghost btn--sm" onclick="App.navigate('/projects')">
            <i class="ti ti-arrow-left"></i>
          </button>
          <div>
            <div class="gp-proj-name">${p.name}</div>
            <div class="gp-proj-meta">
              ${App.statusBadge(p.status)} ${App.priorityBadge(p.priority)}
              <span style="font-size:12px;color:var(--c-text-3)">
                <i class="ti ti-calendar" style="font-size:12px"></i>
                ${App.formatDate(p.startDate)} → ${App.formatDate(p.endDate)}
              </span>
            </div>
          </div>
        </div>
        <div class="gp-topbar__right">
          <button class="btn btn--ghost btn--sm" onclick="openProjectForm('${p.id}')">
            <i class="ti ti-pencil"></i>Editar projeto
          </button>
          <button class="btn btn--primary btn--sm" onclick="openTaskModal(null,'${p.id}')">
            <i class="ti ti-plus"></i>Nova tarefa
          </button>
        </div>
      </div>

      <div class="gp-scalebar">
        <div class="scale-btns">
          ${["day","week","month"].map(s=>`
            <button class="scale-btn${_ganttScale===s?" scale-btn--on":""}"
              onclick="setGanttScale('${s}','${p.id}')">${scaleLabel(s)}</button>`).join("")}
        </div>
        <div class="gp-stats">
          ${statusDot("green",`${stats.completed} concluídas`)}
          ${statusDot("blue",`${stats.inProgress} em andamento`)}
          ${statusDot("gray",`${stats.notStarted} não iniciadas`)}
          ${stats.overdue>0?statusDot("red",`${stats.overdue} atrasadas`):""}
          <span style="font-size:12px;color:var(--c-text-2);margin-left:8px;">
            Conclusão geral: <strong>${pct}%</strong>
          </span>
        </div>
      </div>

      <div class="gantt-split" id="gantt-split-${p.id}">
        ${renderGanttInner(p, tasks)}
      </div>
    </div>

    <style>
      .gantt-page{display:flex;flex-direction:column;gap:0;max-width:100%;}
      .gp-topbar{display:flex;align-items:center;justify-content:space-between;
        padding:10px 0;margin-bottom:8px;}
      .gp-topbar__left{display:flex;align-items:center;gap:10px;}
      .gp-topbar__right{display:flex;align-items:center;gap:8px;}
      .gp-proj-name{font-size:16px;font-weight:600;}
      .gp-proj-meta{display:flex;align-items:center;gap:8px;margin-top:3px;flex-wrap:wrap;}
      .gp-scalebar{display:flex;align-items:center;justify-content:space-between;
        padding:8px 12px;background:var(--c-surface);border:1px solid var(--c-border);
        border-radius:var(--r-lg) var(--r-lg) 0 0;gap:10px;flex-wrap:wrap;}
      .scale-btns{display:flex;gap:4px;}
      .scale-btn{font-size:12px;padding:4px 12px;border:1px solid var(--c-border);
        border-radius:20px;background:transparent;color:var(--c-text-2);cursor:pointer;}
      .scale-btn--on{background:var(--c-blue-bg);color:var(--c-blue);border-color:var(--c-blue-border);}
      .gp-stats{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
      .stat-dot{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--c-text-2);}

      /* Split */
      .gantt-split{display:flex;border:1px solid var(--c-border);border-top:none;
        border-radius:0 0 var(--r-lg) var(--r-lg);overflow:hidden;
        background:var(--c-surface);min-height:200px;}

      /* Tabela WBS — largura maior para caber nome + datas + % */
      .gantt-table{width:420px;min-width:420px;border-right:1px solid var(--c-border);
        display:flex;flex-direction:column;flex-shrink:0;}
      .gantt-table__head{display:grid;grid-template-columns:1fr 56px 52px 38px 36px;
        padding:6px 10px;border-bottom:1px solid var(--c-border);
        background:var(--c-surface-2);gap:2px;}
      .gantt-table__head span{font-size:11px;color:var(--c-text-2);font-weight:500;
        white-space:nowrap;overflow:hidden;}
      .gantt-rows{flex:1;overflow-y:auto;overflow-x:hidden;}

      /* Linha de tarefa — altura fixa 34px */
      .gt-row{display:grid;grid-template-columns:1fr 56px 52px 38px 36px;
        padding:0 10px;height:34px;align-items:center;
        border-bottom:1px solid var(--c-border);font-size:11px;
        transition:background .1s;gap:2px;}
      .gt-row:hover{background:var(--c-surface-2);}
      .gt-row--parent{background:var(--c-surface-2);font-weight:500;}
      .gt-row--parent:hover{background:#eae8e2;}
      .gt-name{display:flex;align-items:center;gap:4px;overflow:hidden;cursor:pointer;min-width:0;}
      .gt-name span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .gt-indent{display:inline-block;flex-shrink:0;}
      .gt-chevron{font-size:11px;color:var(--c-text-3);cursor:pointer;
        flex-shrink:0;transition:transform .15s;}
      .gt-chevron--collapsed{transform:rotate(-90deg);}
      .gt-milestone-icon{font-size:12px;color:#5B3FBF;flex-shrink:0;}
      .gt-cell{font-size:10px;color:var(--c-text-3);white-space:nowrap;overflow:hidden;}
      .gt-pct{font-size:10px;color:var(--c-text-2);text-align:right;}

      /* Chart */
      .gantt-chart{flex:1;overflow:auto;display:flex;flex-direction:column;min-width:0;}
      .gantt-header{flex-shrink:0;}
      .gantt-months{display:flex;border-bottom:1px solid var(--c-border);
        background:var(--c-surface-2);}
      .gantt-month-cell{text-align:center;font-size:11px;font-weight:500;
        color:var(--c-text-2);padding:4px 0;border-right:1px solid var(--c-border);
        flex:none;}
      .gantt-months-2{display:flex;border-bottom:1px solid var(--c-border);}
      .gantt-sub-cell{text-align:center;font-size:10px;color:var(--c-text-3);
        padding:3px 0;border-right:1px solid var(--c-border);flex:none;}
      .gantt-body{position:relative;flex:1;}

      /* Linha do Gantt — mesma altura 34px da tabela */
      .gantt-bar-row{position:relative;height:34px;border-bottom:1px solid var(--c-border);}
      .gantt-bar-row:hover{background:rgba(0,0,0,.02);}
      .gantt-grid-line{position:absolute;top:0;bottom:0;width:1px;
        background:var(--c-border);opacity:.6;}
      .gantt-today-line{position:absolute;top:0;bottom:0;width:2px;
        background:var(--c-red);opacity:.5;z-index:2;}
      .g-bar{position:absolute;top:8px;height:18px;border-radius:3px;
        display:flex;align-items:center;padding:0 6px;overflow:hidden;
        font-size:10px;white-space:nowrap;cursor:pointer;transition:opacity .15s;}
      .g-bar:hover{opacity:.85;}
      .g-bar__progress{position:absolute;left:0;top:0;height:100%;
        border-radius:3px;opacity:.35;}
      .g-bar__label{position:relative;z-index:1;pointer-events:none;}
      .g-milestone{position:absolute;top:9px;width:16px;height:16px;
        transform:rotate(45deg);background:#5B3FBF;border-radius:2px;cursor:pointer;}
      .g-milestone:hover{opacity:.8;}
      .dep-svg{position:absolute;top:0;left:0;width:100%;height:100%;
        pointer-events:none;overflow:visible;z-index:3;}
    </style>
  `);

  window.setGanttScale = function(s, pid) {
    _ganttScale = s;
    renderProjectGantt(["project", pid]);
  };
}

// ── WBS ──────────────────────────────────────────────────────
function buildWBS(tasks) {
  const roots = tasks.filter(t=>!t.parentId).sort((a,b)=>a.order-b.order);
  const result = [];
  function add(t, depth) {
    result.push({...t, _depth:depth});
    if (_ganttCollapsed.has(t.id)) return;
    tasks.filter(c=>c.parentId===t.id).sort((a,b)=>a.order-b.order)
         .forEach(c=>add(c, depth+1));
  }
  roots.forEach(r=>add(r,0));
  return result;
}

// ── Dimensões ────────────────────────────────────────────────
function calcGanttDimensions(tasks) {
  const dates = tasks.flatMap(t=>[t.startDate,t.endDate]).filter(Boolean).sort();
  const minD  = dates[0] || todayStr();
  const maxD  = dates[dates.length-1] || todayStr();
  const mStart = new Date(minD+"T00:00:00");
  mStart.setDate(mStart.getDate()-7);
  const mEnd = new Date(maxD+"T00:00:00");
  mEnd.setDate(mEnd.getDate()+14);
  if (_ganttScale==="week"||_ganttScale==="day") {
    mStart.setDate(mStart.getDate()-mStart.getDay());
  } else { mStart.setDate(1); }
  const spanDays = Math.max(1,(mEnd-mStart)/864e5);
  return {startDate:mStart, endDate:mEnd, spanDays};
}

function dateToX(date, dim) {
  return (date-dim.startDate)/864e5/dim.spanDays*100;
}

// ── Inner render ─────────────────────────────────────────────
function renderGanttInner(p, tasks) {
  const dim  = calcGanttDimensions(p.tasks||[]);
  const cols = buildCols(dim);
  const ROW_H = 34;

  // ── Tabela esquerda ──
  const tableRows = tasks.map(t => {
    const hasChildren = (p.tasks||[]).some(c=>c.parentId===t.id);
    const isCollapsed = _ganttCollapsed.has(t.id);
    const indent = t._depth * 14;
    const dc = App.taskDotColor(t);
    const dotColor = {green:"var(--c-green)",blue:"var(--c-blue)",
      amber:"var(--c-amber)",red:"var(--c-red)",gray:"#B4B2A9"}[dc];
    const dur = durationDays(t);
    const durLabel = dur ? `${dur}d` : "—";

    return `<div class="gt-row ${t._depth===0&&hasChildren?"gt-row--parent":""}" data-id="${t.id}">
      <div class="gt-name" onclick="onTaskRowClick('${t.id}','${p.id}')">
        <span class="gt-indent" style="width:${indent}px"></span>
        ${hasChildren
          ? `<i class="ti ti-chevron-down gt-chevron ${isCollapsed?"gt-chevron--collapsed":""}"
               onclick="toggleCollapse(event,'${t.id}','${p.id}')"></i>`
          : `<span style="width:14px;flex-shrink:0"></span>`}
        ${t.isMilestone
          ? `<i class="ti ti-diamond gt-milestone-icon"></i>`
          : `<span class="dot" style="background:${dotColor};width:7px;height:7px;flex-shrink:0"></span>`}
        <span title="${t.name}">${t.name}</span>
      </div>
      <div class="gt-cell">${App.formatDate(t.startDate)}</div>
      <div class="gt-cell">${App.formatDate(t.endDate)}</div>
      <div class="gt-cell" style="text-align:center">${durLabel}</div>
      <div class="gt-pct">${t.isMilestone?"◆":(t.progress||0)+"%"}</div>
    </div>`;
  }).join("");

  // ── Cabeçalho do Gantt ──
  const monthsHtml = buildMonthHeader(cols);
  const subsHtml   = buildSubHeader(cols);

  // ── Body ──
  const totalH = tasks.length * ROW_H;
  const gridLines = cols.gridLines.map(x=>
    `<div class="gantt-grid-line" style="left:${x.toFixed(2)}%"></div>`).join("");
  const todayX = dateToX(new Date(), dim);
  const todayLine = todayX>=0&&todayX<=100
    ? `<div class="gantt-today-line" style="left:${todayX.toFixed(2)}%"></div>` : "";

  const barRows = tasks.map((t,i) => {
    if (!t.startDate || !t.endDate) return `<div class="gantt-bar-row"></div>`;
    const x1 = dateToX(new Date(t.startDate+"T00:00:00"), dim);
    const x2 = dateToX(new Date(t.endDate+"T23:59:59"), dim);
    const w  = Math.max(0.5, x2-x1);

    if (t.isMilestone) {
      return `<div class="gantt-bar-row">
        <div class="g-milestone" style="left:calc(${x1.toFixed(2)}% - 8px)"
             onclick="openTaskModal('${t.id}','${p.id}')" title="${t.name}"></div>
      </div>`;
    }

    const dc = App.taskDotColor(t);
    const colors = {
      green:["#C8EDD9","#1A8C5B"], blue:["#C5DFF7","#1E6FD9"],
      amber:["#FAD79A","#B86A00"], red:["#F7BFBF","#C42B2B"], gray:["#DDD9D3","#6B6860"],
    };
    const [barBg, barFg] = colors[dc]||colors.blue;

    return `<div class="gantt-bar-row">
      <div class="g-bar" style="left:${x1.toFixed(2)}%;width:${w.toFixed(2)}%;
           background:${barBg};color:${barFg}"
           onclick="openTaskModal('${t.id}','${p.id}')" title="${t.name}">
        <div class="g-bar__progress" style="width:${t.progress||0}%;background:${barFg}"></div>
        <span class="g-bar__label">${w>8?t.name:""}</span>
      </div>
    </div>`;
  }).join("");

  const depSvg = buildDepSvg(tasks, dim);

  return `
    <div class="gantt-table">
      <div class="gantt-table__head">
        <span>Tarefa</span>
        <span>Início</span>
        <span>Término</span>
        <span style="text-align:center">Dur.</span>
        <span style="text-align:right">%</span>
      </div>
      <div class="gantt-rows" id="gt-rows">${tableRows}</div>
    </div>
    <div class="gantt-chart" id="g-chart">
      <div class="gantt-header">
        <div class="gantt-months" style="position:relative;min-height:24px">${monthsHtml}</div>
        <div class="gantt-months-2">${subsHtml}</div>
      </div>
      <div class="gantt-body" style="height:${totalH}px;min-height:${totalH}px">
        ${gridLines}${todayLine}${barRows}
        <svg class="dep-svg">${depSvg}</svg>
      </div>
    </div>`;
}

// ── Colunas cabeçalho ────────────────────────────────────────
function buildCols(dim) {
  const months=[], subs=[], gridLines=[];
  if (_ganttScale==="month") {
    const cur=new Date(dim.startDate);
    while(cur<=dim.endDate){
      const x=dateToX(cur,dim);
      const next=new Date(cur); next.setMonth(next.getMonth()+1);
      const w=dateToX(next,dim)-x;
      months.push({label:cur.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}),x,w});
      gridLines.push(x);
      cur.setMonth(cur.getMonth()+1);
    }
    return {months, subs:months.map(m=>({label:"",x:m.x,w:m.w})), gridLines};
  }
  if (_ganttScale==="week") {
    const monthMap=new Map(), c2=new Date(dim.startDate);
    while(c2<=dim.endDate){
      const mk=c2.getFullYear()+"-"+c2.getMonth();
      if(!monthMap.has(mk)) monthMap.set(mk,{label:c2.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}),x:dateToX(c2,dim),end:c2.getTime()});
      monthMap.get(mk).end=c2.getTime();
      const wx=dateToX(c2,dim);
      subs.push({label:`S${Math.ceil(c2.getDate()/7)}`,x:wx,w:7/dim.spanDays*100});
      gridLines.push(wx);
      c2.setDate(c2.getDate()+7);
    }
    monthMap.forEach(v=>{
      const endX=dateToX(new Date(v.end),dim)+7/dim.spanDays*100;
      months.push({label:v.label,x:v.x,w:endX-v.x});
    });
    return {months,subs,gridLines};
  }
  // day
  const dayMap=new Map(), c3=new Date(dim.startDate);
  while(c3<=dim.endDate){
    const mk=c3.getFullYear()+"-"+c3.getMonth();
    if(!dayMap.has(mk)) dayMap.set(mk,{label:c3.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}),x:dateToX(c3,dim)});
    const dx=dateToX(c3,dim);
    subs.push({label:c3.getDate(),x:dx,w:1/dim.spanDays*100});
    if(c3.getDay()===0) gridLines.push(dx);
    c3.setDate(c3.getDate()+1);
  }
  dayMap.forEach(v=>months.push({...v,w:0}));
  return {months,subs,gridLines};
}

function buildMonthHeader(cols) {
  return cols.months.map(m=>
    `<div class="gantt-month-cell" style="width:${m.w.toFixed(2)}%">${m.label}</div>`
  ).join("");
}
function buildSubHeader(cols) {
  return cols.subs.map(s=>
    `<div class="gantt-sub-cell" style="width:${s.w.toFixed(2)}%">${s.label}</div>`
  ).join("");
}

// ── Dep arrows ───────────────────────────────────────────────
function buildDepSvg(tasks, dim) {
  let svg=`<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
    <path d="M0,0 L6,3 L0,6 Z" fill="#9E9B95"/></marker></defs>`;
  tasks.forEach((t,ti)=>{
    (t.dependencies||[]).forEach(dep=>{
      const si=tasks.findIndex(x=>x.id===dep.taskId);
      if(si<0||!tasks[si].endDate||!t.startDate) return;
      const sx=dateToX(new Date(tasks[si].endDate+"T23:59:59"),dim);
      const ex=dateToX(new Date(t.startDate+"T00:00:00"),dim);
      const sy=si*34+17, ey=ti*34+17;
      svg+=`<line x1="${sx.toFixed(1)}%" y1="${sy}" x2="${ex.toFixed(1)}%" y2="${ey}"
        stroke="#B4B2A9" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arr)"/>`;
    });
  });
  return svg;
}

window.toggleCollapse = function(e,id,pid){
  e.stopPropagation();
  if(_ganttCollapsed.has(id)) _ganttCollapsed.delete(id); else _ganttCollapsed.add(id);
  renderProjectGantt(["project",pid]);
};
window.onTaskRowClick = (tid,pid)=>openTaskModal(tid,pid);

function calcStats(tasks){
  return {
    completed:  tasks.filter(t=>t.status==="completed").length,
    inProgress: tasks.filter(t=>t.status==="in_progress").length,
    notStarted: tasks.filter(t=>t.status==="not_started").length,
    overdue:    tasks.filter(t=>App.isOverdue(t)).length,
  };
}
function statusDot(color,label){
  return `<div class="stat-dot"><span class="dot dot--${color}"></span>${label}</div>`;
}
function scaleLabel(s){return {day:"Dia",week:"Semana",month:"Mês"}[s]||s;}

// ============================================================
//  Modal de Tarefa
// ============================================================
window.openTaskModal = function(taskId, projectId) {
  const p = App.getProject(projectId);
  if (!p) return;
  const isNew = !taskId;
  const task  = isNew ? App.createTask() : (p.tasks||[]).find(t=>t.id===taskId);
  if (!task) return;

  // Carrega usuários da lista de membros do projeto + admin users
  const allUsers = getAvailableUsers();

  const parentOptions = (p.tasks||[])
    .filter(t=>t.id!==taskId&&!t.isMilestone)
    .map(t=>`<option value="${t.id}" ${t.id===task.parentId?"selected":""}>${t.name}</option>`)
    .join("");

  const depOptions = (p.tasks||[])
    .filter(t=>t.id!==taskId)
    .map(t=>`<option value="${t.id}">${t.name}</option>`)
    .join("");

  const statusOpts = ["not_started","in_progress","completed","delayed"].map(s=>
    `<button type="button" class="status-opt ${task.status===s?"status-opt--on":""}"
      data-s="${s}" onclick="selectStatus(this)">${statusLabel(s)}</button>`
  ).join("");

  App.openModal(`
    <div class="modal__head">
      <div class="modal__title">
        <i class="ti ti-subtask"></i>
        ${isNew?"Nova tarefa":"Editar tarefa"}
      </div>
      <button class="btn btn--ghost btn--sm" onclick="App.closeModal()">
        <i class="ti ti-x"></i>
      </button>
    </div>
    <div class="modal__body">
      <div class="section-sep">Informações gerais</div>

      <div class="field">
        <label>Nome</label>
        <input id="tk-name" class="input" type="text" value="${task.name}" placeholder="Nome da tarefa">
      </div>

      <div class="fields-row fields-row--2">
        <div class="field">
          <label>Início</label>
          <input id="tk-start" class="input" type="date" value="${task.startDate||""}"
            oninput="onTaskStartChange()">
        </div>
        <div class="field">
          <label>Término</label>
          <input id="tk-end" class="input" type="date" value="${task.endDate||""}">
        </div>
      </div>

      <div class="fields-row fields-row--2">
        <div class="field">
          <label>Status</label>
          <div class="status-opts" id="tk-status" data-val="${task.status}">${statusOpts}</div>
        </div>
        <div class="field">
          <label>Responsável</label>
          <select id="tk-assignee" class="input">
            ${allUsers.map(u=>`<option value="${u.id}" ${u.id===task.assigneeId?"selected":""}>${u.name}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="field">
        <label>Progresso: <span id="tk-pct-label">${task.progress||0}%</span></label>
        <input id="tk-progress" type="range" min="0" max="100" step="5"
          value="${task.progress||0}"
          oninput="document.getElementById('tk-pct-label').textContent=this.value+'%'"
          style="width:100%;accent-color:var(--c-blue)">
      </div>

      <div class="field" style="flex-direction:row;align-items:center;gap:8px">
        <input id="tk-milestone" type="checkbox" ${task.isMilestone?"checked":""}>
        <label for="tk-milestone" style="margin:0;font-size:13px;cursor:pointer">Marco (milestone)</label>
      </div>

      <div class="section-sep">Hierarquia e dependências</div>

      <div class="fields-row fields-row--2">
        <div class="field">
          <label>Tarefa pai</label>
          <select id="tk-parent" class="input">
            <option value="">— raiz —</option>
            ${parentOptions}
          </select>
        </div>
        <div class="field">
          <label>Tipo de dependência</label>
          <select id="tk-dep-type" class="input">
            <option value="FS">FS — Fim → Início</option>
            <option value="SS">SS — Início → Início</option>
            <option value="FF">FF — Fim → Fim</option>
            <option value="SF">SF — Início → Fim</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Depende de</label>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <select id="tk-dep-select" class="input" style="flex:1;font-size:12px">
            <option value="">Selecionar tarefa…</option>
            ${depOptions}
          </select>
          <button type="button" class="btn btn--secondary btn--sm" onclick="addDep()">
            <i class="ti ti-plus"></i> Adicionar
          </button>
        </div>
        <div id="tk-deps-list" style="display:flex;flex-direction:column;gap:4px">
          <!-- tags renderizadas por refreshDepTags() -->
        </div>
      </div>

      <div class="field">
        <label>Observações</label>
        <textarea id="tk-notes" class="input">${task.notes||""}</textarea>
      </div>
    </div>
    <div class="modal__footer">
      ${!isNew?`<button class="btn btn--danger btn--sm"
          onclick="deleteTaskAndClose('${taskId}','${projectId}')">
          <i class="ti ti-trash"></i>Excluir
        </button>`:""}
      <div class="modal__footer-spacer"></div>
      <button class="btn btn--ghost" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn--primary"
        onclick="saveTaskModal('${taskId||""}','${projectId}')">
        <i class="ti ti-check"></i>Salvar
      </button>
    </div>

    <style>
      .status-opts{display:flex;gap:5px;flex-wrap:wrap;}
      .status-opt{font-size:11px;padding:4px 10px;border-radius:20px;
        border:1px solid var(--c-border);cursor:pointer;background:transparent;color:var(--c-text-2);}
      .status-opt--on{font-weight:500;}
      .status-opt[data-s="not_started"].status-opt--on{background:var(--c-gray-bg);color:var(--c-gray);border-color:var(--c-gray-border);}
      .status-opt[data-s="in_progress"].status-opt--on{background:var(--c-blue-bg);color:var(--c-blue);border-color:var(--c-blue-border);}
      .status-opt[data-s="completed"].status-opt--on{background:var(--c-green-bg);color:var(--c-green);border-color:var(--c-green-border);}
      .status-opt[data-s="delayed"].status-opt--on{background:var(--c-red-bg);color:var(--c-red);border-color:var(--c-red-border);}
      .dep-row{display:flex;align-items:center;gap:8px;padding:5px 10px;
        background:var(--c-surface-2);border-radius:var(--r-md);font-size:12px;}
      .dep-row__name{flex:1;}
      .dep-row__type{font-size:10px;color:var(--c-text-3);background:var(--c-surface);
        border:1px solid var(--c-border);border-radius:var(--r-sm);padding:1px 6px;}
      .dep-row__auto{font-size:10px;color:var(--c-green);margin-left:auto;}
    </style>
  `);

  window._modalDeps    = JSON.parse(JSON.stringify(task.dependencies||[]));
  window._modalProjId  = projectId;
  window._modalTaskId  = taskId||null;
  window._modalProjObj = p;

  refreshDepTags();
};

// Quando o usuário muda a data de início manualmente
window.onTaskStartChange = function() {
  // não faz nada automaticamente — o auto-ajuste acontece ao adicionar dependência
};

window.selectStatus = function(btn) {
  document.querySelectorAll(".status-opt").forEach(b=>b.classList.remove("status-opt--on"));
  btn.classList.add("status-opt--on");
  document.getElementById("tk-status").dataset.val = btn.dataset.s;
};

window.addDep = function() {
  const sel   = document.getElementById("tk-dep-select");
  const type  = document.getElementById("tk-dep-type").value;
  const tid   = sel.value;
  if (!tid) return;
  if (window._modalDeps.some(d=>d.taskId===tid)) return;

  window._modalDeps.push({taskId:tid, type});
  sel.value = "";

  // Auto-ajuste de datas baseado na dependência
  autoAdjustDates(tid, type);
  refreshDepTags();
};

function autoAdjustDates(depTaskId, type) {
  const p = window._modalProjObj;
  if (!p) return;
  const depTask = (p.tasks||[]).find(t=>t.id===depTaskId);
  if (!depTask) return;

  const startEl = document.getElementById("tk-start");
  const endEl   = document.getElementById("tk-end");

  // Calcula duração atual da tarefa editada (para manter)
  const curStart = startEl.value;
  const curEnd   = endEl.value;
  const dur = (curStart && curEnd) ? daysBetween(curStart, curEnd) : null;

  let newStart = null;

  if (type === "FS" && depTask.endDate) {
    // Começa no dia seguinte ao fim da anterior
    newStart = addDays(depTask.endDate, 1);
  } else if (type === "SS" && depTask.startDate) {
    // Começa junto com a anterior
    newStart = depTask.startDate;
  }
  // FF e SF não alteram início, apenas fim — deixar para o usuário ajustar

  if (newStart) {
    startEl.value = newStart;
    // Se tinha duração definida, mantém a duração
    if (dur !== null && dur >= 0) {
      endEl.value = addDays(newStart, dur);
    }
    // Feedback visual
    startEl.style.borderColor = "var(--c-green)";
    setTimeout(() => startEl.style.borderColor = "", 2000);
  }
}

function refreshDepTags() {
  const p    = window._modalProjObj;
  const list = document.getElementById("tk-deps-list");
  if (!list || !p) return;

  if (!window._modalDeps.length) {
    list.innerHTML = `<div style="font-size:11px;color:var(--c-text-3);padding:4px 0">Nenhuma dependência.</div>`;
    return;
  }

  list.innerHTML = window._modalDeps.map(d => {
    const dt = (p.tasks||[]).find(t=>t.id===d.taskId);
    if (!dt) return "";
    const autoLabel = (d.type==="FS"||d.type==="SS") && dt.endDate
      ? `<span class="dep-row__auto"><i class="ti ti-calendar-check" style="font-size:11px"></i> datas ajustadas</span>` : "";
    return `<div class="dep-row">
      <span class="dep-row__name">${dt.name}</span>
      <span class="dep-row__type">${d.type}</span>
      ${autoLabel}
      <button type="button" class="btn btn--ghost btn--sm" style="padding:2px 6px"
        onclick="removeDep('${d.taskId}')">
        <i class="ti ti-x" style="font-size:12px"></i>
      </button>
    </div>`;
  }).join("");
}

window.removeDep = function(tid) {
  window._modalDeps = window._modalDeps.filter(d=>d.taskId!==tid);
  refreshDepTags();
};

window.saveTaskModal = function(taskId, projectId) {
  const p = App.getProject(projectId);
  if (!p) return;
  const name = document.getElementById("tk-name").value.trim();
  if (!name) { document.getElementById("tk-name").focus(); return; }

  const assigneeId = document.getElementById("tk-assignee").value;
  const allUsers   = getAvailableUsers();
  const assignee   = allUsers.find(u=>u.id===assigneeId);

  const task = {
    id:           taskId || App.uid(),
    parentId:     document.getElementById("tk-parent").value || null,
    name,
    notes:        document.getElementById("tk-notes").value,
    startDate:    document.getElementById("tk-start").value || null,
    endDate:      document.getElementById("tk-end").value || null,
    assigneeId,
    assigneeName: assignee?.name || "",
    progress:     parseInt(document.getElementById("tk-progress").value)||0,
    status:       document.getElementById("tk-status").dataset.val||"not_started",
    isMilestone:  document.getElementById("tk-milestone").checked,
    dependencies: window._modalDeps||[],
    order:        taskId ? (p.tasks||[]).find(t=>t.id===taskId)?.order||0 : (p.tasks||[]).length,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
  };

  p.tasks = p.tasks||[];
  const i = p.tasks.findIndex(t=>t.id===task.id);
  if (i>=0) p.tasks[i]=task; else p.tasks.push(task);
  App.saveProject(p);
  App.closeModal();
  renderProjectGantt(["project", projectId]);
};

window.deleteTaskAndClose = function(taskId, projectId) {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
  const p = App.getProject(projectId);
  if (!p) return;
  p.tasks = (p.tasks||[]).filter(t=>t.id!==taskId);
  App.saveProject(p);
  App.closeModal();
  renderProjectGantt(["project", projectId]);
};

function statusLabel(s) {
  return {not_started:"Não iniciada",in_progress:"Em andamento",
    completed:"Concluído",delayed:"Atrasada"}[s]||s;
}

// Retorna lista de usuários disponíveis (admin users + mock)
function getAvailableUsers() {
  try {
    const raw = localStorage.getItem("pp_users");
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.length) return saved;
    }
  } catch {}
  return typeof MOCK_USERS !== "undefined" ? MOCK_USERS : [];
}
