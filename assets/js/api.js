// Integração com a BrasilAPI (API pública, sem chave) para
// importar feriados nacionais como eventos escolares.

const URL_BASE = "https://brasilapi.com.br/api/feriados/v1";

// Retorna uma lista de { date: "AAAA-MM-DD", name, type } ou lança erro.
async function buscarFeriados(ano) {
  const resposta = await fetch(`${URL_BASE}/${ano}`);

  if (!resposta.ok) {
    throw new Error(`Não foi possível buscar feriados de ${ano} (HTTP ${resposta.status}).`);
  }

  return resposta.json();
}

const Api = {
  buscarFeriados,
};
