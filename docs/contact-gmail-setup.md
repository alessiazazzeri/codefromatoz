# Contact form: Google Workspace + Cloudflare Pages

## Stato e architettura

Il sito rimane Astro statico. Soltanto `/api/contact` esegue una Pages Function: nessun adapter Astro, dipendenza aggiuntiva, servizio di invio SaaS o CAPTCHA. `public/_routes.json` limita l'esecuzione delle Functions a questo endpoint.

La funzione invia con Gmail API dalla casella utente **info@codefromatoz.it** alla stessa casella. `Reply-To` contiene l'email del visitatore. Il visitatore non deve avere un account Google. L'autorizzazione OAuth riguarda esclusivamente il proprietario del sito.

Il codice è predisposto, ma l'invio reale richiede la configurazione sotto. I test automatici simulano Google: non attestano un invio reale. Il successo viene mostrato solo dopo che Gmail restituisce l'identificativo del messaggio accettato; non garantisce la consegna in inbox. Un timeout può lasciare l'esito incerto: nessun reinvio automatico.

## 1. Autorizzazione Google (amministratore/proprietario)

Non inserire credenziali in chat, Git, file pubblici o variabili con prefisso `PUBLIC_`.

1. Nella [Google Cloud Console](https://console.cloud.google.com/), crea o seleziona un progetto dell'organizzazione Workspace e abilita **Gmail API**.
2. Configura **Google Auth Platform / OAuth consent**. Preferisci un'app **Internal** dell'organizzazione Workspace, se disponibile. Un'app External lasciata in Testing può produrre refresh token che scadono dopo sette giorni: non è adatta all'invio stabile. Se Internal non è disponibile, verifica con Google i requisiti di pubblicazione e autorizzazione prima di proseguire.
3. Richiedi soltanto lo scope `https://www.googleapis.com/auth/gmail.send`. Non servono accesso alla lettura della posta o delega di dominio.
4. Crea un client OAuth **Web application**. Per ottenere una prima autorizzazione tramite lo strumento ufficiale Google, registra il redirect URI esatto `https://developers.google.com/oauthplayground`.
5. Apri [OAuth 2.0 Playground](https://developers.google.com/oauthplayground). Nelle impostazioni abilita **Use your own OAuth credentials**, inserendo il client ID e client secret appena creati. Usa accesso offline e consenso esplicito; autorizza lo scope sopra accedendo come **info@codefromatoz.it**.
6. Scambia il codice di autorizzazione e conserva il **refresh token** nei secret Cloudflare. Usa le tue credenziali OAuth, non quelle predefinite del Playground: i token ottenuti con le credenziali del Playground possono essere revocati automaticamente dopo 24 ore.

L'amministratore Workspace potrebbe dover consentire questa app nelle regole API dell'organizzazione. La revoca del consenso o del client interrompe l'invio: per ripristinarlo occorre una nuova autorizzazione. Nessuna password della casella è richiesta.

Riferimenti: [Gmail sending](https://developers.google.com/workspace/gmail/api/guides/sending), [OAuth offline access](https://developers.google.com/identity/protocols/oauth2/web-server#offline), [refresh token expiration](https://developers.google.com/identity/protocols/oauth2#expiration).

## 2. Configurazione Cloudflare (senza effettuare deploy in questo task)

Nel progetto Pages, aggiungi questi **secret server-side** alla configurazione delle Functions:

| Nome | Contenuto |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Client ID del progetto Google autorizzato |
| `GOOGLE_CLIENT_SECRET` | Client secret dello stesso client |
| `GOOGLE_REFRESH_TOKEN` | Refresh token autorizzato dalla casella info@codefromatoz.it |
| `CONTACT_FORM_SECRET` | Valore casuale privato di almeno 32 caratteri |

Puoi generare l'ultimo valore sul tuo computer con `openssl rand -hex 32`; copialo soltanto nel pannello secret. Non inviarlo in chat.

Crea inoltre un namespace **Workers KV** e collegalo alla Pages Function con nome binding **CONTACT_RATE_LIMIT**. Non contiene messaggi o indirizzi email: soltanto contatori e identificativi firmati temporanei. Usa un namespace separato per eventuali preview. Non aggiungere gli ID o valori dei secret al repository.

Build Pages: `npm run build`, output `dist`, Node compatibile con Astro 6 (l'ambiente di sviluppo usa Node 24). La directory `functions/` deve rimanere alla radice del repository: è elaborata da Pages separatamente dal build Astro. Il caricamento dei soli file statici `dist` non pubblica la funzione. Le configurazioni diventano operative con un successivo deploy autorizzato; questo task non esegue deploy e non modifica DNS.

Riferimenti: [Pages Functions](https://developers.cloudflare.com/pages/functions/), [bindings](https://developers.cloudflare.com/pages/functions/bindings/), [routing](https://developers.cloudflare.com/pages/functions/routing/).

## 3. Verifica locale

`npm run preview` mostra la UI statica ma non esegue Pages Functions: in quel contesto il form offre il fallback email e non simula un invio riuscito.

Per eseguire anche la funzione, dopo `npm run build` usa Wrangler senza aggiungerlo alle dipendenze del sito:

```sh
npx wrangler@4.151.1 pages dev dist --kv CONTACT_RATE_LIMIT --port 8788 --compatibility-date=2026-10-12
```

Per un invio reale locale, configura i quattro valori in `.dev.vars` sul tuo computer; è escluso da Git. Non condividere quel file. Senza credenziali la funzione risponde `503`, senza contattare Google. La KV locale è distinta da quella di produzione.

Prima dell'attivazione pubblica: completa separatamente l'informativa privacy, configura i secret e il binding, poi invia una richiesta di prova e verifica ricezione e Reply-To nella casella. La pagina legale attuale è un placeholder, non un'informativa completa.

## Validazione e antispam

- Validazione indipendente server-side: campi richiesti, opzioni consentite, email e limiti di lunghezza; body massimo 16 KiB.
- Controllo dell'origine, token HMAC senza cookie, durata un'ora e attesa minima due secondi; honeypot invisibile e non raggiungibile da tastiera.
- KV: limite indicativo di cinque tentativi validi per IP per ora e controllo di riutilizzo token. Sono protezioni **best effort**: KV ha consistenza eventuale e operazioni non atomiche, quindi non garantisce una quota rigida o esclusione dei duplicati concorrenti.
- L'IP viene trasformato con HMAC e chiave privata prima di generare la chiave KV; conservazione un'ora. Nessun IP in chiaro, messaggio o credenziale viene registrato dal codice. Le impostazioni di logging della piattaforma restano separate.
- Nessun CAPTCHA, tracking o consenso marketing. Se lo spam reale superasse queste protezioni, valutare separatamente un controllo aggiuntivo prima di introdurlo.
- Errori accessibili, dati conservati in caso di errore, nessun reset prima della conferma Gmail. Il browser non riceve token OAuth o dettagli delle risposte Google.
