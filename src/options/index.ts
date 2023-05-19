import "../app.css";
import 'simplebar';
import OptionApp from "src/components/OptionApp.svelte";
import { initI18next } from "src/i18n";

initI18next();

const target = document.getElementById('app');

async function render() {
    if (!target) return;
    
    new OptionApp({ target });
}


document.addEventListener('DOMContentLoaded', render);