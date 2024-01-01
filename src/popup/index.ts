import "../app.css";
import 'simplebar';
import App from "src/components/App.svelte";
import { initI18next } from "src/i18n";
import languageDetector from 'src/i18n/languageDetectors/browser';

initI18next({ 
    languageDetector,
    language: window.localStorage.getItem('language') || undefined
});

const target = document.getElementById('app');

async function render() {
    if (!target) return;
    
    new App({ target, props: { isPopup: true } });
}


document.addEventListener('DOMContentLoaded', render);