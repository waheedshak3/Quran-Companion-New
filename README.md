# Quran Companion — Read · Listen · Continue

A clean, mobile-first **GitHub Pages** website for Ahmadiyya readers of the Holy Quran. It links printed-page QR codes to the start of a Surah and verse so readers can read along with **Maulana Feroz Alam Sahib** recitation.

## What you get

- All 114 Surahs with readable Arabic, chapter/ayah navigation, audio controls, automatic advance to the next verse, repeat and adjustable speed.
- The **Ahmadiyya / Alislam verse convention**: Bismillah is counted as ayah 1 of every Surah **except Surah 9, At-Taubah**. Surah Al-Fatihah has 7 verses. Surah Al-Baqarah has 287 verses: 2:1 is Bismillah; 2:2 is Alif Lam Mim.
- Official **Alislam Quran App** link for every displayed verse.
- **English translation only by Maulawi Sher Ali** (no translations or tafsir from other traditions). It loads from a third-party JSON collection of Sher Ali's translation; if that service is unavailable, the official Alislam translation link is shown instead.
- QR codes for any Surah + ayah, a custom printed-page mapping tool, CSV backup/import, printable A4 sheet with QR labels.
- Automatic saving of your last reading position in the browser.
- No database, user accounts, server or build tools required.

## Publish to GitHub Pages — step by step

1. Download and unzip the **Quran Companion website** ZIP.
2. Sign in at [github.com](https://github.com) and choose **New repository**.
3. Give it a name such as `Quran-Companion` and make it **Public**.
4. Select **Add file → Upload files**. **Open the unzipped folder, select all of the files and the `assets` and `data` folders, and upload them into the repository root.** The file `index.html` must be at the top level, not inside another folder.
5. Choose **Commit changes**.
6. Open repository **Settings → Pages**. Under *Build and deployment*, select **Deploy from a branch**, then choose **main** and **/(root)**, and press **Save**.
7. Visit `https://YOUR-USERNAME.github.io/Quran-Companion/` (replace username and repository name with yours). GitHub will display the actual site URL in Settings → Pages once it is published.
8. Open the site on your phone and test a verse and the player. Only then create and print QR labels.

> For a repository called `Quran-App`, the URL is `https://YOUR-USERNAME.github.io/Quran-App/`.

## Scan-to-continue links

Each QR code points to **your hosted site**, not to a downloaded file. Example:

```
https://YOUR-USERNAME.github.io/Quran-Companion/?s=2&v=2
```

This opens Surah Al-Baqarah, ayah 2 (Alif Lam Mim in Alislam numbering). `?s=9&v=1` opens the first ayah of At-Taubah, with **no Bismillah** inserted.

Once online, open **QR codes** in the reader to generate a single verse QR, or open **Manage page QR sheet** to assign page numbers and print all labels.

**Important:** Pages of printed Qurans differ by publisher, page size, line spacing and edition. The site intentionally does **not invent page-to-verse associations**. For each printed page, find its first ayah, save `(page, surah, ayah)`, and use the **QR Studio** to print the labels. For many pages, create a spreadsheet with three columns exactly named `page,surah,ayah`, export CSV, and **Import CSV**. Save a **Download CSV** backup before clearing browser data or switching devices.

## Content provenance / important limitations

This is an **independent companion project**, not an official Alislam website, and uses only Ahmadiyya-specific translation and Alislam numbering. No non-Ahmadi translations, commentary, or devotional text are used.

**Audio:** Each ayah points directly to the *Feroz Alam* recitation files on `files.alislam.cloud`. The known public URL convention is:

```
https://files.alislam.cloud/audio/tilawat/feroz/002-001-AR.mp3
```

Here `002` is a Surah and `001` is its **Alislam ayah number**. These MP3s are **streamed**, not stored/repackaged in this repository. They remain subject to Alislam's availability and access rules. The audio source URL pattern is based on publicly available integration code; **end-to-end playback from this deployment has not been independently verified here**. Verify a few tracks on a live device before distributing printed codes.

**Arabic text:** Al-Fatihah is embedded from Alislam for immediate offline-first display. For other Surahs, this build fetches the **Arabic Quran text only** from a Quran JSON CDN using its Uthmani edition and applies the Alislam verse numbering convention. This is a *technical fallback*, because we could not establish a documented public machine-readable Quran text API at Alislam. **The remaining Arabic text is therefore not fetched directly from Alislam and has not been certified to match Alislam's exact Indo-Pak typography or orthography.** Alislam links are present on every verse for verification. If identical Alislam text is essential, replace this source with an approved Alislam dataset / documented endpoint before publication.

**English:** The reader uses Maulawi Sher Ali translation, embedded for Al-Fatihah; remaining verses are fetched from a public `sherali.json` collection, not directly from Alislam. The numerical adjustment is applied so the text aligns with Alislam verse numbering; the translation source might differ in punctuation or wording from Alislam's latest version.

**QR generation:** QR images are rendered by the public `api.qrserver.com` service when connected to the internet. The QR links themselves point only to your website. Print labels only after publishing; local `file://` QR URLs aren't suitable.

**Internet:** Live verse audio, non-Fatihah Arabic, most English translations and QR images need internet access. If a provider blocks access, the site displays a fallback link to the official Alislam Quran page.

**Rights:** Confirm the reuse / embedding permission for Alislam recordings and translations covers your intended publication. Maintain source attribution; do not imply official endorsement by Jamaat unless authorised.

## Checks to run before you print

1. Surah 1:1 is Bismillah; Surah 1:7 is the last verse of Al-Fatihah.
2. Surah 2:1 is Bismillah; Surah 2:2 is Alif Lam Mim; Surah 2:287 is its last verse.
3. Surah 9:1 is **not** Bismillah.
4. Surah 112:1 is Bismillah, and 112:5 is its last verse.
5. Test Feroz Alam audio from at least three different Surahs (e.g. 1:1, 2:2, 112:1) on a phone.
6. Print one QR, scan it with a different phone, and verify the Surah and ayah exactly match the printed page.

## Files

```
index.html           Main Quran reader
qr-studio.html       Printed-page QR mapping & A4 label printing
assets/style.css     Responsive styling + print layout
assets/app.js        Reader, audio, navigation, QR controls
assets/studio.js     CSV and label manager
data/surahs.js       114 Surahs, counts, Al-Fatihah
assets/icon.svg      Site icon
README.md            These instructions
```

No Node, Python, API key, package manager or build step is needed for GitHub Pages.
