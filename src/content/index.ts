// https://dev.to/jacksteamdev/advanced-config-for-rpce-3966


import styles from './styles.css?inline';
import { injectInlineStyle } from "src/util/injectors";
import { initI18next } from "src/i18n";
import LanguageDetector from "src/i18n/languageDetectors/twitch";
import './messaging';
import i18next from 'i18next';

injectInlineStyle(styles);

initI18next(LanguageDetector);

i18next.on('initialized', () => {
    console.log(i18next.t('help'));
});
console.log(i18next.getDataByLanguage('ko'));

