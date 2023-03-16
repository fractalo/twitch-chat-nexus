import Counter from "src/components/Counter.svelte";
import "../app.css";

const target = document.getElementById('app');

async function render() {
    if (!target) return;
    
    new Counter({target: target, props: {count: 0}});
}

document.addEventListener('DOMContentLoaded', render);