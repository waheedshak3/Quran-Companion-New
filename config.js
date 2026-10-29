// QUR'AN COMPANION — change these settings only if you need to.
// Verse numbering: Al Islam / Ahmadiyya (Bismillah is 1, except Surah 9).
// Important: the underlying text and translation are NOT yet from Al Islam.
window.QURAN_CONFIG = {
  // Existing independent source for Arabic text and English translation.
  textProvider: 'quran-json',
  dataBase: 'https://quran-json.risanb.com',
  arabicScript: 'uthmani',
  translation: 'en-saheeh',

  // Works for the whole Qur'an without uploading thousands of files:
  // 'stream': Al Quran Cloud API / CDN (reciter: Mishary Alafasy), NOT Al Islam.
  // 'local':  Your own verse MP3s inside audio/, named by displayed Al Islam number.
  // 'template': Approved per-verse URLs supplied by Al Islam (if available).
  audioMode: 'stream',
  audioApiBase: 'https://api.alquran.cloud/v1',
  audioCDNBase: 'https://cdn.islamic.network/quran/audio/128',
  reciter: 'ar.alafasy',
  localAudioFolder: 'audio',
  // Used only when audioMode is 'template'.
  // Placeholders: {surah}, {ayah}, {surah3}, {ayah3}.
  audioUrlTemplate: '',
  autoNextVerse: true
};
