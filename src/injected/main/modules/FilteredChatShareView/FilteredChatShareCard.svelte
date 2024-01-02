<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from 'svelte';
    import { draggable } from '@neodrag/svelte';
    import FilteredChatShare from './FilteredChatShare.svelte';
    import { i18n } from "src/i18n";
    import Button from '../../components/Button.svelte';
  import XMark from '../../components/icons/XMark.svelte';

    const dispatch = createEventDispatcher();

</script>


<div 
    class="tcn-card absolute w-[34rem] rounded-[0.4rem] pointer-events-auto"
    use:draggable={{ handle: '.tcn-card-handle', cancel: '.daisy-btn, .tcn-card-drag-cancel' }}
>
    <div class="w-full max-h-[50rem] flex flex-col">
        <div class="daisy-navbar tcn-card-handle" >
            <div class="daisy-navbar-start"></div>
            <div class="daisy-navbar-center">
                <p class="tcn-card-title">
                    {$i18n.t('filteredChatShare.title', { ns: 'mainApp' })}
                </p>
            </div>
            <div class="daisy-navbar-end">
                <Button type="ghost" isSquare={true} on:click={() => dispatch('click:close')} >
                    <XMark class="w-8 h-8 fill-current" />
                </Button>
            </div>
        </div>
        <div class="grow min-h-0">
            <FilteredChatShare />
        </div>
    </div>
</div>

