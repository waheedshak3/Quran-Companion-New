# Qur'an Companion — new mobile reader

A standalone HTML/CSS/JavaScript site for GitHub Pages. No Python, compilation or build step required.

## Publish on GitHub Pages (no terminal)

1. Make a NEW public GitHub repository, e.g. `Quran-Companion-New`.
2. Upload `index.html`, `styles.css`, `app.js`, `config.js`, `AUDIO_SETUP.md` and the `audio` folder to the repository root (not inside a second folder).
3. Go to Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.
4. Visit `https://YOUR-USERNAME.github.io/Quran-Companion-New/`.
5. Test `?surah=1` for Al-Fatihah or `?surah=112` for Al-Ikhlas. Old QR links `?page=fatiha-1` and `?page=ikhlas-1` are supported if you deploy this as a replacement under the old site's URL.

## Current data integration

Arabic and English text are loaded dynamically from the independent quran-json.risanb.com JSON files, NOT Al Islam. That provider is public but each original source carries its own terms, so verify permissions and accuracy. No Al Islam endpoints could be verified as a stable, documented public API. Read AUDIO_SETUP.md for using authorised Al Islam verse recordings or URLs. Do not claim this version currently imports Al Islam's translations or recordings.

Audio is not bundled. Tap-to-play works once approved files/links exist. This site has been syntax checked but not end-to-end tested against the remote source from this offline build environment. Text and translation require expert review before public release.

## QR codes

Use `?surah=1` for the first surah. Make a QR code from the permanent public URL, not `file:///` or localhost. If your print edition uses page numbers across surah boundaries, a page map is required separately; the current version provides **surah-level** links, not exact physical-page mappings.
