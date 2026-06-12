// ============================================================
//  mock-data.js — Dados fictícios para demonstração
// ============================================================

const MOCK_USERS = [
  { id: "u1", name: "Augusto Silva",  initials: "AS" },
  { id: "u2", name: "Marina Rocha",  initials: "MR" },
  { id: "u3", name: "João Kubo",     initials: "JK" },
  { id: "u4", name: "Laura Pinto",   initials: "LP" },
  { id: "u5", name: "Carlos Melo",   initials: "CM" },
];

const MOCK_PROJECTS = [
  {
    id: "p1",
    name: "T1EJ — PDU PHEV",
    description: "Desenvolvimento da unidade de distribuição de energia para veículo PHEV — planta Jacareí, SP",
    startDate: "2025-05-01",
    endDate:   "2025-07-26",
    ownerId:   "u1", ownerName: "Augusto Silva",
    status:    "active", priority: "high",
    members:   [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]],
    tasks: [
      {
        id:"t1", parentId:null, name:"1. Planejamento", notes:"", isMilestone:false,
        startDate:"2025-05-01", endDate:"2025-06-14",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:60,
        status:"in_progress", dependencies:[], order:0
      },
      {
        id:"t2", parentId:"t1", name:"1.1 Levantamento de requisitos", notes:"Normas Q/SQR aplicáveis",
        isMilestone:false, startDate:"2025-05-01", endDate:"2025-05-31",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:100,
        status:"completed", dependencies:[], order:1
      },
      {
        id:"t3", parentId:"t1", name:"1.2 Escopo técnico", notes:"Aguardando validação do cliente",
        isMilestone:false, startDate:"2025-06-02", endDate:"2025-06-10",
        assigneeId:"u2", assigneeName:"Marina Rocha", progress:40,
        status:"in_progress", dependencies:[{taskId:"t2",type:"FS"}], order:2
      },
      {
        id:"t4", parentId:null, name:"2. Desenvolvimento", notes:"", isMilestone:false,
        startDate:"2025-06-16", endDate:"2025-07-05",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:20,
        status:"in_progress", dependencies:[], order:3
      },
      {
        id:"t5", parentId:"t4", name:"2.1 Projeto elétrico PDU", notes:"Verificar IEC 60664",
        isMilestone:false, startDate:"2025-06-16", endDate:"2025-06-28",
        assigneeId:"u3", assigneeName:"João Kubo", progress:30,
        status:"in_progress", dependencies:[{taskId:"t3",type:"FS"}], order:4
      },
      {
        id:"t6", parentId:"t4", name:"2.2 Simulação térmica", notes:"",
        isMilestone:false, startDate:"2025-06-23", endDate:"2025-07-05",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:0,
        status:"not_started", dependencies:[{taskId:"t5",type:"SS"}], order:5
      },
      {
        id:"t7", parentId:"t4", name:"✦ Marco: Aprovação design", notes:"",
        isMilestone:true, startDate:"2025-07-05", endDate:"2025-07-05",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:0,
        status:"not_started", dependencies:[{taskId:"t6",type:"FS"}], order:6
      },
      {
        id:"t8", parentId:null, name:"3. Validação", notes:"", isMilestone:false,
        startDate:"2025-07-07", endDate:"2025-07-26",
        assigneeId:"u2", assigneeName:"Marina Rocha", progress:0,
        status:"not_started", dependencies:[], order:7
      },
      {
        id:"t9", parentId:"t8", name:"3.1 Testes DV", notes:"",
        isMilestone:false, startDate:"2025-07-07", endDate:"2025-07-19",
        assigneeId:"u2", assigneeName:"Marina Rocha", progress:0,
        status:"not_started", dependencies:[{taskId:"t7",type:"FS"}], order:8
      },
      {
        id:"t10", parentId:"t8", name:"3.2 Relatório final", notes:"",
        isMilestone:false, startDate:"2025-07-14", endDate:"2025-07-26",
        assigneeId:"u3", assigneeName:"João Kubo", progress:0,
        status:"not_started", dependencies:[{taskId:"t9",type:"SS"}], order:9
      },
    ]
  },
  {
    id: "p2",
    name: "Projeto Beta — Conector Frontal",
    description: "Redesign do conector frontal — integração com fornecedor Henan Tianhai",
    startDate: "2025-05-15", endDate: "2025-06-22",
    ownerId: "u3", ownerName: "João Kubo",
    status: "critical", priority: "high",
    members: [MOCK_USERS[2], MOCK_USERS[0]],
    tasks: [
      { id:"p2t1", parentId:null, name:"1. Análise de fornecedor", notes:"", isMilestone:false,
        startDate:"2025-05-15", endDate:"2025-05-31",
        assigneeId:"u3", assigneeName:"João Kubo", progress:100, status:"completed", dependencies:[], order:0 },
      { id:"p2t2", parentId:null, name:"2. Especificação técnica", notes:"Atrasada — aguardando dados do fornecedor",
        isMilestone:false, startDate:"2025-05-28", endDate:"2025-06-05",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:20, status:"delayed",
        dependencies:[{taskId:"p2t1",type:"FS"}], order:1 },
      { id:"p2t3", parentId:null, name:"3. Protótipo", notes:"",
        isMilestone:false, startDate:"2025-06-09", endDate:"2025-06-22",
        assigneeId:"u3", assigneeName:"João Kubo", progress:0, status:"not_started",
        dependencies:[{taskId:"p2t2",type:"FS"}], order:2 },
    ]
  },
  {
    id: "p3",
    name: "Projeto Gama — Validação Estamparia",
    description: "Validação de peças estampadas — linha de montagem Jacareí Q3",
    startDate: "2025-04-01", endDate: "2025-08-10",
    ownerId: "u2", ownerName: "Marina Rocha",
    status: "active", priority: "medium",
    members: [MOCK_USERS[1], MOCK_USERS[0], MOCK_USERS[3]],
    tasks: [
      { id:"p3t1", parentId:null, name:"1. Mapeamento de peças", notes:"", isMilestone:false,
        startDate:"2025-04-01", endDate:"2025-04-30",
        assigneeId:"u2", assigneeName:"Marina Rocha", progress:100, status:"completed", dependencies:[], order:0 },
      { id:"p3t2", parentId:null, name:"2. Testes dimensionais", notes:"", isMilestone:false,
        startDate:"2025-05-01", endDate:"2025-06-15",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:70, status:"in_progress",
        dependencies:[{taskId:"p3t1",type:"FS"}], order:1 },
      { id:"p3t3", parentId:null, name:"3. Relatório de conformidade", notes:"", isMilestone:false,
        startDate:"2025-06-16", endDate:"2025-07-15",
        assigneeId:"u4", assigneeName:"Laura Pinto", progress:0, status:"not_started",
        dependencies:[{taskId:"p3t2",type:"FS"}], order:2 },
      { id:"p3t4", parentId:null, name:"4. Aprovação final", notes:"", isMilestone:false,
        startDate:"2025-07-16", endDate:"2025-08-10",
        assigneeId:"u2", assigneeName:"Marina Rocha", progress:0, status:"not_started",
        dependencies:[{taskId:"p3t3",type:"FS"}], order:3 },
    ]
  },
  {
    id: "p4",
    name: "Projeto Alfa — Homologação MTA",
    description: "Documentação técnica de homologação — peças fornecedor MTA",
    startDate: "2025-03-01", endDate: "2025-06-30",
    ownerId: "u1", ownerName: "Augusto Silva",
    status: "active", priority: "low",
    members: [MOCK_USERS[0], MOCK_USERS[2]],
    tasks: [
      { id:"p4t1", parentId:null, name:"1. Coleta de documentos", notes:"", isMilestone:false,
        startDate:"2025-03-01", endDate:"2025-03-31",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:100, status:"completed", dependencies:[], order:0 },
      { id:"p4t2", parentId:null, name:"2. Revisão técnica", notes:"", isMilestone:false,
        startDate:"2025-04-01", endDate:"2025-05-15",
        assigneeId:"u3", assigneeName:"João Kubo", progress:100, status:"completed",
        dependencies:[{taskId:"p4t1",type:"FS"}], order:1 },
      { id:"p4t3", parentId:null, name:"3. Submissão ao cliente", notes:"", isMilestone:false,
        startDate:"2025-05-16", endDate:"2025-06-15",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:60, status:"in_progress",
        dependencies:[{taskId:"p4t2",type:"FS"}], order:2 },
      { id:"p4t4", parentId:null, name:"4. Aprovação final", notes:"", isMilestone:false,
        startDate:"2025-06-16", endDate:"2025-06-30",
        assigneeId:"u1", assigneeName:"Augusto Silva", progress:0, status:"not_started",
        dependencies:[{taskId:"p4t3",type:"FS"}], order:3 },
    ]
  },
  {
    id: "p5",
    name: "Projeto Delta — Normas ABNT Harness",
    description: "Revisão de normas ABNT para harness — aguardando aprovação da diretoria",
    startDate: "2025-04-01", endDate: "2025-09-30",
    ownerId: "u4", ownerName: "Laura Pinto",
    status: "paused", priority: "medium",
    members: [MOCK_USERS[3], MOCK_USERS[1]],
    tasks: [
      { id:"p5t1", parentId:null, name:"1. Levantamento normativo", notes:"", isMilestone:false,
        startDate:"2025-04-01", endDate:"2025-05-15",
        assigneeId:"u4", assigneeName:"Laura Pinto", progress:100, status:"completed", dependencies:[], order:0 },
      { id:"p5t2", parentId:null, name:"2. Análise de impacto", notes:"Pausado", isMilestone:false,
        startDate:"2025-05-16", endDate:"2025-07-31",
        assigneeId:"u2", assigneeName:"Marina Rocha", progress:20, status:"not_started",
        dependencies:[{taskId:"p5t1",type:"FS"}], order:1 },
    ]
  },
];

window.MOCK_USERS    = MOCK_USERS;
window.MOCK_PROJECTS = MOCK_PROJECTS;
