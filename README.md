# OtterNote

Trabalho de Desenvolvimento de Interfaces Web - PUC Minas.

Sistema web para organização acadêmica: tarefas, provas, trabalhos e eventos escolares.

- **Entidade principal:** Atividades (título, autor, categoria, ano, status, prioridade, formato)


## Histórico de versionamento: 
#### Etapa 1 — HTML e estrutura da interface
Estrutura semântica com cadastro, listagem (dados fictícios), pesquisa, filtros, ordenação, detalhes e botões de editar/excluir (ainda sem funcionamento).

#### Etapa 2 — CSS, layout e responsividade
Identidade visual própria (cores, tipografia e espaçamentos em variáveis CSS), layout construído com Grid (cabeçalho/conteúdo/aside/rodapé) e Flexbox (navegação, formulários, ações), componentes de interface (botões, badges de status/prioridade, alertas, cartões), estados de interação (`:hover`, `:focus-visible`, `:disabled`) e responsividade com breakpoints em 900px e 600px, sem rolagem horizontal.

#### Etapa 3 — JavaScript, dados e interatividade
- **CRUD completo com `localStorage`**: cadastro, edição e exclusão de atividades, com validação nativa (HTML5 `checkValidity`) e feedback visual (campos destacados, alertas de sucesso/erro).
- **Listagem dinâmica**: renderizada via JavaScript a partir dos dados salvos, sem marcação fixa no HTML.
- **Detalhes**: seção dedicada que exibe a atividade selecionada na listagem.
- **Pesquisa, filtro e ordenação**: busca em tempo real por título/autor, filtros por categoria/status/prioridade e ordenação por prazo, título, prioridade ou status.
- **API pública**: importação de feriados nacionais da [BrasilAPI](https://brasilapi.com.br/docs) (sem necessidade de chave) como eventos escolares.
- **Google Agenda (integração real)**: login OAuth 2.0 via Google Identity Services e sincronização de atividades marcadas com "Espelhar no Google Agenda" como eventos reais na agenda do usuário (criação, atualização e exclusão). Veja a configuração abaixo.
- Código modularizado em `assets/js/storage.js` (persistência), `assets/js/api.js` (consumo da BrasilAPI), `assets/js/google-agenda.js` (consumo da Google Calendar API), `assets/js/ui.js` (helpers de DOM/formatação), `assets/js/config.js` (configuração) e `assets/js/app.js` (orquestração e eventos).

```
index.html
pages/sobre.html
assets/css/style.css
assets/js/{storage,api,google-agenda,ui,config,app}.js
assets/img/
```

## Como testar localmente
Basta abrir `index.html` direto no navegador (duplo clique) — os scripts em `assets/js/` são carregados como scripts clássicos com `defer`, na ordem `storage.js` → `api.js` → `ui.js` → `app.js`, então funcionam tanto em `file://` quanto em um servidor local ou no GitHub Pages.

Se preferir servir por HTTP (opcional, mas recomendado para simular o ambiente de produção):

```bash
# com Node instalado
npx serve .

# ou com Python
python -m http.server 8080
```

A importação de feriados (seção "Importar feriados nacionais") depende de acesso à internet, pois consome a BrasilAPI (`https://brasilapi.com.br`); o restante do sistema (cadastro, listagem, filtros, detalhes) funciona totalmente offline com `localStorage`.

## Google Agenda: configurando a integração real

O botão "Conectar ao Google Agenda" usa a Google Calendar API de verdade. Isso exige um Client ID OAuth gratuito do seu próprio projeto no Google Cloud — sem ele, o botão mostra uma mensagem pedindo a configuração, mas o resto do sistema continua funcionando normalmente.

**Importante:** o login do Google exige que a página seja servida via `http://` ou `https://` (localhost ou GitHub Pages, por exemplo). Abrir `index.html` com duplo clique (`file://`) funciona para tudo, exceto para o login do Google — o Google não aceita esse tipo de origem.

### Passo a passo (Google Cloud Console)

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/) e crie um projeto novo (ou use um existente).
2. No menu "APIs e serviços" → "Biblioteca", procure por **Google Calendar API** e clique em "Ativar".
3. Vá em "APIs e serviços" → "Tela de permissão OAuth":
   - Tipo de usuário: **Externo**.
   - Preencha nome do app e e-mail de suporte.
   - Em "Escopos", adicione `https://www.googleapis.com/auth/calendar.events`.
   - Em "Usuários de teste", adicione o seu próprio e-mail do Google (enquanto o app não for publicado/verificado, só esses e-mails conseguem fazer login).
4. Vá em "APIs e serviços" → "Credenciais" → "Criar credenciais" → "ID do cliente OAuth":
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Em "Origens JavaScript autorizadas", adicione cada endereço de onde você vai abrir o projeto, por exemplo:
     - `http://localhost:8080` (se usar `python -m http.server 8080` ou `npx serve .`)
     - `https://seu-usuario.github.io` (para o GitHub Pages)
   - Crie e copie o **Client ID** gerado (termina em `.apps.googleusercontent.com`).
5. Cole o Client ID em [assets/js/config.js](assets/js/config.js):
   ```js
   const GoogleAgendaConfig = {
     clientId: "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com",
     escopo: "https://www.googleapis.com/auth/calendar.events",
   };
   ```
6. Sirva o projeto por HTTP na mesma origem cadastrada (ex.: `npx serve .` em `http://localhost:8080`) e clique em "Conectar ao Google Agenda". Na primeira vez, o Google vai avisar que o app não é verificado — como usuário de teste, clique em "Continuar" para autorizar.

Depois de conectado, qualquer atividade cadastrada/editada com "Espelhar no Google Agenda" marcado é criada ou atualizada como evento real na sua agenda; desmarcar a opção ou excluir a atividade remove o evento correspondente.
