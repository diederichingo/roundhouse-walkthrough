# Els’s roundhouse — Option B walkthrough

A static three.js walkthrough of the Option B roundhouse (Penamacor). Not for construction.

This repository contains only the public walkthrough site. Source drawings, PDFs and Drive files are not included.

## Live site

Once GitHub Pages is enabled on this repo (branch `main`, folder `/` root), the walkthrough is at:

https://diederichingo.github.io/roundhouse-walkthrough/

## Local preview

From this folder:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/
```

There is no build step. Assets are relative, so the site also works under a Pages subpath.

## Updating the live site

1. Edit the walkthrough on the box at `/workspace/roundhouse/walkthrough/` (keep `js/app.js?v=N` bumped in `index.html` after a script change).
2. Copy the site into this folder (do not copy PDFs, Drive downloads, or `/workspace/roundhouse/source/`):

   ```bash
   rsync -a --delete --exclude .git --exclude README.md \
     /workspace/roundhouse/walkthrough/ ./
   touch .nojekyll
   ```

3. Commit and push to `main`. Pages will republish to the same URL.

`ROOF_RAISE` in `js/app.js` is the parametric roof/post raise (currently 0.200 m, final, 25 Nov 2026). Walls, the head plate, openings, the plinth and the utility plate stay put. Per-beam soffits are taken from the 7° slope and match `geometry_report_B.txt` / `extension_report_B.txt`.
