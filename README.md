# ProjectPlanner — GitHub Pages

## Setup em 5 passos

### 1. Criar o repositório no GitHub
1. Acesse github.com/new
2. Nome: `project-planner` (ou qualquer nome)
3. Visibilidade: **Public** (necessário para GitHub Pages gratuito)
4. Marque "Add a README file"
5. Clique em **Create repository**

---

### 2. Fazer upload dos arquivos
No repositório → Add file → Upload files → arraste tudo mantendo a estrutura:
```
index.html
app.js
github-storage.js
mock-data.js
pages/dashboard.js
pages/project-list.js
pages/project-gantt.js
pages/project-form.js
```
Clique em **Commit changes**.

---

### 3. Ativar GitHub Pages
Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save

Após ~1 minuto a URL estará disponível:
`https://SEU-USUARIO.github.io/project-planner`

---

### 4. Criar Personal Access Token
1. github.com/settings/tokens/new
2. Note: ProjectPlanner | Expiration: 1 year
3. Escopo: marque apenas **repo**
4. Generate token → **copie agora** (aparece só uma vez)

---

### 5. Configurar o site
Abra a URL → preencha o formulário de setup → Testar conexão → Salvar.
Cada pessoa faz isso uma vez no próprio dispositivo.

---

## Compartilhar com a equipe
Envie a URL do GitHub Pages. Cada pessoa faz o setup com o mesmo token
(ou crie um token compartilhado de equipe).

---

## Limitações
- Saves simultâneos podem gerar conflito de SHA — basta salvar novamente
- Cada save demora ~1-3s (chamada à API GitHub)
- Repositório público: o data/projects.json fica visível publicamente
