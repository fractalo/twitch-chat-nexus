import "../app.css";
import 'simplebar';
// import 'simplebar/dist/simplebar.css';
import PopupApp from "src/components/PopupApp.svelte";

const target = document.getElementById('app');

async function render() {
    if (!target) return;
    
    new PopupApp({ target });
}


document.addEventListener('DOMContentLoaded', render);