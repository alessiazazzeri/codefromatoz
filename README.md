# Code from A to Z

Portfolio di Alessia realizzato con Astro in modalità statica. Node.js 22.12+ (o 24+) e npm.

```sh
npm ci
npm run check
npm run build
npm run dev
```

`npm run preview` serve la build per la verifica locale. Output: `dist/`.

## Cloudflare Pages

Le pagine sono generate staticamente, senza adapter Astro SSR. La sola route `/api/contact` è gestita da una Cloudflare Pages Function in `functions/api/contact.ts`; `public/_routes.json` limita l'esecuzione delle Functions a questo endpoint.

Configurazione prevista: build `npm run build`, output `dist`, Node `24`. Il deploy deve elaborare anche `functions/` dalla radice del repository: pubblicare soltanto i file statici di `dist` non rende operativo il form. Il lockfile va mantenuto e l'installazione ripetuta con `npm ci`.

Prima dell'attivazione occorre autorizzare Gmail API tramite OAuth della casella Google Workspace, impostare i relativi secret server-side e la chiave privata del form su Cloudflare, creare un namespace KV e collegarlo con il binding `CONTACT_RATE_LIMIT`. Non inserire valori di credenziali nel repository o nel frontend. I passaggi sono descritti in [docs/contact-gmail-setup.md](docs/contact-gmail-setup.md). La configurazione di produzione e la verifica di un invio reale restano da completare; questo aggiornamento non esegue deploy né modifica DNS.

## Form di contatto

`/contact` raccoglie nome, email, esigenza e messaggio, con checkbox obbligatoria di presa visione dell'informativa privacy. Non richiede consenso marketing e non include altri campi di brief.

Flusso predisposto: browser → `/api/contact` → Pages Function → Gmail API → casella professionale. L'email del visitatore è utilizzata come `Reply-To`. Credenziali e token OAuth rimangono sul server.

Sono presenti validazione frontend e server-side, honeypot, token HMAC, controllo origine e riutilizzo token, oltre a un limite indicativo di cinque tentativi validi per IP/ora. KV conserva soltanto contatori e identificativi tecnici, con IP pseudonimizzato tramite HMAC e scadenza di un'ora. Il limite è best effort, perché KV non offre un contatore atomico. Il codice non archivia i messaggi in un database e non li scrive nei log; la conservazione delle email e dei log della piattaforma va definita separatamente.

La UI gestisce invio, successo confermato da Gmail ed errore, conservando il testo in caso di errore e offrendo il contatto email diretto. Senza i secret e il binding richiesti, l'API risponde con indisponibilità. `npm run dev` e `npm run preview` non eseguono Pages Functions; per il runtime locale completo consultare la guida sopra. I test automatici dell'invio simulano Google e non attestano una consegna reale.

Le pagine Privacy Policy e Cookie Policy sono ancora temporanee e vanno completate prima dell'attivazione pubblica. Non sono implementati cookie banner, CMP, CAPTCHA, Turnstile, analytics o tracking; la verifica va ripetuta sul deploy Cloudflare definitivo.

## Contenuti da completare

I visual dei quattro progetti sono segnaposto grafici originali, non screenshot o rappresentazioni del lavoro reale. Mancano descrizioni, case study, ritratto, biografia, dettagli dei servizi. Nessuna testimonianza o risultato commerciale inventato. I contatti sono collegati alla pagina `/contact` e alla casella professionale già fornita. Il progetto health ha un nome provvisorio.

Prima della pubblicazione aggiungere dominio definitivo e canonical/og:url, immagine social e contatti approvati. Non sono presenti analytics, cookie di tracciamento, font esterni o librerie di animazione esterne.

## Interfaccia

Componenti Astro, CSS responsive, font di sistema, decorazioni CSS, navigazione ad ancore, skip link, focus visibile e supporto reduced motion. Sotto 600px: copertina compatta, artwork orizzontale, progetti in sequenza sfalsata e servizi in righe da rivista verticale.

## Test della homepage

```sh
npm run build
npx playwright install chromium
npm test
```

Se Chromium è già installato, usare `CHROMIUM_PATH=/usr/bin/chromium npm test` senza scaricarlo. I quattro test coprono 320, 390, 768 e 1440 px: risposta HTTP, sezioni, navigazione, tastiera, overflow, caricamento dello script motion e audit axe WCAG A/AA. Gli audit automatici non sostituiscono una verifica manuale con tecnologie assistive.

## Brand e motion

Un solo modulo TypeScript gestisce IntersectionObserver, parallax di massimo 12px e pausa globale. Il resto è CSS: ingresso hero, orbite/asterischi, marquee e hover. `prefers-reduced-motion` disattiva il motion anche quando cambia durante la sessione. Contenuti sempre disponibili senza JavaScript. Il pulsante nella hero mette in pausa tutti i movimenti. La CTA risponde anche al focus da tastiera e rimanda a `/contact`.

Il logo ufficiale approvato è 02C — Slash / Square, in `public/logo.svg` (viewBox 128 × 128). I tracciati sono quelli della proposta approvata: usati senza deformazioni in header, footer e favicon. Il nero su off-white mantiene la leggibilità anche nel footer scuro.

## Inserire screenshot e ritratto reali

1. Aggiungere gli originali approvati in `src/assets/` (JPG, PNG o WebP). Non sostituire il logo.
2. Importare i file in `src/data/portfolio.ts`, ad esempio `import funteamScreenshot from '../assets/funteam.webp';`.
3. Sostituire solo `screenshot: null` della card corrispondente con `{ source: funteamScreenshot, alt: 'Descrizione fedele dello screenshot', position: '50% 0%' }`.
4. Per la fotografia importare l'originale e impostare `about.portrait` con lo stesso formato. Scegliere un testo alternativo reale e un `position` adeguato al soggetto.
5. Eseguire `npm run check`, `npm run build` e i test; controllare l'inquadratura desktop/mobile.

Astro genera WebP e `srcset` responsive con dimensioni esplicite e caricamento lazy. Le cornici conservano proporzioni e layout esistenti; le immagini usano `object-fit: cover`, senza filtri o ricolorazioni. `position` controlla l'inquadratura. Finché un campo resta `null`, rimane il placeholder esplicito: nessun asset mancante viene richiesto. Gli screenshot non ricevono le decorazioni dei placeholder. Copy e dettagli dei progetti rimangono invariati; nessun URL o caso studio viene inventato. La fotografia riguarda solo About: il visual A→Z animato della hero è indipendente.
