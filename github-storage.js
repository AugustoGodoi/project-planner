// ============================================================
//  github-storage.js — Persistência via GitHub API
//
//  Cada save faz um PUT na API do GitHub que commita o arquivo
//  data/projects.json diretamente no repositório.
//
//  Configuração: preencha GH_CONFIG abaixo ou use a tela de
//  setup que aparece na primeira vez que o site abre.
// ============================================================

const GH_CONFIG = {
  // Deixe vazio — será preenchido pelo usuário na tela de setup
  owner: "",   // seu usuário GitHub  ex: "augustosilva"
  repo:  "",   // nome do repositório ex: "project-planner"
  token: "",   // Personal Access Token (salvo no localStorage)
  branch: "main",
  dataFile: "data/projects.json",
};

// ── Carrega config do localStorage ──────────────────────────
function ghLoadConfig() {
  const raw = localStorage.getItem("pp_gh_config");
  if (raw) {
    try {
      const c = JSON.parse(raw);
      GH_CONFIG.owner  = c.owner  || "";
      GH_CONFIG.repo   = c.repo   || "";
      GH_CONFIG.token  = c.token  || "";
      GH_CONFIG.branch = c.branch || "main";
    } catch {}
  }
}

function ghSaveConfig(owner, repo, token, branch = "main") {
  GH_CONFIG.owner  = owner.trim();
  GH_CONFIG.repo   = repo.trim();
  GH_CONFIG.token  = token.trim();
  GH_CONFIG.branch = branch.trim() || "main";
  localStorage.setItem("pp_gh_config", JSON.stringify(GH_CONFIG));
}

function ghIsConfigured() {
  return !!(GH_CONFIG.owner && GH_CONFIG.repo && GH_CONFIG.token);
}

// ── GitHub API helpers ───────────────────────────────────────
async function ghRequest(path, method = "GET", body = null) {
  const url = `https://api.github.com${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${GH_CONFIG.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Lê o arquivo data/projects.json do repositório
// Retorna { content: Object, sha: string } ou null se não existe
async function ghReadData() {
  try {
    const data = await ghRequest(
      `/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/${GH_CONFIG.dataFile}?ref=${GH_CONFIG.branch}`
    );
    const decoded = JSON.parse(atob(data.content.replace(/\n/g, "")));
    return { content: decoded, sha: data.sha };
  } catch (e) {
    if (e.message?.includes("404") || e.message?.includes("Not Found")) {
      return null; // arquivo não existe ainda
    }
    throw e;
  }
}

// Escreve data/projects.json — cria ou atualiza (usa sha para update)
async function ghWriteData(projects, sha = null) {
  const content = btoa(unescape(encodeURIComponent(
    JSON.stringify({ projects }, null, 2)
  )));

  const body = {
    message: `chore: update projects [${new Date().toISOString().slice(0,16)}]`,
    content,
    branch: GH_CONFIG.branch,
  };
  if (sha) body.sha = sha; // necessário para update

  await ghRequest(
    `/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/${GH_CONFIG.dataFile}`,
    "PUT",
    body
  );
}

// Garante que a pasta data/ existe criando um .gitkeep se necessário
async function ghEnsureDataFolder() {
  try {
    await ghRequest(
      `/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/data/.gitkeep?ref=${GH_CONFIG.branch}`
    );
  } catch {
    // não existe — criar
    await ghRequest(
      `/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/data/.gitkeep`,
      "PUT",
      {
        message: "chore: create data folder",
        content: btoa(""),
        branch: GH_CONFIG.branch,
      }
    );
  }
}

// ── SHA cache (evita re-leitura desnecessária) ───────────────
let _ghSha = null;

// ── API pública ──────────────────────────────────────────────

// Carrega projetos do GitHub. Retorna array de projetos.
async function ghLoad() {
  const result = await ghReadData();
  if (!result) {
    _ghSha = null;
    return [];
  }
  _ghSha = result.sha;
  return result.content.projects || [];
}

// Salva lista completa de projetos no GitHub
async function ghSave(projects) {
  // Recarrega sha atual para evitar conflito
  try {
    const current = await ghReadData();
    _ghSha = current?.sha || null;
  } catch {}

  if (!_ghSha) await ghEnsureDataFolder();
  await ghWriteData(projects, _ghSha || undefined);

  // Atualiza sha após escrita
  try {
    const updated = await ghReadData();
    _ghSha = updated?.sha || null;
  } catch {}
}

// Testa se o token e repositório são válidos
async function ghTestConnection() {
  const data = await ghRequest(
    `/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}`
  );
  return !!data?.id;
}

window.GHStorage = {
  loadConfig:     ghLoadConfig,
  saveConfig:     ghSaveConfig,
  isConfigured:   ghIsConfigured,
  load:           ghLoad,
  save:           ghSave,
  testConnection: ghTestConnection,
};
