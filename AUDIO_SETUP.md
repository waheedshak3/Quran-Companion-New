# Connect authorised Al Islam recitations

The website is functional, but Al Islam has no verified public API endpoint configured. It does NOT automatically stream Al Islam recordings.

Option A (local recordings): Put approved verse MP3 files inside `audio/` named `001001.mp3` (Al-Fatihah 1:1), `001002.mp3`, etc. Each verse is `surah` padded to three digits + `ayah` padded to three digits. Upload the audio folder along with the site. File names are case-sensitive on GitHub.

Option B (approved stable URLs): If Al Islam provides a per-verse URL template that is explicitly supported for embedding, edit `config.js` and set `audioUrlTemplate` to the template. Placeholders supported: `{surah}`, `{ayah}`, `{surah3}`, `{ayah3}`. If they require authentication, signed tokens or access restrictions, don't place secret tokens in a public GitHub Pages repo; you will need a separate backend or approved export instead.

For Al Islam text and translations: Request a JSON/CSV export containing surah number, verse number, verified Arabic text, English/Urdu texts and the numbering convention. An adapter can then replace the independent provider currently configured. Never assume their numbering matches third-party datasets: verify Bismillah and all verse alignments. The site presently has an independent public text provider as a temporary demonstration, not Al Islam content.

Test on a phone, including Android and iOS, before creating printed QR codes. Confirm Al Islam's permission covers redistribution, embedding, serving, CDN access and caching.
