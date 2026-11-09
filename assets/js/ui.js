const RES_CATEGORIA = {
  prova: "Prova",
  trabalho: "Trabalho",
  estudo: "Estudo",
  evento: "Evento escolar",
  outro: "Outro",
};

const RES_FORMATO = {
  presencial: "Presencial",
  online: "Online",
  "entrega-digital": "Entrega digital",
  "entrega-impressa": "Entrega impressa",
};

const RES_STATUS = {
  pendente: "Pendente",
  andamento: "Em andamento",
  concluida: "Concluída",
};

const RES_PRIORIDADE = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

// Cria um elemento com atributos e filhos (texto, nós ou arrays) de uma vez.
function criarEl(tag, atributos = {}, filhos = []) {
  const el = document.createElement(tag);

  for (const [chave, valor] of Object.entries(atributos)) {
    if (chave === "class") {
      el.className = valor;
    } else if (chave === "dataset") {
      Object.assign(el.dataset, valor);
    } else if (valor !== null && valor !== undefined) {
      el.setAttribute(chave, valor);
    }
  }

  for (const filho of Array.isArray(filhos) ? filhos : [filhos]) {
    if (filho === null || filho === undefined) continue;
    el.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }

  return el;
}

function criarBadge(texto, variante) {
  return criarEl("span", { class: `badge badge--${variante}` }, texto);
}

function rotuloCategoria(valor) {
  return RES_CATEGORIA[valor] ?? valor;
}

function rotuloFormato(valor) {
  return RES_FORMATO[valor] ?? valor;
}

function rotuloStatus(valor) {
  return RES_STATUS[valor] ?? valor;
}

function rotuloPrioridade(valor) {
  return RES_PRIORIDADE[valor] ?? valor;
}

// "2026-10-15T08:00" -> "15/10/2026 às 08h00"
function formatarPrazoCompleto(valorDatetimeLocal) {
  if (!valorDatetimeLocal) return "Sem prazo definido";
  const data = new Date(valorDatetimeLocal);
  if (Number.isNaN(data.getTime())) return "Sem prazo definido";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${data.getFullYear()} às ${hora}h${minuto}`;
}

// "2026-10-15T08:00" -> "15/10/2026"
function formatarPrazoCurto(valorDatetimeLocal) {
  if (!valorDatetimeLocal) return "—";
  const data = new Date(valorDatetimeLocal);
  if (Number.isNaN(data.getTime())) return "—";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

function mostrarAlerta(elemento, mensagem, tipo = "info") {
  elemento.textContent = mensagem;
  elemento.className = `alerta alerta--${tipo}`;
  elemento.classList.remove("oculto");
}

function ocultarAlerta(elemento) {
  elemento.classList.add("oculto");
}

const Ui = {
  criarEl,
  criarBadge,
  rotuloCategoria,
  rotuloFormato,
  rotuloStatus,
  rotuloPrioridade,
  formatarPrazoCompleto,
  formatarPrazoCurto,
  mostrarAlerta,
  ocultarAlerta,
};
