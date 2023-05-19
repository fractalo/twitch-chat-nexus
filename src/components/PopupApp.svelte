<script lang="ts">
    import { fade } from "svelte/transition";
    import Home from "./Home.svelte";
    import Settings from "./settings/Settings.svelte";
    import type { SvelteComponent } from "svelte";
    import { i18n } from 'src/i18n';


    let showSettings = false;

    let mainComponent: typeof SvelteComponent;
    let pendingComponent: typeof SvelteComponent;

    const updatePendingComponent = () => {
        pendingComponent = showSettings ? Settings : Home;
    };

    const updateMainComponent = () => {
        mainComponent = pendingComponent;  
    };

    updatePendingComponent();
    updateMainComponent();

</script>

<div class="w-80 h-[24rem] flex flex-col">
    <div class="navbar bg-base-100">
        <div class="navbar-start">
            {#if showSettings}
                <div class="text-[1.375rem] font-semibold ml-2" in:fade={{ delay: 150, duration: 150 }} out:fade={{ duration: 150 }} >
                    {$i18n.t('settings', { ns: 'common' })}
                </div>
            {/if}
        </div>
        <div class="navbar-end">
            <label class="btn btn-square btn-ghost swap swap-rotate">
                <input type="checkbox" bind:checked={showSettings} on:change={updatePendingComponent} />
                <svg class="h-6 w-6 swap-off fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" >
                    <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
                </svg>
                         
                <svg class="h-6 w-6 swap-on fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
                </svg>             
            </label>
        </div>
    </div>

    {#if mainComponent && mainComponent === pendingComponent}
        <div class="grow h-0 bg-base-100" on:outroend={updateMainComponent} transition:fade={{ duration: 150 }}>
            <svelte:component this={mainComponent} />
        </div>
    {/if}
</div>