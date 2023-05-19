import "../app.css";
import 'simplebar';
import PopupApp from "src/components/PopupApp.svelte";
import { initI18next } from "src/i18n";

initI18next();

const target = document.getElementById('app');

async function render() {
    if (!target) return;
    
    new PopupApp({ target });
}


document.addEventListener('DOMContentLoaded', render);