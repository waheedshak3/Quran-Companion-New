// EDIT THIS FILE to connect approved Al Islam material.
// Text/translation: Default is a documented independent source, NOT Al Islam.
window.QURAN_CONFIG = {
  textProvider: 'quran-json',
  dataBase: 'https://quran-json.risanb.com',
  arabicScript: 'uthmani',
  translation: 'en-saheeh',
  // Optional: replace with a valid URL template once Al Islam supplies approved audio endpoints.
  // Use {surah3} and {ayah3} for 3-digit identifiers (e.g., 001001.mp3).
  audioUrlTemplate: '',
  // If no template is given, local files under audio/ are used when present.
  // For example: audio/001001.mp3 for 1:1, audio/001002.mp3 for 1:2.
  localAudioFolder: 'audio',
  autoNextVerse: true
};
