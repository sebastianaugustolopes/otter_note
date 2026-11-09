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

const buscaInput = document.querySelector("#busca");
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

// ---------- Estado em memória ----------

let idEmEdicao = null;
let idDetalheAtual = null;

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
  };
}

function aplicarFiltros(atividades, filtros) {
  return atividades.filter((atividade) => {
    return (
      !filtros.busca ||
      atividade.titulo.toLowerCase().includes(filtros.busca) ||
      atividade.autor.toLowerCase().includes(filtros.busca)
    );
  });
}

function renderLista() {
  const filtros = obterFiltrosAtuais();
  const atividadesFiltradas = aplicarFiltros(Storage.obterTodas(), filtros);

  corpoLista.replaceChildren(...atividadesFiltradas.map(criarLinhaTabela));
  totalAtividades.textContent = String(atividadesFiltradas.length);
  listaVazia.classList.toggle("oculto", atividadesFiltradas.length > 0);
}

buscaInput.addEventListener("input", renderLista);

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

function excluirAtividade(id) {
  const atividade = Storage.obterPorId(id);
  if (!atividade) return;

  const confirmou = window.confirm(`Excluir a atividade "${atividade.titulo}"? Essa ação não pode ser desfeita.`);
  if (!confirmou) return;

  Storage.remover(id);

  if (idDetalheAtual === id) limparDetalhes();
  if (idEmEdicao === id) formCadastro.reset();

  renderLista();
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

  detalheAgenda.textContent = atividade.sincronizar ? "Sincronizada" : "Não sincronizada";
  detalheAgenda.className = `badge badge--${atividade.sincronizar ? "sucesso" : "alerta"}`;

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

formCadastro.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!validarFormulario(formCadastro)) {
    Ui.mostrarAlerta(cadastroAlerta, "Verifique os campos destacados em vermelho.", "erro");
    return;
  }

  const estavaEditando = Boolean(idEmEdicao);
  const prioridadeSelecionada = formCadastro.querySelector('input[name="prioridade"]:checked');

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
  };

  Storage.salvar(atividade);
  formCadastro.reset();

  Ui.mostrarAlerta(
    cadastroAlerta,
    estavaEditando ? "Atividade atualizada com sucesso." : "Atividade cadastrada com sucesso.",
    "sucesso"
  );
  renderLista();

  if (idDetalheAtual === atividade.id) {
    mostrarDetalhes(atividade.id);
  }
});

// ---------- Inicialização ----------

renderLista();
