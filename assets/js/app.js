// Ponto de entrada: liga os dados (storage.js) e a interface (ui.js) aos
// elementos da página. Carregado como script clássico (não é um módulo ES)
// com `defer`, depois de storage.js e ui.js, para funcionar tanto em
// file:// quanto em um servidor HTTP.

// ---------- Referências de elementos ----------

const formCadastro = document.querySelector("#form-cadastro");
const botaoSalvar = document.querySelector("#btn-salvar");
const cadastroAlerta = document.querySelector("#cadastro-alerta");

const corpoLista = document.querySelector("#corpo-lista");
const totalAtividades = document.querySelector("#total-atividades");
const listaVazia = document.querySelector("#lista-vazia");

// ---------- Cadastro ----------

function validarFormulario(form) {
  form.querySelectorAll(".campo-erro").forEach((el) => el.classList.remove("campo-erro"));

  if (form.checkValidity()) return true;

  const invalidos = [...form.querySelectorAll(":invalid")];
  invalidos.forEach((el) => el.classList.add("campo-erro"));
  invalidos[0]?.focus();
  return false;
}

function criarLinhaTabela(atividade) {
  return Ui.criarEl("tr", {}, [
    Ui.criarEl("th", { scope: "row" }, atividade.titulo),
    Ui.criarEl("td", {}, atividade.autor),
    Ui.criarEl("td", {}, Ui.rotuloCategoria(atividade.categoria)),
    Ui.criarEl("td", {}, String(atividade.ano)),
    Ui.criarEl("td", {}, Ui.formatarPrazoCurto(atividade.prazo)),
    Ui.criarEl("td", {}, Ui.criarBadge(Ui.rotuloStatus(atividade.status), atividade.status)),
    Ui.criarEl("td", {}, Ui.criarBadge(Ui.rotuloPrioridade(atividade.prioridade), atividade.prioridade)),
    Ui.criarEl("td", {}, Ui.rotuloFormato(atividade.formato)),
    Ui.criarEl("td", {}, ""),
  ]);
}

function renderLista() {
  const atividades = Storage.obterTodas();

  corpoLista.replaceChildren(...atividades.map(criarLinhaTabela));
  totalAtividades.textContent = String(atividades.length);
  listaVazia.classList.toggle("oculto", atividades.length > 0);
}

formCadastro.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!validarFormulario(formCadastro)) {
    Ui.mostrarAlerta(cadastroAlerta, "Verifique os campos destacados em vermelho.", "erro");
    return;
  }

  const prioridadeSelecionada = formCadastro.querySelector('input[name="prioridade"]:checked');

  const atividade = {
    id: Storage.gerarId(),
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

  Ui.mostrarAlerta(cadastroAlerta, "Atividade cadastrada com sucesso.", "sucesso");
  renderLista();
});

// ---------- Inicialização ----------

renderLista();
