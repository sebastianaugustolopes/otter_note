const GoogleAgenda = (() => {
  const URL_EVENTOS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

  let tokenClient = null;
  let accessToken = null;
  let aoMudarConexao = () => {};

  function estaConectado() {
    return Boolean(accessToken);
  }

  function aoConectar(callback) {
    aoMudarConexao = callback;
  }

  function garantirTokenClient() {
    if (tokenClient) return tokenClient;

    if (typeof google === "undefined" || !google.accounts?.oauth2) {
      throw new Error("A biblioteca do Google ainda não carregou. Aguarde alguns segundos e tente novamente.");
    }

    if (!GoogleAgendaConfig.clientId) {
      throw new Error("Configure o clientId em assets/js/config.js (veja o README) antes de conectar.");
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GoogleAgendaConfig.clientId,
      scope: GoogleAgendaConfig.escopo,
      callback: (resposta) => {
        if (resposta.error) {
          aoMudarConexao(false, resposta.error_description || resposta.error);
          return;
        }
        accessToken = resposta.access_token;
        aoMudarConexao(true, null);
      },
    });

    return tokenClient;
  }

  function conectar() {
    const cliente = garantirTokenClient();
    cliente.requestAccessToken({ prompt: accessToken ? "" : "consent" });
  }

  function desconectar() {
    if (accessToken && typeof google !== "undefined") {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    aoMudarConexao(false, null);
  }

  async function chamarApi(caminho, opcoes = {}) {
    const resposta = await fetch(`${URL_EVENTOS}${caminho}`, {
      ...opcoes,
      headers: {
        ...opcoes.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!resposta.ok) {
      const corpoErro = await resposta.json().catch(() => null);
      throw new Error(corpoErro?.error?.message || `Erro ao comunicar com o Google Agenda (HTTP ${resposta.status}).`);
    }

    if (resposta.status === 204) return null;
    return resposta.json();
  }

  // Converte uma atividade do OtterNote em um evento no formato da Calendar API.
  function paraEventoGoogle(atividade) {
    const fusoHorario = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const inicio = atividade.prazo || `${new Date().toISOString().slice(0, 10)}T08:00`;
    const dataInicio = new Date(inicio);
    const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000);

    return {
      summary: atividade.titulo,
      description: [
        atividade.descricao,
        `Cadastrada no OtterNote — categoria: ${atividade.categoria}, status: ${atividade.status}, prioridade: ${atividade.prioridade}.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      start: { dateTime: dataInicio.toISOString(), timeZone: fusoHorario },
      end: { dateTime: dataFim.toISOString(), timeZone: fusoHorario },
    };
  }

  // Cria o evento (se a atividade ainda não tiver googleEventId) ou atualiza
  // o existente. Retorna o id do evento no Google Agenda.
  async function sincronizarAtividade(atividade) {
    if (!estaConectado()) {
      throw new Error("Conecte-se ao Google Agenda antes de sincronizar.");
    }

    const corpo = paraEventoGoogle(atividade);

    if (atividade.googleEventId) {
      const evento = await chamarApi(`/${atividade.googleEventId}`, {
        method: "PATCH",
        body: JSON.stringify(corpo),
      });
      return evento.id;
    }

    const evento = await chamarApi("", {
      method: "POST",
      body: JSON.stringify(corpo),
    });
    return evento.id;
  }

  // Exclusão best-effort: se já estiver desconectado ou o evento não existir
  // mais no Google Agenda, apenas ignora (a atividade já está sendo removida
  // do OtterNote de qualquer forma).
  async function removerEvento(googleEventId) {
    if (!googleEventId || !estaConectado()) return;
    await chamarApi(`/${googleEventId}`, { method: "DELETE" }).catch(() => {});
  }

  return {
    estaConectado,
    aoConectar,
    conectar,
    desconectar,
    sincronizarAtividade,
    removerEvento,
  };
})();
