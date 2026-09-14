import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import am from '../locales/am.json';

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('ousman_lang') : null;
const lng = stored === 'am' ? 'am' : 'en';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, am: { translation: am } },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
