import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import pcm from './pcm.json';

// Pidgin strings are placeholders until a native-speaker copywriter reviews them (spec §19 #4).
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pcm: { translation: pcm } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
