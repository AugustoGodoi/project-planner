// ============================================================
//  pages/project-list.js
// ============================================================

function renderProjectList() {
  App.setActiveNav("/projects");

  let filter = "all";
  let search = "";

  function filtered() {
    return App.state.projects.filter(p => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description||"").toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      const uid = App.state.currentUser.id;
      if (filter === "mine")     return p.ownerId===uid||(p.members||[]).some(m=>m.id===uid);
      if (filter === "active")   return p.status === "active";
      if (filter === "critical") return p.status === "critical";
      if (filter === "paused")   return p.status === "paused";
      return true;
    });
  }

  function render() {
    const list = filtered();
    const cardsHtml = list.map(p => projectCard(p)).join("");
    const newCard = `
      <div class="proj-new-card" onclick="openProjectForm(null)">
        <i class="ti ti-plus"></i>
        <span>${App.t("newProject")}</span>
      </div>`;

    document.getElementById("proj-grid").innerHTML =
      cardsHtml + newCard;
    document.getElementById("proj-count").textContent =
      `${list.length} projeto${list.length!==1?"s":""}`;

    // rebind filter chips
    document.querySelectorAll(".filter-chip").forEach(el => {
      el.classList.toggle("filter-chip--on", el.dataset.f === filter);
    });
  }

  App.renderPage(`
    <div class="pl-wrap">
      <div class="page-header">
        <div>
          <h1><i class="ti ti-folders" style="font-size:20px;color:var(--c-blue);vertical-align:-2px"></i>
            ${App.t("projects")}
          </h1>
        </div>
        <button class="btn btn--primary" onclick="openProjectForm(null)">
          <i class="ti ti-plus"></i>${App.t("newProject")}
        </button>
      </div>

      <div class="pl-toolbar">
        <div class="pl-search">
          <i class="ti ti-search"></i>
          <input id="pl-search-input" type="text" placeholder="${App.t("searchProjects")}" value="${search}">
        </div>
        <div class="filter-chips">
          ${["all","active","critical","paused","mine"].map(f=>`
            <button class="filter-chip${filter===f?" filter-chip--on":""}" data-f="${f}"
              onclick="plSetFilter('${f}')">${filterLabel(f)}</button>`).join("")}
        </div>
        <span id="proj-count" class="proj-count"></span>
      </div>

      <div class="proj-grid" id="proj-grid"></div>
    </div>

    <style>
      .pl-wrap{max-width:1200px;}
      .pl-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;
        background:var(--c-surface);border:1px solid var(--c-border);
        border-radius:var(--r-xl);padding:10px 14px;margin-bottom:16px;}
      .pl-search{display:flex;align-items:center;gap:7px;padding:5px 10px;
        border:1px solid var(--c-border);border-radius:var(--r-md);
        background:var(--c-surface-2);flex:1;max-width:280px;}
      .pl-search i{font-size:14px;color:var(--c-text-3);}
      .pl-search input{border:none;background:transparent;font-size:13px;
        color:var(--c-text);outline:none;width:100%;}
      .filter-chips{display:flex;gap:5px;flex-wrap:wrap;}
      .filter-chip{font-size:12px;padding:4px 12px;border:1px solid var(--c-border);
        border-radius:20px;background:transparent;color:var(--c-text-2);cursor:pointer;}
      .filter-chip:hover{background:var(--c-surface-2);}
      .filter-chip--on{background:var(--c-blue-bg);color:var(--c-blue);
        border-color:var(--c-blue-border);}
      .proj-count{font-size:12px;color:var(--c-text-3);margin-left:auto;}
      .proj-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
      @media(max-width:1000px){.proj-grid{grid-template-columns:1fr 1fr;}}
      @media(max-width:640px){.proj-grid{grid-template-columns:1fr;}}

      /* Card */
      .proj-card{background:var(--c-surface);border:1px solid var(--c-border);
        border-radius:var(--r-xl);display:flex;flex-direction:column;
        transition:box-shadow .15s,border-color .15s;cursor:pointer;}
      .proj-card:hover{box-shadow:var(--shadow-md);border-color:var(--c-border-2);}
      .proj-card--critical{border-color:var(--c-red-border);}
      .proj-card__top{padding:12px 14px 10px;border-bottom:1px solid var(--c-border);}
      .proj-card__row1{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;}
      .proj-card__icon{width:30px;height:30px;border-radius:var(--r-md);font-size:11px;
        font-weight:700;display:flex;align-items:center;justify-content:center;}
      .proj-card__badges{display:flex;gap:5px;flex-wrap:wrap;}
      .proj-card__name{font-size:13px;font-weight:600;margin-bottom:3px;}
      .proj-card__desc{font-size:11px;color:var(--c-text-2);line-height:1.4;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      .proj-card__mid{padding:10px 14px;border-bottom:1px solid var(--c-border);}
      .proj-card__prog-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
      .proj-card__pct{font-size:11px;color:var(--c-text-2);min-width:28px;text-align:right;}
      .proj-card__meta{display:flex;gap:12px;}
      .proj-card__meta span{font-size:11px;color:var(--c-text-3);
        display:flex;align-items:center;gap:3px;}
      .proj-card__meta i{font-size:12px;}
      .proj-card__foot{display:flex;align-items:center;justify-content:space-between;
        padding:8px 14px;}
      .proj-card__actions{display:flex;gap:4px;}

      .proj-new-card{border:1.5px dashed var(--c-border);border-radius:var(--r-xl);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:8px;min-height:180px;cursor:pointer;transition:background .15s;}
      .proj-new-card:hover{background:var(--c-surface);}
      .proj-new-card i{font-size:24px;color:var(--c-text-3);}
      .proj-new-card span{font-size:12px;color:var(--c-text-3);}
    </style>
  `);

  render();

  // search
  document.getElementById("pl-search-input")?.addEventListener("input", e => {
    search = e.target.value;
    render();
  });

  window.plSetFilter = function(f) {
    filter = f;
    render();
  };
}

function filterLabel(f) {
  return { all:App.t("all"), active:App.t("active"), critical:App.t("critical"),
    paused:App.t("paused"), mine:App.t("mine") }[f] || f;
}

function projectCard(p) {
  const pct = App.projectProgress(p);
  const col = App.progressColor(pct);
  const [bg, fg] = App.avatarColor(p.name);
  const ini = p.name.trim().split(/\s+/).slice(0,2).map(n=>n[0].toUpperCase()).join("");
  const dateColor = p.status==="critical" ? "color:var(--c-red)" : "";

  const membersAv = (p.members||[]).slice(0,4).map(m=>App.avatarEl(m.name,20)).join("");

  return `
    <div class="proj-card ${p.status==="critical"?"proj-card--critical":""}"
         onclick="App.navigate('/project/${p.id}')">
      <div class="proj-card__top">
        <div class="proj-card__row1">
          <div class="proj-card__icon" style="background:${bg};color:${fg}">${ini}</div>
          <div class="proj-card__badges">
            ${App.statusBadge(p.status)}
            ${App.priorityBadge(p.priority)}
          </div>
        </div>
        <div class="proj-card__name">${p.name}</div>
        <div class="proj-card__desc">${p.description||""}</div>
      </div>
      <div class="proj-card__mid">
        <div class="proj-card__prog-row">
          <div class="progress-track" style="flex:1">
            <div class="progress-fill progress-fill--${col||"blue"}" style="width:${pct}%"></div>
          </div>
          <span class="proj-card__pct" style="${p.status==="critical"?"color:var(--c-red)":""}">${pct}%</span>
        </div>
        <div class="proj-card__meta">
          <span><i class="ti ti-calendar"></i><span style="${dateColor}">${App.formatDate(p.endDate)}</span></span>
          <span><i class="ti ti-checkbox"></i>${(p.tasks||[]).filter(t=>t.status==="completed").length}/${(p.tasks||[]).length} ${App.t("tasks")}</span>
        </div>
      </div>
      <div class="proj-card__foot">
        <div class="avatar-stack">${membersAv}</div>
        <div class="proj-card__actions" onclick="event.stopPropagation()">
          <button class="btn btn--ghost btn--sm" title="Gantt"
            onclick="App.navigate('/project/${p.id}')">
            <i class="ti ti-chart-gantt"></i>
          </button>
          <button class="btn btn--ghost btn--sm" title="Editar"
            onclick="openProjectForm('${p.id}')">
            <i class="ti ti-pencil"></i>
          </button>
        </div>
      </div>
    </div>`;
}
