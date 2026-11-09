// Ponto de entrada: liga os dados (storage.js) e a interface (ui.js) aos
// elementos da página. Carregado como script clássico (não é um módulo ES)
// com `defer`, depois de storage.js e ui.js, para funcionar tanto em
// file:// quanto em um servidor HTTP.

// ---------- Referências de elementos ----------

const formCadastro = document.querySelector("#form-cadastro");
const campoId = document.querySelector("#atividade-id");
const botaoSalvar = document.querySelector("#btn-salvar");
const botaoCancelarEdicao = document.querySelector("#btn-cancelar-edicao");
const cadastroAlerta = document.querySelector("#cadastro-alerta");

const formFiltros = document.querySelector("#form-filtros");
const buscaInput = document.querySelector("#busca");
const filtroCategoria = document.querySelector("#filtro-categoria");
const filtroStatus = document.querySelector("#filtro-status");
const filtroPrioridade = document.querySelector("#filtro-prioridade");
const ordenarSelect = document.querySelector("#ordenar");
const corpoLista = document.querySelector("#corpo-lista");
const totalAtividades = document.querySelector("#total-atividades");
const listaVazia = document.querySelector("#lista-vazia");
const listagemAlerta = document.querySelector("#listagem-alerta");

const detalhesVazio = document.querySelector("#detalhes-vazio");
const cartaoDetalhes = document.querySelector("#cartao-detalhes");
const detalheTitulo = document.querySelector("#detalhe-titulo");
const detalheCategoria = document.querySelector("#detalhe-categoria");
const detalheAutor = document.querySelector("#detalhe-autor");
const detalheAno = document.querySelector("#detalhe-ano");
const detalhePrazo = document.querySelector("#detalhe-prazo");
const detalheStatus = document.querySelector("#detalhe-status");
const detalhePrioridade = document.querySelector("#detalhe-prioridade");
const detalheFormato = document.querySelector("#detalhe-formato");
const detalheAgenda = document.querySelector("#detalhe-agenda");
const detalheDescricao = document.querySelector("#detalhe-descricao");
const botaoDetalheEditar = document.querySelector("#detalhe-btn-editar");
const botaoDetalheExcluir = document.querySelector("#detalhe-btn-excluir");

const formImportar = document.querySelector("#form-importar");
const anoFeriadosInput = document.querySelector("#ano-feriados");
const importarAlerta = document.querySelector("#importar-alerta");
const importarResultado = document.querySelector("#importar-resultado");
const listaFeriados = document.querySelector("#lista-feriados");
const botaoImportarSelecionados = document.querySelector("#btn-importar-selecionados");

const agendaResumo = document.querySelector("#agenda-resumo");
const agendaStatus = document.querySelector("#agenda-status");
const botaoConectarAgenda = document.querySelector("#btn-conectar-agenda");
const agendaAlerta = document.querySelector("#agenda-alerta");

// ---------- Estado em memória ----------

let idEmEdicao = null;
let idDetalheAtual = null;
let ultimosFeriadosBuscados = [];

// ---------- Cadastro (criar/atualizar) ----------

function validarFormulario(form) {
  form.querySelectorAll(".campo-erro").forEach((el) => el.classList.remove("campo-erro"));

  if (form.checkValidity()) return true;

  const invalidos = [...form.querySelectorAll(":invalid")];
  invalidos.forEach((el) => el.classList.add("campo-erro"));
  invalidos[0]?.focus();
  return false;
}

function entrarEmModoEdicao(atividade) {
  idEmEdicao = atividade.id;

  campoId.value = atividade.id;
  formCadastro.titulo.value = atividade.titulo;
  formCadastro.autor.value = atividade.autor;
  formCadastro.categoria.value = atividade.categoria;
  formCadastro.ano.value = atividade.ano;
  formCadastro.prazo.value = atividade.prazo ?? "";
  formCadastro.formato.value = atividade.formato;
  formCadastro.status.value = atividade.status;
  formCadastro.descricao.value = atividade.descricao ?? "";
  formCadastro.sincronizar.checked = Boolean(atividade.sincronizar);

  const radioPrioridade = formCadastro.querySelector(`#prioridade-${atividade.prioridade}`);
  if (radioPrioridade) radioPrioridade.checked = true;

  botaoSalvar.textContent = "Atualizar atividade";
  botaoCancelarEdicao.classList.remove("oculto");
  Ui.ocultarAlerta(cadastroAlerta);

  document.querySelector("#cadastro").scrollIntoView({ behavior: "smooth", block: "start" });
  formCadastro.titulo.focus();
}

formCadastro.addEventListener("reset", () => {
  idEmEdicao = null;
  botaoSalvar.textContent = "Salvar atividade";
  botaoCancelarEdicao.classList.add("oculto");
  formCadastro.querySelectorAll(".campo-erro").forEach((el) => el.classList.remove("campo-erro"));
});

botaoCancelarEdicao.addEventListener("click", () => {
  formCadastro.reset();
  Ui.ocultarAlerta(cadastroAlerta);
});

function criarLinhaTabela(atividade) {
  const celulaAcoes = Ui.criarEl("div", { class: "acoes-linha" }, [
    Ui.criarEl(
      "a",
      { href: "#detalhes", class: "link-acao", dataset: { acao: "detalhes", id: atividade.id } },
      "Ver detalhes"
    ),
    Ui.criarEl(
      "button",
      { type: "button", class: "btn btn--sm btn--outline", dataset: { acao: "editar", id: atividade.id } },
      "Editar"
    ),
    Ui.criarEl(
      "button",
      { type: "button", class: "btn btn--sm btn--perigo", dataset: { acao: "excluir", id: atividade.id } },
      "Excluir"
    ),
  ]);

  return Ui.criarEl("tr", {}, [
    Ui.criarEl("th", { scope: "row" }, atividade.titulo),
    Ui.criarEl("td", {}, atividade.autor),
    Ui.criarEl("td", {}, Ui.rotuloCategoria(atividade.categoria)),
    Ui.criarEl("td", {}, String(atividade.ano)),
    Ui.criarEl("td", {}, Ui.formatarPrazoCurto(atividade.prazo)),
    Ui.criarEl("td", {}, Ui.criarBadge(Ui.rotuloStatus(atividade.status), atividade.status)),
    Ui.criarEl("td", {}, Ui.criarBadge(Ui.rotuloPrioridade(atividade.prioridade), atividade.prioridade)),
    Ui.criarEl("td", {}, Ui.rotuloFormato(atividade.formato)),
    Ui.criarEl("td", {}, celulaAcoes),
  ]);
}

function obterFiltrosAtuais() {
  return {
    busca: buscaInput.value.trim().toLowerCase(),
    categoria: filtroCategoria.value,
    status: filtroStatus.value,
    prioridade: filtroPrioridade.value,
    ordenar: ordenarSelect.value,
  };
}

function aplicarFiltros(atividades, filtros) {
  return atividades.filter((atividade) => {
    const correspondeBusca =
      !filtros.busca ||
      atividade.titulo.toLowerCase().includes(filtros.busca) ||
      atividade.autor.toLowerCase().includes(filtros.busca);
    const correspondeCategoria = !filtros.categoria || atividade.categoria === filtros.categoria;
    const correspondeStatus = !filtros.status || atividade.status === filtros.status;
    const correspondePrioridade = !filtros.prioridade || atividade.prioridade === filtros.prioridade;

    return correspondeBusca && correspondeCategoria && correspondeStatus && correspondePrioridade;
  });
}

const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };
const PESO_STATUS = { pendente: 0, andamento: 1, concluida: 2 };

function ordenarAtividades(atividades, criterio) {
  const copia = [...atividades];

  switch (criterio) {
    case "titulo":
      return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    case "prioridade":
      return copia.sort((a, b) => PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade]);
    case "status":
      return copia.sort((a, b) => PESO_STATUS[a.status] - PESO_STATUS[b.status]);
    default:
      return copia.sort((a, b) => {
        if (!a.prazo && !b.prazo) return 0;
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return a.prazo.localeCompare(b.prazo);
      });
  }
}

function renderLista() {
  const filtros = obterFiltrosAtuais();
  const atividadesFiltradas = ordenarAtividades(aplicarFiltros(Storage.obterTodas(), filtros), filtros.ordenar);

  corpoLista.replaceChildren(...atividadesFiltradas.map(criarLinhaTabela));
  totalAtividades.textContent = String(atividadesFiltradas.length);
  listaVazia.classList.toggle("oculto", atividadesFiltradas.length > 0);
}

[buscaInput, filtroCategoria, filtroStatus, filtroPrioridade, ordenarSelect].forEach((campo) => {
  campo.addEventListener(campo === buscaInput ? "input" : "change", renderLista);
});

formFiltros.addEventListener("submit", (evento) => {
  evento.preventDefault();
  renderLista();
});

formFiltros.addEventListener("reset", () => {
  renderLista();
});

corpoLista.addEventListener("click", (evento) => {
  const gatilho = evento.target.closest("[data-acao]");
  if (!gatilho) return;

  const { acao, id } = gatilho.dataset;

  if (acao === "detalhes") {
    evento.preventDefault();
    mostrarDetalhes(id);
  } else if (acao === "editar") {
    const atividade = Storage.obterPorId(id);
    if (atividade) entrarEmModoEdicao(atividade);
  } else if (acao === "excluir") {
    excluirAtividade(id);
  }
});

async function excluirAtividade(id) {
  const atividade = Storage.obterPorId(id);
  if (!atividade) return;

  const confirmou = window.confirm(`Excluir a atividade "${atividade.titulo}"? Essa ação não pode ser desfeita.`);
  if (!confirmou) return;

  if (atividade.googleEventId) {
    await GoogleAgenda.removerEvento(atividade.googleEventId);
  }

  Storage.remover(id);

  if (idDetalheAtual === id) limparDetalhes();
  if (idEmEdicao === id) formCadastro.reset();

  renderLista();
  renderAgendaResumo();
  Ui.mostrarAlerta(listagemAlerta, "Atividade excluída com sucesso.", "sucesso");
}

// ---------- Detalhes ----------

function mostrarDetalhes(id) {
  const atividade = Storage.obterPorId(id);
  if (!atividade) return;

  idDetalheAtual = id;

  detalhesVazio.classList.add("oculto");
  cartaoDetalhes.classList.remove("oculto");

  detalheTitulo.textContent = atividade.titulo;
  detalheCategoria.textContent = Ui.rotuloCategoria(atividade.categoria);
  detalheAutor.textContent = atividade.autor;
  detalheAno.textContent = String(atividade.ano);

  detalhePrazo.textContent = Ui.formatarPrazoCompleto(atividade.prazo);
  if (atividade.prazo) {
    detalhePrazo.setAttribute("datetime", atividade.prazo);
  } else {
    detalhePrazo.removeAttribute("datetime");
  }

  detalheStatus.textContent = Ui.rotuloStatus(atividade.status);
  detalheStatus.className = `badge badge--${atividade.status}`;

  detalhePrioridade.textContent = Ui.rotuloPrioridade(atividade.prioridade);
  detalhePrioridade.className = `badge badge--${atividade.prioridade}`;

  detalheFormato.textContent = Ui.rotuloFormato(atividade.formato);

  if (atividade.googleEventId) {
    detalheAgenda.textContent = "Sincronizada";
    detalheAgenda.className = "badge badge--sucesso";
  } else if (atividade.sincronizar) {
    detalheAgenda.textContent = "Pendente de sincronização";
    detalheAgenda.className = "badge badge--alerta";
  } else {
    detalheAgenda.textContent = "Não sincronizada";
    detalheAgenda.className = "badge badge--alerta";
  }

  detalheDescricao.textContent = atividade.descricao || "Sem descrição.";

  botaoDetalheEditar.dataset.id = atividade.id;
  botaoDetalheExcluir.dataset.id = atividade.id;

  document.querySelector("#detalhes").scrollIntoView({ behavior: "smooth", block: "start" });
}

function limparDetalhes() {
  idDetalheAtual = null;
  cartaoDetalhes.classList.add("oculto");
  detalhesVazio.classList.remove("oculto");
}

botaoDetalheEditar.addEventListener("click", () => {
  const id = botaoDetalheEditar.dataset.id;
  const atividade = id && Storage.obterPorId(id);
  if (atividade) entrarEmModoEdicao(atividade);
});

botaoDetalheExcluir.addEventListener("click", () => {
  const id = botaoDetalheExcluir.dataset.id;
  if (id) excluirAtividade(id);
});

formCadastro.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!validarFormulario(formCadastro)) {
    Ui.mostrarAlerta(cadastroAlerta, "Verifique os campos destacados em vermelho.", "erro");
    return;
  }

  const estavaEditando = Boolean(idEmEdicao);
  const prioridadeSelecionada = formCadastro.querySelector('input[name="prioridade"]:checked');
  const anterior = estavaEditando ? Storage.obterPorId(idEmEdicao) : null;

  const atividade = {
    id: idEmEdicao ?? Storage.gerarId(),
    titulo: formCadastro.titulo.value.trim(),
    autor: formCadastro.autor.value.trim(),
    categoria: formCadastro.categoria.value,
    ano: Number(formCadastro.ano.value),
    prazo: formCadastro.prazo.value,
    formato: formCadastro.formato.value,
    status: formCadastro.status.value,
    prioridade: prioridadeSelecionada ? prioridadeSelecionada.value : "media",
    descricao: formCadastro.descricao.value.trim(),
    sincronizar: formCadastro.sincronizar.checked,
    googleEventId: anterior?.googleEventId ?? null,
  };

  Storage.salvar(atividade);
  formCadastro.reset();

  const avisoAgenda = await sincronizarComGoogleSeNecessario(atividade);

  Ui.mostrarAlerta(
    cadastroAlerta,
    `${estavaEditando ? "Atividade atualizada com sucesso." : "Atividade cadastrada com sucesso."}${avisoAgenda}`,
    "sucesso"
  );
  renderLista();
  renderAgendaResumo();

  if (idDetalheAtual === atividade.id) {
    mostrarDetalhes(atividade.id);
  }
});

// Mantém a sincronização da atividade com o Google Agenda coerente com a
// caixa "sincronizar": cria/atualiza o evento quando marcada, remove quando
// desmarcada. Retorna um pequeno texto (ou string vazia) para anexar ao
// alerta de sucesso do cadastro.
async function sincronizarComGoogleSeNecessario(atividade) {
  if (atividade.sincronizar) {
    if (!GoogleAgenda.estaConectado()) {
      return " Conecte-se ao Google Agenda (na coluna à direita) para sincronizar.";
    }

    try {
      atividade.googleEventId = await GoogleAgenda.sincronizarAtividade(atividade);
      Storage.salvar(atividade);
      return " Sincronizada com o Google Agenda.";
    } catch (erro) {
      return ` Não foi possível sincronizar com o Google Agenda: ${erro.message}`;
    }
  }

  if (atividade.googleEventId) {
    await GoogleAgenda.removerEvento(atividade.googleEventId);
    atividade.googleEventId = null;
    Storage.salvar(atividade);
  }

  return "";
}

// ---------- Conexão com o Google Agenda ----------

function atualizarEstadoConexaoAgenda(conectado, mensagemErro) {
  agendaStatus.textContent = conectado ? "conectado" : "não conectado";
  agendaStatus.className = `badge badge--${conectado ? "sucesso" : "alerta"}`;
  botaoConectarAgenda.textContent = conectado ? "Desconectar do Google Agenda" : "Conectar ao Google Agenda";

  if (mensagemErro) {
    Ui.mostrarAlerta(agendaAlerta, mensagemErro, "erro");
  } else if (conectado) {
    Ui.mostrarAlerta(agendaAlerta, "Conectado. Sincronizando atividades marcadas…", "info");
  }
}

GoogleAgenda.aoConectar(async (conectado, mensagemErro) => {
  atualizarEstadoConexaoAgenda(conectado, mensagemErro);
  if (!conectado) return;

  const resultado = await sincronizarPendentesComGoogle();
  if (resultado.total === 0) {
    Ui.mostrarAlerta(agendaAlerta, "Conectado ao Google Agenda.", "sucesso");
  } else if (resultado.falhas === 0) {
    Ui.mostrarAlerta(agendaAlerta, `Conectado. ${resultado.total} atividade(s) sincronizada(s).`, "sucesso");
  } else {
    Ui.mostrarAlerta(
      agendaAlerta,
      `Conectado. ${resultado.total - resultado.falhas} sincronizada(s), ${resultado.falhas} falharam.`,
      "erro"
    );
  }

  renderLista();
  if (idDetalheAtual) mostrarDetalhes(idDetalheAtual);
});

// Sincroniza todas as atividades marcadas com "sincronizar" que ainda não
// têm um evento no Google Agenda (ex.: cadastradas antes de conectar).
async function sincronizarPendentesComGoogle() {
  const pendentes = Storage.obterTodas().filter((atividade) => atividade.sincronizar && !atividade.googleEventId);
  let falhas = 0;

  for (const atividade of pendentes) {
    try {
      atividade.googleEventId = await GoogleAgenda.sincronizarAtividade(atividade);
      Storage.salvar(atividade);
    } catch {
      falhas += 1;
    }
  }

  return { total: pendentes.length, falhas };
}

botaoConectarAgenda.addEventListener("click", () => {
  if (GoogleAgenda.estaConectado()) {
    GoogleAgenda.desconectar();
    return;
  }

  try {
    Ui.mostrarAlerta(agendaAlerta, "Abrindo login do Google…", "info");
    GoogleAgenda.conectar();
  } catch (erro) {
    Ui.mostrarAlerta(agendaAlerta, erro.message, "erro");
  }
});

// ---------- Resumo no aside (Google Agenda) ----------

function renderAgendaResumo() {
  const proximas = Storage.obterTodas()
    .filter((atividade) => Boolean(atividade.prazo))
    .sort((a, b) => a.prazo.localeCompare(b.prazo))
    .slice(0, 5);

  if (proximas.length === 0) {
    agendaResumo.replaceChildren(Ui.criarEl("li", {}, "Nenhuma atividade com prazo cadastrada."));
    return;
  }

  agendaResumo.replaceChildren(
    ...proximas.map((atividade) =>
      Ui.criarEl("li", {}, `${atividade.titulo} — ${Ui.formatarPrazoCurto(atividade.prazo)}`)
    )
  );
}

// ---------- Importação de feriados (BrasilAPI) ----------

function idDoFeriado(feriado) {
  return `feriado-${feriado.date}`;
}

function renderFeriadosEncontrados(feriados) {
  const idsExistentes = new Set(Storage.obterTodas().map((atividade) => atividade.id));

  listaFeriados.replaceChildren(
    ...feriados.map((feriado) => {
      const id = idDoFeriado(feriado);
      const texto = `${Ui.formatarPrazoCurto(`${feriado.date}T00:00`)} — ${feriado.name}`;

      if (idsExistentes.has(id)) {
        return Ui.criarEl("li", {}, Ui.criarEl("span", { class: "feriado-ja-importado" }, `${texto} (já importado)`));
      }

      const checkbox = Ui.criarEl("input", {
        type: "checkbox",
        value: feriado.date,
        dataset: { nome: feriado.name },
      });

      return Ui.criarEl("li", {}, Ui.criarEl("label", {}, [checkbox, document.createTextNode(texto)]));
    })
  );
}

formImportar.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const ano = Number(anoFeriadosInput.value);
  if (!ano) return;

  importarResultado.classList.add("oculto");
  Ui.mostrarAlerta(importarAlerta, "Buscando feriados…", "info");

  try {
    const feriados = await Api.buscarFeriados(ano);
    ultimosFeriadosBuscados = feriados;
    renderFeriadosEncontrados(feriados);
    importarResultado.classList.remove("oculto");
    Ui.ocultarAlerta(importarAlerta);
  } catch (erro) {
    Ui.mostrarAlerta(
      importarAlerta,
      erro instanceof Error ? erro.message : "Não foi possível buscar os feriados. Tente novamente.",
      "erro"
    );
  }
});

botaoImportarSelecionados.addEventListener("click", () => {
  const marcados = [...listaFeriados.querySelectorAll('input[type="checkbox"]:checked')];

  if (marcados.length === 0) {
    Ui.mostrarAlerta(importarAlerta, "Selecione ao menos um feriado para importar.", "erro");
    return;
  }

  for (const checkbox of marcados) {
    const dataIso = checkbox.value; // "AAAA-MM-DD"

    Storage.salvar({
      id: `feriado-${dataIso}`,
      titulo: checkbox.dataset.nome,
      autor: "Governo Federal (BrasilAPI)",
      categoria: "evento",
      ano: Number(dataIso.slice(0, 4)),
      prazo: `${dataIso}T00:00`,
      formato: "presencial",
      status: "pendente",
      prioridade: "baixa",
      descricao: "Feriado nacional importado automaticamente via BrasilAPI.",
      sincronizar: false,
    });
  }

  Ui.mostrarAlerta(importarAlerta, `${marcados.length} feriado(s) importado(s) para a listagem.`, "sucesso");
  renderFeriadosEncontrados(ultimosFeriadosBuscados);
  renderLista();
});

// ---------- Inicialização ----------

renderLista();
renderAgendaResumo();
