// ============================================================
//  pages/admin.js — Gerenciamento de usuários
//
//  Os usuários são salvos no localStorage (pp_users).
//  Na versão com GitHub Storage, também persistem no JSON.
// ============================================================

// ── Carregar/salvar usuários ─────────────────────────────────
function adminLoadUsers() {
  try {
    const raw = localStorage.getItem("pp_users");
    if (raw) return JSON.parse(raw);
  } catch {}
  // fallback: copiar MOCK_USERS como ponto de partida
  const defaults = typeof MOCK_USERS !== "undefined"
    ? JSON.parse(JSON.stringify(MOCK_USERS)) : [];
  adminSaveUsers(defaults);
  return defaults;
}

function adminSaveUsers(users) {
  localStorage.setItem("pp_users", JSON.stringify(users));
}

// ── Renderização da tela ─────────────────────────────────────
function renderAdmin() {
  App.setActiveNav("/admin");
  const users = adminLoadUsers();

  App.renderPage(`
    <div class="admin-wrap">
      <div class="page-header">
        <div>
          <h1><i class="ti ti-shield-check"
            style="font-size:20px;color:var(--c-blue);vertical-align:-2px"></i>
            Admin
          </h1>
          <div style="font-size:13px;color:var(--c-text-2);margin-top:2px">
            Gerencie os usuários disponíveis no sistema
          </div>
        </div>
        <button class="btn btn--primary" onclick="openUserModal(null)">
          <i class="ti ti-user-plus"></i> Novo usuário
        </button>
      </div>

      <div class="card">
        <div class="card__head">
          <div class="card__title">
            <i class="ti ti-users"></i>
            Usuários cadastrados
          </div>
          <span style="font-size:12px;color:var(--c-text-3)">${users.length} usuário${users.length!==1?"s":""}</span>
        </div>
        <div id="admin-user-list">
          ${renderUserList(users)}
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head">
          <div class="card__title">
            <i class="ti ti-info-circle"></i>
            Sobre os usuários
          </div>
        </div>
        <div style="padding:14px 16px;font-size:13px;color:var(--c-text-2);line-height:1.6">
          Os usuários cadastrados aqui ficam disponíveis nos seletores de
          <strong>Responsável</strong> ao criar ou editar tarefas e projetos.<br><br>
          Os dados são salvos no <code style="background:var(--c-surface-2);padding:1px 5px;
          border-radius:4px;font-size:12px">localStorage</code> deste navegador.
          Para que todos os membros da equipe vejam a mesma lista, cada pessoa
          deve cadastrar os usuários no seu dispositivo, ou você pode exportar
          e importar a lista abaixo.
        </div>
        <div style="padding:0 16px 14px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn--secondary btn--sm" onclick="exportUsers()">
            <i class="ti ti-download"></i> Exportar lista (JSON)
          </button>
          <label class="btn btn--secondary btn--sm" style="cursor:pointer">
            <i class="ti ti-upload"></i> Importar lista (JSON)
            <input type="file" accept=".json" style="display:none"
              onchange="importUsers(this)">
          </label>
        </div>
      </div>
    </div>

    <style>
      .admin-wrap{max-width:800px;}
      .user-row{display:flex;align-items:center;gap:12px;padding:10px 16px;
        border-bottom:1px solid var(--c-border);transition:background .1s;}
      .user-row:last-child{border-bottom:none;}
      .user-row:hover{background:var(--c-surface-2);}
      .user-row__info{flex:1;min-width:0;}
      .user-row__name{font-size:13px;font-weight:500;}
      .user-row__meta{font-size:11px;color:var(--c-text-3);margin-top:1px;}
      .user-row__actions{display:flex;gap:4px;flex-shrink:0;}
    </style>
  `);
}

function renderUserList(users) {
  if (!users.length) {
    return `<div class="empty-state" style="padding:24px">
      <i class="ti ti-users-off"></i>
      <h3>Nenhum usuário cadastrado</h3>
      <p>Clique em "Novo usuário" para adicionar.</p>
    </div>`;
  }
  return users.map((u, i) => {
    const [bg, fg] = App.avatarColor(u.name);
    return `<div class="user-row">
      <div class="avatar" style="width:36px;height:36px;font-size:13px;
        background:${bg};color:${fg};flex-shrink:0">${u.initials||u.name[0]}</div>
      <div class="user-row__info">
        <div class="user-row__name">${u.name}</div>
        <div class="user-row__meta">
          ID: <code style="font-size:10px">${u.id}</code>
          ${u.email ? ` · ${u.email}` : ""}
          ${u.role  ? ` · ${u.role}`  : ""}
        </div>
      </div>
      <div class="user-row__actions">
        <button class="btn btn--ghost btn--sm" onclick="openUserModal(${i})"
          title="Editar">
          <i class="ti ti-pencil"></i>
        </button>
        <button class="btn btn--ghost btn--sm" onclick="deleteUser(${i})"
          title="Excluir" style="color:var(--c-red)">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>`;
  }).join("");
}

// ── Modal de usuário ─────────────────────────────────────────
window.openUserModal = function(index) {
  const users = adminLoadUsers();
  const isNew = index === null;
  const u     = isNew ? { id:"", name:"", initials:"", email:"", role:"" } : users[index];

  App.openModal(`
    <div class="modal__head">
      <div class="modal__title">
        <i class="ti ti-user-circle"></i>
        ${isNew ? "Novo usuário" : "Editar usuário"}
      </div>
      <button class="btn btn--ghost btn--sm" onclick="App.closeModal()">
        <i class="ti ti-x"></i>
      </button>
    </div>
    <div class="modal__body">

      <div class="field">
        <label>Nome completo *</label>
        <input id="au-name" class="input" type="text"
          value="${u.name}" placeholder="Ex: João Silva"
          oninput="autoInitials()">
      </div>

      <div class="fields-row fields-row--2">
        <div class="field">
          <label>Iniciais</label>
          <input id="au-initials" class="input" type="text"
            value="${u.initials}" placeholder="Ex: JS" maxlength="3"
            style="text-transform:uppercase">
          <div style="font-size:11px;color:var(--c-text-3);margin-top:3px">
            Gerado automaticamente pelo nome
          </div>
        </div>
        <div class="field">
          <label>Cargo / Área</label>
          <input id="au-role" class="input" type="text"
            value="${u.role||""}" placeholder="Ex: Engenheiro PDM">
        </div>
      </div>

      <div class="field">
        <label>E-mail</label>
        <input id="au-email" class="input" type="email"
          value="${u.email||""}" placeholder="joao@empresa.com">
      </div>

      <div class="field">
        <label>ID do usuário</label>
        <input id="au-id" class="input" type="text"
          value="${u.id || "u_"+Date.now().toString(36)}"
          ${isNew?"":"readonly style='background:var(--c-surface-2);color:var(--c-text-3)'"}>
        <div style="font-size:11px;color:var(--c-text-3);margin-top:3px">
          ${isNew ? "Gerado automaticamente. Pode personalizar." : "Não é possível alterar o ID de um usuário existente."}
        </div>
      </div>

      <!-- Preview do avatar -->
      <div style="display:flex;align-items:center;gap:10px;padding:10px;
        background:var(--c-surface-2);border-radius:var(--r-md)">
        <div id="au-preview" class="avatar"
          style="width:40px;height:40px;font-size:15px">
          ${u.initials||"?"}
        </div>
        <div>
          <div style="font-size:12px;font-weight:500" id="au-preview-name">${u.name||"Nome do usuário"}</div>
          <div style="font-size:11px;color:var(--c-text-3)" id="au-preview-role">${u.role||"Cargo"}</div>
        </div>
      </div>

    </div>
    <div class="modal__footer">
      ${!isNew ? `<button class="btn btn--danger btn--sm"
          onclick="deleteUser(${index},true)">
          <i class="ti ti-trash"></i>Excluir
        </button>` : ""}
      <div class="modal__footer-spacer"></div>
      <button class="btn btn--ghost" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn--primary" onclick="saveUser(${isNew?'null':index})">
        <i class="ti ti-check"></i>Salvar
      </button>
    </div>
  `);

  // Atualiza preview ao digitar
  updateUserPreview();
};

window.autoInitials = function() {
  const name = document.getElementById("au-name")?.value || "";
  const ini  = name.trim().split(/\s+/).filter(Boolean).slice(0,2)
    .map(n=>n[0].toUpperCase()).join("");
  const el = document.getElementById("au-initials");
  if (el) el.value = ini;
  updateUserPreview();
};

function updateUserPreview() {
  const name    = document.getElementById("au-name")?.value || "";
  const ini     = document.getElementById("au-initials")?.value || name[0]?.toUpperCase() || "?";
  const role    = document.getElementById("au-role")?.value || "Cargo";
  const preview = document.getElementById("au-preview");
  const pName   = document.getElementById("au-preview-name");
  const pRole   = document.getElementById("au-preview-role");

  if (preview) {
    preview.textContent = ini;
    const [bg, fg] = App.avatarColor(name || "?");
    preview.style.background = bg;
    preview.style.color = fg;
  }
  if (pName) pName.textContent = name || "Nome do usuário";
  if (pRole) pRole.textContent = role || "Cargo";
}

// Listener de digitação no modal
document.addEventListener("input", e => {
  if (e.target.id === "au-name" || e.target.id === "au-initials" || e.target.id === "au-role") {
    updateUserPreview();
  }
});

window.saveUser = function(index) {
  const name = document.getElementById("au-name")?.value?.trim();
  if (!name) { document.getElementById("au-name")?.focus(); return; }

  const id      = document.getElementById("au-id")?.value?.trim() || App.uid();
  const initials= (document.getElementById("au-initials")?.value || name[0]).toUpperCase();
  const email   = document.getElementById("au-email")?.value?.trim() || "";
  const role    = document.getElementById("au-role")?.value?.trim() || "";

  const users = adminLoadUsers();
  const user  = { id, name, initials, email, role };

  if (index === null || index === "null") {
    // Verificar ID duplicado
    if (users.some(u=>u.id===id)) {
      alert("Já existe um usuário com este ID. Altere o ID ou edite o usuário existente.");
      return;
    }
    users.push(user);
  } else {
    users[parseInt(index)] = user;
  }

  adminSaveUsers(users);
  App.closeModal();
  App.showToast("Usuário salvo.", "success");
  renderAdmin();
};

window.deleteUser = function(index, fromModal = false) {
  if (!confirm("Excluir este usuário?")) return;
  const users = adminLoadUsers();
  users.splice(index, 1);
  adminSaveUsers(users);
  if (fromModal) App.closeModal();
  App.showToast("Usuário excluído.", "success");
  renderAdmin();
};

// ── Exportar / Importar ──────────────────────────────────────
window.exportUsers = function() {
  const users = adminLoadUsers();
  const blob  = new Blob([JSON.stringify(users, null, 2)], {type:"application/json"});
  const a     = document.createElement("a");
  a.href      = URL.createObjectURL(blob);
  a.download  = "projectplanner-users.json";
  a.click();
};

window.importUsers = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const users = JSON.parse(e.target.result);
      if (!Array.isArray(users)) throw new Error("Formato inválido");
      adminSaveUsers(users);
      App.showToast(`${users.length} usuários importados.`, "success");
      renderAdmin();
    } catch (err) {
      App.showToast("Erro ao importar: " + err.message, "error");
    }
    input.value = "";
  };
  reader.readAsText(file);
};
