# Code from A to Z

Portfolio di Alessia, homepage Astro statica. Node.js 22.12+ (o 24+) e npm.

```sh
npm ci
npm run check
npm run build
npm run dev
```

`npm run preview` serve la build per la verifica locale. Output: `dist/`.

## Cloudflare Pages

Predisposto per Pages senza adapter o runtime server: comando build `npm run build`, directory output `dist`, versione Node `24`. Nessun deploy o DNS configurato. Il lockfile va mantenuto e l'installazione ripetuta con `npm ci`.

## Contenuti da completare

I visual dei quattro progetti sono segnaposto grafici originali, non screenshot o rappresentazioni del lavoro reale. Mancano descrizioni, case study, ritratto, biografia, dettagli dei servizi, email e social. Nessuna testimonianza o risultato commerciale inventato. I contatti sono testo segnaposto, senza link fittizi. Il progetto health ha un nome provvisorio.

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

Un solo modulo TypeScript gestisce IntersectionObserver, parallax di massimo 12px e pausa globale. Il resto è CSS: ingresso hero, orbite/asterischi, marquee e hover. `prefers-reduced-motion` disattiva il motion anche quando cambia durante la sessione. Contenuti sempre disponibili senza JavaScript. Il pulsante nella hero mette in pausa tutti i movimenti. La CTA risponde anche al focus da tastiera; non è un link di contatto finché mancano i recapiti.

Il logo ufficiale originale è `public/logo.png` (183 × 142 px): usato in header e footer senza ritagli, filtri o modifiche al file. Nel footer è appoggiato su un fondo off-white per conservarne la leggibilità.
