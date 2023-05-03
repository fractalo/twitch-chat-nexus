import "../app.css";
import 'simplebar';
// import 'simplebar/dist/simplebar.css';
import OptionApp from "src/components/OptionApp.svelte";

const target = document.getElementById('app');

async function render() {
    if (!target) return;
    
    new OptionApp({ target });
}


document.addEventListener('DOMContentLoaded', render);