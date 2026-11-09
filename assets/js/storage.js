// Camada de persistência: CRUD de atividades no localStorage.

const CHAVE = "otternote.atividades";

const DADOS_INICIAIS = [
  {
    id: "seed-1",
    titulo: "Prova de Matemática",
    autor: "Prof. Carlos Lima",
    categoria: "prova",
    ano: 2026,
    prazo: "2026-10-15T08:00",
    formato: "presencial",
    status: "pendente",
    prioridade: "alta",
    descricao: "Prova sobre funções do 1º e 2º graus e geometria plana. Levar calculadora científica.",
    sincronizar: true,
  },
  {
    id: "seed-2",
    titulo: "Relatório de Química",
    autor: "Profa. Marina Souza",
    categoria: "trabalho",
    ano: 2026,
    prazo: "2026-10-20T23:59",
    formato: "entrega-digital",
    status: "andamento",
    prioridade: "media",
    descricao: "Relatório sobre a prática de titulação ácido-base realizada em laboratório.",
    sincronizar: false,
  },
  {
    id: "seed-3",
    titulo: "Leitura de Dom Casmurro",
    autor: "Profa. Helena Alves",
    categoria: "estudo",
    ano: 2026,
    prazo: "2026-10-30T23:59",
    formato: "online",
    status: "pendente",
    prioridade: "baixa",
    descricao: "Leitura completa da obra para debate em sala.",
    sincronizar: false,
  },
  {
    id: "seed-4",
    titulo: "Feira de Ciências",
    autor: "Coordenação Pedagógica",
    categoria: "evento",
    ano: 2026,
    prazo: "2026-11-05T13:00",
    formato: "presencial",
    status: "pendente",
    prioridade: "alta",
    descricao: "Montagem dos projetos a partir das 11h, apresentação a partir das 13h.",
    sincronizar: true,
  },
  {
    id: "seed-5",
    titulo: "Seminário de História",
    autor: "Prof. Rogério Dias",
    categoria: "trabalho",
    ano: 2026,
    prazo: "2026-09-10T10:00",
    formato: "presencial",
    status: "concluida",
    prioridade: "media",
    descricao: "Apresentação em grupo sobre o período colonial brasileiro.",
    sincronizar: false,
  },
];

function obterTodas() {
  let dados;
  try {
    dados = JSON.parse(localStorage.getItem(CHAVE));
  } catch {
    dados = null;
  }

  if (!Array.isArray(dados)) {
    salvarTodas(DADOS_INICIAIS);
    return [...DADOS_INICIAIS];
  }

  return dados;
}

function salvarTodas(atividades) {
  localStorage.setItem(CHAVE, JSON.stringify(atividades));
}

function salvar(atividade) {
  const atividades = obterTodas();
  const indice = atividades.findIndex((item) => item.id === atividade.id);

  if (indice === -1) {
    atividades.push(atividade);
  } else {
    atividades[indice] = atividade;
  }

  salvarTodas(atividades);
  return atividade;
}

function remover(id) {
  const atividades = obterTodas().filter((item) => item.id !== id);
  salvarTodas(atividades);
}

function obterPorId(id) {
  return obterTodas().find((item) => item.id === id) ?? null;
}

function gerarId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `atividade-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const Storage = {
  obterTodas,
  salvar,
  remover,
  obterPorId,
  gerarId,
};
