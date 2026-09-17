# MAST — sito aziendale

Sito statico responsive di MAST, con homepage, scheda tecnica DM-40 e showroom 3D controllato dallo scorrimento.

## Tecnologie

- HTML5, CSS3 e JavaScript
- GSAP + ScrollTrigger
- Three.js e modello GLB della DM-40
- GitHub Pages per la pubblicazione

## Struttura

```text
.
├── index.html                 # Homepage
├── macchinari/dm-40/          # Scheda macchina
├── assets/                    # Immagini, PDF, modello GLB e librerie locali
├── styles.css                 # Stili generali
├── showroom.css               # Stili dello showroom 3D
├── script.js                  # Interazioni generali
├── showroom.js                # Configurazione macchinari e caricamento
├── showroom-3d.js             # Scena Three.js e movimento camera
├── scripts/check-links.mjs    # Verifica riferimenti locali
└── .github/workflows/pages.yml
```

## Avvio locale

Richiede Node.js 20 o successivo.

```bash
npm install
npm run dev
```

Aprire `http://localhost:4173`. Non aprire direttamente `index.html`: il modello 3D richiede un server HTTP.

## Controllo del progetto

```bash
npm run check
```

Il controllo verifica sintassi JavaScript, file principali e collegamenti locali nelle pagine HTML.

## Pubblicazione su GitHub Pages

1. Creare un repository GitHub vuoto.
2. Caricare questa cartella sul branch `main`.
3. In **Settings → Pages → Build and deployment**, selezionare **GitHub Actions**.
4. Il workflow `Deploy static site to GitHub Pages` pubblicherà automaticamente ogni push su `main`.

Comandi iniziali:

```bash
git init
git add .
git commit -m "Initial MAST website"
git branch -M main
git remote add origin https://github.com/UTENTE/NOME-REPOSITORY.git
git push -u origin main
```

## Modificare o aggiungere un macchinario

La configurazione è nell'array `machines` di `showroom.js`. Ogni voce definisce nome, descrizione, lato della stanza, posizione, modello 3D e pagina collegata. Gli asset vanno salvati in `assets/`.

## Note

Il sito usa Three.js da CDN. GSAP e ScrollTrigger sono già inclusi in `assets/vendor/`.
