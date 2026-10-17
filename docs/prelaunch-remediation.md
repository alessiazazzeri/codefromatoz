# Pre-launch remediation — 17 ottobre 2026

## FIXED

- Dominio production `https://www.codefromatoz.it/`, canonical assoluti e route senza slash finale (homepage esclusa).
- Metadata centralizzati in Base: title/description, canonical, robots, OG completo, Twitter large image. Nessuna modifica al copy delle pagine esistenti.
- Sitemap generata dalle route reali: 11 URL; escluse API, 404, informative provvisorie ed esplorazioni. Robots indica la sitemap e consente il crawl delle policy noindex.
- Esplorazioni logo conservate come documentazione `.astro.txt` in design-reference, fuori dal sito pubblico; rimosso il ramo preview dell'header, mantenendo il logo ufficiale invariato.
- Immagine social globale 1200×630, più anteprime JPEG dai sei screenshot reali dei case study. Nessuna ricostruzione artificiale dei progetti.
- Schema WebSite e Person con identità e due social confermati; nessun dato non fornito.
- 404 personalizzata, link home/work, noindex; presente dist/404.html. Preview restituisce 404 per URL inesistenti.
- Footer fuori da main su ogni pagina; CTA rimane nella posizione esistente dentro main. CTA con area di hit estesa ad almeno 44px senza ingrandire la tipografia.
- Rimossi i quattro slot placeholder superflui e riequilibrata la sezione Visual Direction con testo su due colonne desktop / colonna unica mobile. Restano tre immagini reali per ciascun case study compatto.
- Primo screenshot di Work eager/high priority; gli altri restano lazy. Sizes differenziati per colonne e composizioni, senza cambiare crop o screenshot.
- Microoverflow della home risolto alla fonte: line-height del simbolo decorativo nella rail verticale. Nessun overflow-x hidden globale aggiunto.
- Apple touch icon e favicon PNG di compatibilità derivati dal logo SVG approvato; nessun manifest o PWA.
- Originali screenshot spostati da public a src/assets/projects, senza modificarne i byte. Il build elimina 21 copie PNG generate non referenziate, dopo aver verificato la presenza di derivati ottimizzati. Rimosso il solo add-group-2.png già verificato come inutilizzato.
- Build: 5.570.100 byte di file, circa 5,7 MiB allocati su disco, contro circa 83 MiB prima. Gli originali restano nel repository, fuori dal build pubblico.
- Header Pages generati con hash SHA-256 degli script finali: CSP, frame-ancestors, Referrer-Policy, nosniff, Permissions-Policy e X-Frame-Options. Style inline conservati per motion e crop. Nessuna dipendenza aggiunta.
- Cleanup dei selettori esclusivi del vecchio header/footer, export ritratto inutilizzato, documentazione obsoleta. Conservati gli elementi dubbi.

## Verifica eseguita

- `npm run check`: 0 errori, 0 warning, 0 hint.
- `npm run build`: riuscita; 14 pagine HTML, sitemap, robots e header generati.
- `CHROMIUM_PATH=/usr/bin/chromium npm test -- --workers=2`: 83 test superati.
- Tutte le 14 pagine HTML, inclusa 404, verificate a 320/375/768/1024/1440px: nessun overflow, un footer contentinfo fuori da main e zero violazioni axe WCAG 2 A/AA, 2.1 AA e 2.2 AA rilevate.
- Home verificata anche a 700/719/720/721/740px, senza overflow.
- Link interni e ancore, homepage → Work → case study e sequenza Next Project verificati dalla suite.
- Metadata, risorse OG, icone, schema JSON-LD, sitemap e robots verificati sul build.
- Ogni script emesso è coperto dagli hash della CSP. CSP applicata localmente alle risposte tramite test browser: menu e form con invio simulato funzionanti, nessuna violazione CSP osservata.
- Nessuna richiesta automatica esterna, cookie o chiave localStorage/sessionStorage osservati nelle visite campione con CSP. Nessuna nuova tecnologia di storage o tracking introdotta.
- Originali dei 21 screenshot conservati, logo.svg, favicon.svg e portrait.png confrontati byte per byte con HEAD precedente: identici.
- Ispezione visiva della nuova 404 e della Visual Direction senza placeholder a desktop e 375px; immagine OG globale verificata visivamente.

Gli audit automatici non certificano l'accessibilità con tutte le tecnologie assistive. Le prove locali non attestano Core Web Vitals o consegna reale di email.

## REMAINING BEFORE LAUNCH

- Completare separatamente Privacy Policy e Cookie Policy con dati reali: attualmente rimangono placeholder noindex. Nessun testo legale inventato.
- Il ritratto attuale resta 408×612, senza upscale. Una sorgente più grande sarebbe preferibile per schermi densi, ma non è stata richiesta per sbloccare questo pass.
- Gli originali in src/assets/projects sono la sorgente da aggiornare per futuri screenshot; rigenerare sempre con npm run build, incluso il passaggio finale.

## WAITING FOR CLOUDFLARE PRODUCTION

- Secret Gmail OAuth e CONTACT_FORM_SECRET, namespace/binding KV e verifica di un invio reale: nessuna credenziale configurata in questo task.
- Verifica redirect www/HTTPS e convenzione trailing slash; status 404 e canonical reali. Nessuna modifica DNS o deploy.
- Verifica applicazione effettiva di dist/_headers su Pages, CSP senza interferenze introdotte dalla piattaforma e comportamento di /api/contact nelle Functions. Gli header statici Pages non sostituiscono quelli delle risposte della Function.
- Verifica cookie/storage/richieste esterne sul dominio finale, comprese opzioni Cloudflare. Nessun analytics/Zaraz/Turnstile attivato dal codice.
- Verifica performance su rete reale/Core Web Vitals; verifica raggiungibilità dei social e Side Quest da una connessione non bloccata dal proxy dell'ambiente.
- KV antispam rimane best effort (consistenza eventuale, operazioni non atomiche), come già documentato; monitorare dopo il lancio.
