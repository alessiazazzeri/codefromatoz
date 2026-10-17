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

## Stato dei contenuti e SEO

Homepage, Work, Services, About, Contact e sei case study sono presenti con screenshot reali desktop/mobile. Non restano visual placeholder nei case study. Le informative legali rimangono documenti temporanei: completarle prima del lancio; per ora sono noindex ed escluse dalla sitemap.

URL di produzione: `https://www.codefromatoz.it/`, con route senza slash finale (homepage esclusa). `astro.config.mjs` dichiara site e convenzione; `src/data/site.ts` centralizza identità e dati SEO. `Base.astro` emette canonical, OG/Twitter e schema WebSite/Person verificabile. `/sitemap.xml` deriva dalle pagine Astro pubbliche, escludendo 404 e informative provvisorie; `/robots.txt` indica la sitemap e non blocca il crawl delle policy noindex. Le esplorazioni logo sono archiviate fuori da src/pages in `design-reference/`.

La preview globale è `public/social/code-from-a-to-z.png` (1200×630). I case study usano derivati JPEG 1200×630 dei propri screenshot reali. Icone PNG e immagine brand possono essere rigenerate con `CHROMIUM_PATH=/usr/bin/chromium node scripts/generate-brand-assets.mjs`, usando il browser dei test già installato. Nessun manifest o PWA.

## Sicurezza del build

`npm run build` esegue Astro e `scripts/finalize-build.mjs`. Il secondo passaggio elimina soltanto copie PNG generate di screenshot sorgente che non hanno riferimenti nell'output e possiedono derivati WebP. Gli originali in `src/assets/projects/` non vengono modificati o cancellati.

Lo stesso script genera `dist/_headers` per Cloudflare Pages: CSP con hash SHA-256 degli script effettivamente emessi (incluso JSON-LD), script attribute disabilitati, connessioni solo same-origin, object/frame vietati e frame-ancestors none. Le style inline sono ammesse intenzionalmente per crop e motion attuali. Include Referrer-Policy, nosniff, X-Frame-Options e Permissions-Policy. Nessun dominio Google deve essere consentito al browser: Gmail viene chiamato dalla Function server-side. Gli header Pages non si applicano automaticamente alle risposte delle Functions; l'API mantiene i propri header no-store/nosniff. Verificare gli header effettivi, la 404 HTTP, la normalizzazione URL e il funzionamento completo in produzione. Non pubblicare un output Astro parziale saltando il passaggio finale.

## Interfaccia

Componenti Astro, CSS responsive, font di sistema, decorazioni CSS, navigazione ad ancore, skip link, focus visibile e supporto reduced motion. Sotto 600px: copertina compatta, artwork orizzontale, progetti in sequenza sfalsata e servizi in righe da rivista verticale.

## Test

```sh
npm run build
npx playwright install chromium
npm test
```

Se Chromium è già installato, usare `CHROMIUM_PATH=/usr/bin/chromium npm test` senza scaricarlo. La suite copre pagine, case study, link, API simulata, navigazione, tastiera, motion, asset, responsive e audit axe WCAG A/AA. I test pre-launch verificano anche metadata, sitemap, header di sicurezza e contenuti del build. Gli audit automatici non sostituiscono una verifica manuale con tecnologie assistive.

## Brand e motion

Un solo modulo TypeScript gestisce IntersectionObserver, parallax di massimo 12px e pausa globale. Il resto è CSS: ingresso hero, orbite/asterischi, marquee e hover. `prefers-reduced-motion` disattiva il motion anche quando cambia durante la sessione. Contenuti sempre disponibili senza JavaScript. Il pulsante nella hero mette in pausa tutti i movimenti. La CTA risponde anche al focus da tastiera e rimanda a `/contact`.

Il logo ufficiale approvato è 02C — Slash / Square, in `public/logo.svg` (viewBox 128 × 128). I tracciati sono quelli della proposta approvata: usati senza deformazioni in header, footer e favicon. Il nero su off-white mantiene la leggibilità anche nel footer scuro.

## Asset del portfolio

Gli originali approvati sono in `src/assets/projects/`; le associazioni esplicite sono in `src/data/project-images.ts`. `PortfolioImage.astro` genera WebP responsive con width/height e lazy loading, salvo visual prioritari. Il primo visual di /work e le copertine dei case study sono eager/high priority. `CaseStudyMedia.astro` accetta sizes per i diversi slot; crop e composizioni editoriali restano nei componenti e CSS esistenti.

Il ritratto trasparente resta `public/portrait.png` (408×612): nessun upscale artificiale. Una sorgente più grande sarebbe preferibile per display densi. `logo.svg` e `favicon.svg` sono entrambi utilizzati e mantengono i tracciati 02C approvati.

Non sono presenti analytics, cookie di tracciamento, storage browser, font esterni o librerie di animazione esterne. La verifica va ripetuta sul deploy Cloudflare effettivo.
