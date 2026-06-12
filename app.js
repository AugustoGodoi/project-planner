// ============================================================
//  app.js — Core da aplicação (GitHub Pages + GitHub Storage)
// ============================================================

const AppState = {
  currentUser: null,           // definido após setup/login
  projects:    [],
  language:    localStorage.getItem("pp_lang") || "pt",
  saving:      false,          // lock para evitar saves simultâneos
};

// ── i18n ────────────────────────────────────────────────────
const i18n = {
  pt: {
    dashboard:"Dashboard", projects:"Projetos",
    loading:"Carregando…", save:"Salvar", cancel:"Cancelar", delete:"Excluir",
    saveSuccess:"Salvo com sucesso.", saveError:"Erro ao salvar.",
    savingMsg:"Salvando no GitHub…",
    deleteConfirm:"Tem certeza que deseja excluir?",
    active:"Ativo", paused:"Pausado", completed:"Concluído", critical:"Crítico",
    high:"Alta", medium:"Média", low:"Baixa",
    notStarted:"Não iniciada", inProgress:"Em andamento", delayed:"Atrasada",
    noProjects:"Nenhum projeto ainda.", createFirst:"Crie o primeiro projeto para começar.",
    newProject:"Novo projeto", editProject:"Editar projeto", deleteProject:"Excluir projeto",
    newTask:"Nova tarefa", editTask:"Editar tarefa",
    name:"Nome", description:"Descrição", startDate:"Início", endDate:"Término",
    status:"Status", priority:"Prioridade", progress:"Progresso",
    owner:"Responsável", assignee:"Responsável", notes:"Observações",
    parentTask:"Tarefa pai", milestone:"Marco", dependsOn:"Depende de",
    depType:"Tipo", addDep:"+ dependência",
    myTasks:"Minhas tarefas", workload:"Carga de trabalho", myProjects:"Meus projetos",
    activeProjects:"Projetos ativos", assignedTasks:"Tarefas atribuídas",
    overdue:"Atrasadas", dueSoon:"Vencem em 7 dias",
    searchProjects:"Buscar projetos…",
    all:"Todos", mine:"Meus",
    backToProjects:"← Projetos",
    members:"Membros", addMember:"Adicionar membro",
    day:"Dia", week:"Semana", month:"Mês",
    noTasksYet:"Nenhuma tarefa ainda.", addFirstTask:"Adicione a primeira tarefa.",
    conclusaoGeral:"Conclusão geral", tasks:"tarefas",
    setupTitle:"Configuração do ProjectPlanner",
    setupSub:"Informe os dados do repositório GitHub onde os projetos serão salvos.",
    ghOwner:"Usuário GitHub", ghRepo:"Repositório", ghToken:"Personal Access Token",
    ghBranch:"Branch", testConn:"Testar conexão", connOk:"Conexão OK!",
    connFail:"Falha na conexão. Verifique os dados.",
    yourName:"Seu nome", continueBtn:"Continuar",
    whoAreYou:"Como você se chama?",
    setupSettings:"Configurações do GitHub",
    resetSetup:"Reconfigurar",
  },
  en: {
    dashboard:"Dashboard", projects:"Projects",
    loading:"Loading…", save:"Save", cancel:"Cancel", delete:"Delete",
    saveSuccess:"Saved successfully.", saveError:"Error saving.",
    savingMsg:"Saving to GitHub…",
    deleteConfirm:"Are you sure you want to delete?",
    active:"Active", paused:"Paused", completed:"Completed", critical:"Critical",
    high:"High", medium:"Medium", low:"Low",
    notStarted:"Not started", inProgress:"In progress", delayed:"Delayed",
    noProjects:"No projects yet.", createFirst:"Create the first project to get started.",
    newProject:"New project", editProject:"Edit project", deleteProject:"Delete project",
    newTask:"New task", editTask:"Edit task",
    name:"Name", description:"Description", startDate:"Start", endDate:"End",
    status:"Status", priority:"Priority", progress:"Progress",
    owner:"Owner", assignee:"Assignee", notes:"Notes",
    parentTask:"Parent task", milestone:"Milestone", dependsOn:"Depends on",
    depType:"Type", addDep:"+ dependency",
    myTasks:"My tasks", workload:"Workload", myProjects:"My projects",
    activeProjects:"Active projects", assignedTasks:"Assigned tasks",
    overdue:"Overdue", dueSoon:"Due in 7 days",
    searchProjects:"Search projects…",
    all:"All", mine:"Mine",
    backToProjects:"← Projects",
    members:"Members", addMember:"Add member",
    day:"Day", week:"Week", month:"Month",
    noTasksYet:"No tasks yet.", addFirstTask:"Add the first task.",
    conclusaoGeral:"Overall completion", tasks:"tasks",
    setupTitle:"ProjectPlanner Setup",
    setupSub:"Enter the GitHub repository details where projects will be saved.",
    ghOwner:"GitHub Username", ghRepo:"Repository", ghToken:"Personal Access Token",
    ghBranch:"Branch", testConn:"Test connection", connOk:"Connection OK!",
    connFail:"Connection failed. Check your details.",
    yourName:"Your name", continueBtn:"Continue",
    whoAreYou:"What is your name?",
    setupSettings:"GitHub Settings",
    resetSetup:"Reconfigure",
  },
};
function t(k){ return (i18n[AppState.language]||i18n.pt)[k]||k; }

// ── Modelos ──────────────────────────────────────────────────
function createProject(o={}){
  return { id:uid(), name:"", description:"", startDate:null, endDate:null,
    ownerId:AppState.currentUser?.id||"", ownerName:AppState.currentUser?.name||"",
    status:"active", priority:"medium", members:AppState.currentUser?[AppState.currentUser]:[], tasks:[], ...o };
}
function createTask(o={}){
  return { id:uid(), parentId:null, name:"", notes:"", startDate:null, endDate:null,
    assigneeId:AppState.currentUser?.id||null, assigneeName:AppState.currentUser?.name||"",
    progress:0, status:"not_started", isMilestone:false, dependencies:[], order:0, ...o };
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2); }

// ── CRUD com persistência no GitHub ─────────────────────────
async function saveProject(p) {
  p.updatedAt = new Date().toISOString();
  const i = AppState.projects.findIndex(x => x.id === p.id);
  if (i >= 0) AppState.projects[i] = p; else AppState.projects.push(p);

  await ghPersist();
  return p;
}

async function deleteProject(id) {
  AppState.projects = AppState.projects.filter(p => p.id !== id);
  await ghPersist();
}

function getProject(id) { return AppState.projects.find(p => p.id === id) || null; }

// Persiste toda a lista no GitHub com feedback visual
async function ghPersist() {
  if (AppState.saving) return; // evita race condition
  AppState.saving = true;
  showToast(t("savingMsg"), "info");
  try {
    await GHStorage.save(AppState.projects);
    showToast(t("saveSuccess"), "success");
  } catch (e) {
    console.error("ghPersist:", e);
    showToast(t("saveError") + " " + e.message, "error");
  } finally {
    AppState.saving = false;
  }
}

// ── Helpers de dados ─────────────────────────────────────────
function projectProgress(p){
  const tasks=(p.tasks||[]).filter(t=>!t.isMilestone);
  if(!tasks.length) return 0;
  return Math.round(tasks.reduce((s,t)=>s+(t.progress||0),0)/tasks.length);
}
function isOverdue(task){
  if(!task.endDate||task.status==="completed") return false;
  return new Date(task.endDate+"T23:59:59")<new Date();
}
function isDueSoon(task){
  if(!task.endDate||task.status==="completed"||isOverdue(task)) return false;
  return (new Date(task.endDate+"T23:59:59")-new Date()) <= 7*864e5;
}
function taskDotColor(task){
  if(task.status==="completed")  return "green";
  if(isOverdue(task))            return "red";
  if(isDueSoon(task))            return "amber";
  if(task.status==="in_progress")return "blue";
  return "gray";
}
function getMyTasks(){
  const id=AppState.currentUser?.id;
  return AppState.projects.flatMap(p=>(p.tasks||[])
    .filter(t=>t.assigneeId===id)
    .map(t=>({...t,projectId:p.id,projectName:p.name})));
}
function getMyProjects(){
  const id=AppState.currentUser?.id;
  return AppState.projects.filter(p=>
    p.ownerId===id||(p.members||[]).some(m=>m.id===id));
}
function formatDate(iso){
  if(!iso) return "—";
  return new Date(iso+"T00:00:00").toLocaleDateString(
    AppState.language==="pt"?"pt-BR":"en-US",{day:"2-digit",month:"2-digit",year:"2-digit"});
}

// ── Avatar ───────────────────────────────────────────────────
const AV_COLORS=[
  ["#B5D4F4","#0C447C"],["#9FE1CB","#085041"],["#FAC775","#633806"],
  ["#F4C0D1","#72243E"],["#DDD6FB","#3E24A8"],["#FBC8A0","#7A3510"],
];
function avatarColor(name){
  let h=0; for(const c of(name||"?")) h=(h*31+c.charCodeAt(0))&0xFFFFFF;
  return AV_COLORS[h%AV_COLORS.length];
}
function avatarEl(name,size=24){
  const ini=(name||"?").trim().split(/\s+/).slice(0,2).map(n=>n[0].toUpperCase()).join("");
  const [bg,fg]=avatarColor(name);
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.38)}px;background:${bg};color:${fg}">${ini}</div>`;
}

// ── Badges ───────────────────────────────────────────────────
function statusBadge(status){
  const m={active:"badge--active",paused:"badge--paused",completed:"badge--completed",critical:"badge--critical"};
  const l={active:t("active"),paused:t("paused"),completed:t("completed"),critical:t("critical")};
  return `<span class="badge ${m[status]||"badge--active"}">${l[status]||status}</span>`;
}
function priorityBadge(priority){
  const m={high:"badge--high",medium:"badge--medium",low:"badge--low"};
  const l={high:t("high"),medium:t("medium"),low:t("low")};
  return `<span class="badge ${m[priority]||"badge--medium"}">${l[priority]||priority}</span>`;
}
function progressColor(pct){
  if(pct===100) return "green";
  if(pct>=60)   return "";
  if(pct>=30)   return "amber";
  return "red";
}

// ── Roteador ─────────────────────────────────────────────────
const Router={
  routes:{},
  register(p,fn){this.routes[p]=fn;},
  navigate(p){window.location.hash=p;},
  async resolve(){
    const hash=window.location.hash.replace("#","")||"/dashboard";
    const parts=hash.split("/").filter(Boolean);
    if(this.routes[hash]){await this.routes[hash](parts);return;}
    if(parts[0]==="project"&&parts[1]){
      if(this.routes["/project/:id"]){await this.routes["/project/:id"](parts);return;}
    }
    const root="/"+(parts[0]||"dashboard");
    if(this.routes[root]){await this.routes[root](parts);return;}
    Router.navigate("/dashboard");
  },
};
window.addEventListener("hashchange",()=>Router.resolve());

// ── UI helpers ───────────────────────────────────────────────
function renderPage(html){
  const el=document.getElementById("app-content");
  if(el) el.innerHTML=html;
}
function setActiveNav(route){
  document.querySelectorAll(".topnav__link").forEach(el=>{
    el.classList.toggle("topnav__link--active",el.dataset.route===route);
  });
}
function showToast(msg,type="info"){
  const c=document.getElementById("toast-container");
  if(!c) return;
  const el=document.createElement("div");
  el.className=`toast toast--${type}`;
  el.textContent=msg;
  c.appendChild(el);
  setTimeout(()=>el.classList.add("toast--visible"),10);
  setTimeout(()=>{el.classList.remove("toast--visible");setTimeout(()=>el.remove(),300);},3000);
}
function openModal(html){
  closeModal();
  const ov=document.createElement("div");
  ov.className="modal-overlay"; ov.id="modal-overlay";
  ov.innerHTML=`<div class="modal">${html}</div>`;
  ov.addEventListener("click",e=>{if(e.target===ov)closeModal();});
  document.body.appendChild(ov);
}
function closeModal(){ document.getElementById("modal-overlay")?.remove(); }

function showScreen(name){
  document.querySelectorAll("[data-screen]").forEach(el=>{
    el.style.display = el.dataset.screen===name ? "" : "none";
  });
}

// ── Tela de setup do GitHub ──────────────────────────────────
function showSetupScreen() {
  const cfg = GH_CONFIG;
  document.getElementById("setup-owner").value  = cfg.owner  || "";
  document.getElementById("setup-repo").value   = cfg.repo   || "";
  document.getElementById("setup-token").value  = cfg.token  || "";
  document.getElementById("setup-branch").value = cfg.branch || "main";
  showScreen("setup");
}

window.testGhConnection = async function() {
  const btn = document.getElementById("setup-test-btn");
  const msg = document.getElementById("setup-test-msg");
  btn.disabled = true;
  msg.textContent = "…";
  try {
    GHStorage.saveConfig(
      document.getElementById("setup-owner").value,
      document.getElementById("setup-repo").value,
      document.getElementById("setup-token").value,
      document.getElementById("setup-branch").value,
    );
    await GHStorage.testConnection();
    msg.textContent = t("connOk");
    msg.style.color = "var(--c-green)";
  } catch(e) {
    msg.textContent = t("connFail") + " (" + e.message + ")";
    msg.style.color = "var(--c-red)";
  } finally { btn.disabled = false; }
};

window.saveSetup = async function() {
  const owner  = document.getElementById("setup-owner").value.trim();
  const repo   = document.getElementById("setup-repo").value.trim();
  const token  = document.getElementById("setup-token").value.trim();
  const branch = document.getElementById("setup-branch").value.trim() || "main";

  if (!owner||!repo||!token) {
    alert("Preencha todos os campos obrigatórios."); return;
  }

  GHStorage.saveConfig(owner, repo, token, branch);
  await startApp();
};

// ── Tela de identificação de usuário ────────────────────────
function showUserScreen() {
  showScreen("user");
  const inp = document.getElementById("user-input");
  const btn = document.getElementById("user-btn");
  inp?.focus();
  inp?.addEventListener("keydown", e => { if(e.key==="Enter") confirmUser(); });
  btn?.addEventListener("click", confirmUser);
}

function confirmUser() {
  const name = document.getElementById("user-input")?.value?.trim();
  if (!name) return;
  const initials = name.split(/\s+/).slice(0,2).map(n=>n[0].toUpperCase()).join("");
  const id = "u_" + name.toLowerCase().replace(/\s+/g,"_");
  AppState.currentUser = { id, name, initials };
  localStorage.setItem("pp_user", JSON.stringify(AppState.currentUser));
  startApp();
}

// ── Init ─────────────────────────────────────────────────────
async function init() {
  GHStorage.loadConfig();

  // Recuperar usuário salvo
  const rawUser = localStorage.getItem("pp_user");
  if (rawUser) {
    try { AppState.currentUser = JSON.parse(rawUser); } catch {}
  }

  // Se não configurado → tela de setup
  if (!GHStorage.isConfigured()) {
    showSetupScreen();
    return;
  }

  // Se não tem usuário → tela de identificação
  if (!AppState.currentUser) {
    showUserScreen();
    return;
  }

  await startApp();
}

async function startApp() {
  showScreen("loading");

  try {
    const projects = await GHStorage.load();
    AppState.projects = projects;
  } catch (e) {
    console.error("load:", e);
    // Se falhou mas temos config → pode ser repo vazio, continuar
    AppState.projects = [];
  }

  showScreen("app");
  updateNavUser();

  Router.register("/dashboard",   renderDashboard);
  Router.register("/projects",    renderProjectList);
  Router.register("/project/new", ()=>openProjectForm(null));
  Router.register("/project/:id", renderProjectGantt);

  await Router.resolve();
}

function updateNavUser() {
  const u = AppState.currentUser;
  if (!u) return;
  const ne = document.getElementById("nav-user-name");
  const ae = document.getElementById("nav-user-avatar");
  if (ne) ne.textContent = u.name;
  if (ae) {
    ae.textContent = u.initials || u.name[0];
    const [bg,fg] = avatarColor(u.name);
    ae.style.background = bg;
    ae.style.color = fg;
  }
}

// Trocar usuário
window.resetUser = function() {
  if (!confirm("Trocar de usuário?")) return;
  localStorage.removeItem("pp_user");
  AppState.currentUser = null;
  showUserScreen();
};

// Reconfigurar GitHub
window.openSettings = function() {
  showSetupScreen();
};

window.App = {
  state: AppState, t,
  saveProject, deleteProject, getProject,
  createProject, createTask,
  projectProgress, isOverdue, isDueSoon, taskDotColor,
  getMyTasks, getMyProjects, formatDate,
  avatarEl, avatarColor, statusBadge, priorityBadge, progressColor,
  navigate: p => Router.navigate(p),
  showToast, renderPage, setActiveNav, openModal, closeModal,
  updateNavUser,
};

document.addEventListener("DOMContentLoaded", init);
