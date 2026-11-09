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

const corpoLista = document.querySelector("#corpo-lista");
const totalAtividades = document.querySelector("#total-atividades");
const listaVazia = document.querySelector("#lista-vazia");
const listagemAlerta = document.querySelector("#listagem-alerta");

// ---------- Estado em memória ----------

let idEmEdicao = null;

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

function renderLista() {
  const atividades = Storage.obterTodas();

  corpoLista.replaceChildren(...atividades.map(criarLinhaTabela));
  totalAtividades.textContent = String(atividades.length);
  listaVazia.classList.toggle("oculto", atividades.length > 0);
}

corpoLista.addEventListener("click", (evento) => {
  const gatilho = evento.target.closest("[data-acao]");
  if (!gatilho) return;

  const { acao, id } = gatilho.dataset;

  if (acao === "editar") {
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

  if (idEmEdicao === id) formCadastro.reset();

  renderLista();
  Ui.mostrarAlerta(listagemAlerta, "Atividade excluída com sucesso.", "sucesso");
}

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
});

// ---------- Inicialização ----------

renderLista();
