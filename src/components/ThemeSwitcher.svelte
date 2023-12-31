<script lang="ts">
    import SunIcon from './icons/sun.svelte';
    import MoonIcon from './icons/moon.svelte';
    import { onMount } from 'svelte';
    import { themeChange } from 'theme-change';

    let theme: string | null = null;
    
    onMount(() => {
        themeChange(false);

        new MutationObserver(() => {
            const isDarkTheme = document.documentElement.dataset.theme === 'dark';
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDarkMode === isDarkTheme) {
                localStorage.removeItem('theme');
            }
        }).observe(document.documentElement, {attributes: true});

        const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
        darkModePreference.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                theme = document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
            }
        });

        theme = localStorage.getItem('theme');
        theme ??= document.documentElement.dataset.theme = darkModePreference.matches ? 'dark' : 'light';
    });

    

</script>

<label class="btn max-lg:btn-sm btn-square btn-ghost swap swap-rotate">
    <input 
        type="checkbox" 
        data-toggle-theme="light,dark" 
        data-act-class="ACTIVECLASS" 
        checked={theme === 'dark'} 
        disabled={!theme}
    />
    <SunIcon class="swap-off fill-current w-5 h-5 lg:w-6 lg:h-6" />
    <MoonIcon class="swap-on fill-current w-5 h-5 lg:w-6 lg:h-6" />
</label>