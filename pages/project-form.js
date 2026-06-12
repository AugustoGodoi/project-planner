// ============================================================
//  pages/project-form.js
// ============================================================

window.openProjectForm = function(projectId) {
  const isNew = !projectId;
  const p = isNew ? App.createProject() : App.getProject(projectId);
  if (!p) return;

  const memberRows = (p.members||[]).map(m => memberRow(m)).join("");

  App.openModal(`
    <div class="modal__head">
      <div class="modal__title">
        <i class="ti ti-folder-plus"></i>
        ${isNew ? App.t("newProject") : App.t("editProject")}
      </div>
      <button class="btn btn--ghost btn--sm" onclick="App.closeModal()">
        <i class="ti ti-x"></i>
      </button>
    </div>

    <div class="modal__body">
      <div class="field">
        <label>${App.t("name")} *</label>
        <input id="pf-name" class="input" type="text"
          value="${p.name}" placeholder="Nome do projeto">
      </div>

      <div class="field">
        <label>${App.t("description")}</label>
        <textarea id="pf-desc" class="input">${p.description||""}</textarea>
      </div>

      <div class="fields-row fields-row--2">
        <div class="field">
          <label>${App.t("startDate")}</label>
          <input id="pf-start" class="input" type="date" value="${p.startDate||""}">
        </div>
        <div class="field">
          <label>${App.t("endDate")}</label>
          <input id="pf-end" class="input" type="date" value="${p.endDate||""}">
        </div>
      </div>

      <div class="fields-row fields-row--2">
        <div class="field">
          <label>${App.t("status")}</label>
          <select id="pf-status" class="input">
            ${["active","paused","completed","critical"].map(s=>
              `<option value="${s}" ${p.status===s?"selected":""}>${statusLabelP(s)}</option>`
            ).join("")}
          </select>
        </div>
        <div class="field">
          <label>${App.t("priority")}</label>
          <select id="pf-priority" class="input">
            ${["high","medium","low"].map(s=>
              `<option value="${s}" ${p.priority===s?"selected":""}>${prioLabel(s)}</option>`
            ).join("")}
          </select>
        </div>
      </div>

      <div class="field">
        <label>${App.t("owner")}</label>
        <select id="pf-owner" class="input">
          ${MOCK_USERS.map(u=>
            `<option value="${u.id}" ${u.id===p.ownerId?"selected":""}>${u.name}</option>`
          ).join("")}
        </select>
      </div>

      <div class="section-sep">${App.t("members")}</div>

      <div id="pf-members-list" style="display:flex;flex-direction:column;gap:6px;">
        ${memberRows}
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <select id="pf-member-sel" class="input" style="flex:1">
          <option value="">Selecionar membro…</option>
          ${MOCK_USERS.map(u=>
            `<option value="${u.id}">${u.name}</option>`
          ).join("")}
        </select>
        <button type="button" class="btn btn--secondary btn--sm" onclick="addMember()">
          <i class="ti ti-plus"></i>${App.t("addMember")}
        </button>
      </div>
    </div>

    <div class="modal__footer">
      ${!isNew ? `<button class="btn btn--danger btn--sm"
          onclick="deleteProjAndClose('${p.id}')">
          <i class="ti ti-trash"></i>${App.t("deleteProject")}
        </button>` : ""}
      <div class="modal__footer-spacer"></div>
      <button class="btn btn--ghost" onclick="App.closeModal()">${App.t("cancel")}</button>
      <button class="btn btn--primary" onclick="saveProjectForm('${p.id}','${isNew}')">
        <i class="ti ti-check"></i>${App.t("save")}
      </button>
    </div>

    <style>
      .member-row{display:flex;align-items:center;gap:8px;padding:5px 8px;
        background:var(--c-surface-2);border-radius:var(--r-md);font-size:12px;}
      .member-row__name{flex:1;}
    </style>
  `);

  // Estado local de membros
  window._pfMembers = JSON.parse(JSON.stringify(p.members||[]));
  window._pfProjectId = p.id;
  window._pfIsNew = isNew;
};

function memberRow(m) {
  const [bg,fg] = App.avatarColor(m.name);
  return `<div class="member-row" data-mid="${m.id}">
    <div class="avatar" style="width:22px;height:22px;font-size:9px;background:${bg};color:${fg}">
      ${m.initials||(m.name||"?")[0].toUpperCase()}
    </div>
    <span class="member-row__name">${m.name}</span>
    <button type="button" class="btn btn--ghost btn--sm" onclick="removeMember('${m.id}')">
      <i class="ti ti-x"></i>
    </button>
  </div>`;
}

window.addMember = function() {
  const sel = document.getElementById("pf-member-sel");
  const uid = sel.value;
  if (!uid) return;
  if (window._pfMembers.some(m=>m.id===uid)) return;
  const u = MOCK_USERS.find(x=>x.id===uid);
  if (!u) return;
  window._pfMembers.push(u);
  sel.value = "";
  document.getElementById("pf-members-list").innerHTML =
    window._pfMembers.map(m=>memberRow(m)).join("");
};

window.removeMember = function(uid) {
  window._pfMembers = window._pfMembers.filter(m=>m.id!==uid);
  document.getElementById("pf-members-list").innerHTML =
    window._pfMembers.map(m=>memberRow(m)).join("");
};

window.saveProjectForm = function(pid, isNew) {
  const name = document.getElementById("pf-name").value.trim();
  if (!name) { document.getElementById("pf-name").focus(); return; }

  const ownerId  = document.getElementById("pf-owner").value;
  const owner    = MOCK_USERS.find(u=>u.id===ownerId);
  const existing = App.getProject(pid);

  const project = {
    ...(existing || App.createProject()),
    id:          pid,
    name,
    description: document.getElementById("pf-desc").value,
    startDate:   document.getElementById("pf-start").value || null,
    endDate:     document.getElementById("pf-end").value || null,
    status:      document.getElementById("pf-status").value,
    priority:    document.getElementById("pf-priority").value,
    ownerId:     ownerId,
    ownerName:   owner?.name || "",
    members:     window._pfMembers,
  };

  App.saveProject(project);
  App.closeModal();

  // Navegar para o projeto se criou novo, senão refresh da lista
  if (window._pfIsNew === "true" || window._pfIsNew === true) {
    App.navigate(`/project/${project.id}`);
  } else {
    // Re-renderizar a página atual
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
};

window.deleteProjAndClose = function(pid) {
  if (!confirm(App.t("deleteConfirm"))) return;
  App.deleteProject(pid);
  App.closeModal();
  App.navigate("/projects");
};

function statusLabelP(s) {
  return {active:App.t("active"),paused:App.t("paused"),
    completed:App.t("completed"),critical:App.t("critical")}[s]||s;
}
function prioLabel(s) {
  return {high:App.t("high"),medium:App.t("medium"),low:App.t("low")}[s]||s;
}
