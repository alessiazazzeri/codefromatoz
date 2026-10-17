# Informative privacy e cookie — 17 ottobre 2026

Le pagine /privacy-policy e /cookie-policy sono state completate utilizzando i dati forniti dalla titolare e il flusso tecnico esistente. Non sono una certificazione legale dei contratti o delle configurazioni dei fornitori.

## Contenuto e interfaccia

- Denominazione: Code from A to Z di Zazzeri Alessia, ditta individuale; titolare Alessia Zazzeri; P. IVA 07506510481; domicilio professionale Via G. F. Mariti 2, 50127 Firenze (FI), Italia; info@codefromatoz.it.
- Richieste di servizi e misure precontrattuali: art. 6(1)(b) quando applicabile. Altra corrispondenza e sicurezza: legittimo interesse art. 6(1)(f). Obblighi di legge: art. 6(1)(c), quando applicabile.
- Il form mantiene «Ho letto l'informativa privacy.», checkbox required e link /privacy-policy. Rimossa soltanto la nota obsoleta di documento in preparazione e il relativo riferimento aria-describedby.
- Flusso invariato: browser → Pages Function → Gmail API → casella Workspace della titolare. La checkbox non è consenso marketing né base giuridica del trattamento.
- Descritti Cloudflare, Google/Workspace, accesso alla casella riservato alla titolare, dati tecnici di navigazione, IP pseudonimizzato con HMAC e scadenza KV di circa un'ora.
- Richieste senza seguito professionale: fino a 12 mesi dalla gestione, con le eccezioni indicate dalla titolare; rapporti professionali: termini applicabili alla gestione del rapporto e agli obblighi di legge.
- Cookie Policy senza tabelle vuote o banner: descrive le tecnologie attuali e distingue il frontend dall'infrastruttura ancora da verificare in produzione.
- Footer con denominazione corretta, P. IVA e copyright richiesto. Nessun indirizzo aggiunto al footer.
- Layout legale condiviso, indice da tastiera, una H1, sezioni con H2 e larghezza di lettura limitata. Conservata la precedente scelta noindex/esclusione sitemap per le informative: nessun intervento sulla strategia SEO.

## Punti da confermare prima della produzione

1. Accordi applicabili a Cloudflare e Google Workspace: ruoli, entità contrattuali, eventuali accordi sul trattamento, localizzazioni effettive e strumenti per eventuali trasferimenti fuori SEE. Il testo non attesta garanzie o residenze non verificate; una dichiarazione più specifica richiede riscontro negli account/contratti.
2. Eventuali log infrastrutturali: dati effettivamente disponibili, impostazioni e tempi di conservazione del servizio. La scadenza KV di un'ora non è estesa impropriamente ai log o alle email.
3. Applicazione operativa dei criteri di conservazione della corrispondenza nella casella Workspace, comprese eventuali copie e regole di conservazione. Il sito non cancella le email dopo 12 mesi: il criterio indicato va attuato nella gestione della casella.
4. Verifica finale del dominio Cloudflare: cookie tecnici eventualmente introdotti dall'infrastruttura, storage browser e richieste automatiche, servizi opzionali effettivamente abilitati. Nessun cookie specifico è stato attribuito senza verifica.
5. Configurazione ancora separata di Gmail OAuth, secret del form e KV production, quindi verifica di consegna reale. Non effettuate configurazioni, deploy o modifiche DNS in questo pass.

## Verifica locale

Build riuscita; Astro check: 0 errori, warning o hint. Suite completa: 86 test superati. La suite include responsive a 320/375/768/1024/1440px, axe, navigazione da tastiera, link interni, footer, checkbox, invio simulato e test specifici delle informative. Le visite locali non sostituiscono il controllo sull'infrastruttura production. Nessun cookie banner, CMP, analytics, tracking, font esterno o nuova dipendenza introdotto.
