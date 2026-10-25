# Sharing CallScape

## Option 1 — the single file (recommended)

`CallScape.html` (448 KB) contains the whole game: markup, styles, all four scripts and every
piece of art (drawn procedurally in code). There are **no** external files, fonts, images or
network calls, so it runs anywhere.

**To hand it to a classmate**
1. Send `CallScape.html` by Messenger / GC / email / Google Drive (as a file, not a Doc).
2. They download it and open it in a browser (Chrome, Edge, Safari, Firefox).
3. The game starts on its own — no server, no internet, no install.

**Notes for the recipient**
* Progress saves to that device's browser storage (`localStorage`), so the same file on the
  same browser resumes where they stopped. A different file location = a fresh save.
* On Android: open Files → Downloads → tap `CallScape.html` → "Open with Chrome".
* On iPhone: Files app → tap the file → Share → "Open in Safari" (or add it to iCloud Drive
  and open with Safari).
* On a laptop: double-click the file.

## Option 2 — a public web link

Any free static host works because there is no backend. Fastest:

**Netlify Drop** (no account needed for a temporary link)
1. Go to <https://app.netlify.com/drop>.
2. Drag the **whole `callscape` folder** (the one with `index.html`) onto the page.
3. You get a link like `https://random-name-123.netlify.app` — that is the shareable URL.
   Sign in afterwards if you want the link to stay up permanently.

**GitHub Pages**
1. Create a repository, upload the *contents* of the `callscape` folder (not the folder itself).
2. Settings → Pages → Source: `main` / `root` → Save.
3. Your link: `https://<username>.github.io/<repo>/`.

**itch.io** — upload the folder as a zipped HTML game and set the "index.html" launch option;
useful if you want a game page with screenshots.

## Option 3 — the live preview in this workspace

While this Arena session is open, the running server is visible in the browser preview panel at

```
https://8080-<sandbox-id>.e2b.app/index.html
```

That address is tied to this session and to your Arena login, so it is **not** a good link to
send to a friend — use Option 1 or 2 for that.

## What the teacher can edit before sharing

| File | What to change |
|---|---|
| `questions.js` | the 20 questions (14 floor/bay + 6 QA Wing): `prompt`, `accepted`, `hint`, `fail`, `success`, `topic`, `bookRef` |
| `codebook.js` | the six handbook chapters / 45 sections shown inside the game |
| `index.html` | title, footer version label, how-to-play text |
| `script.js` | reward values (`Progression.on…`), XP curve (`xpForLevel`), Robi's lines (`ROBOT_LINES`) |

After editing the separate files, rebuild the single-file copy:

```bash
cd callscape
python3 - <<'PY'
html = open('index.html').read()
html = html.replace('<link rel="stylesheet" href="style.css" />', '<style>\n' + open('style.css').read() + '\n</style>')
for f in ('questions.js', 'codebook.js', 'script.js'):
    html = html.replace(f'<script src="{f}"></script>', f'<script>\n' + open(f).read() + '\n</script>')
open('../CallScape.html', 'w').write(html)
PY
```
