<script lang="ts">
  import type { Alert, AlertLevel } from "./types";

  export let maxAlertCount: number = 3;
  export let durationMs: number = 5000;

  interface AlertItem {
    alert: Alert;
    timer: number;
  }

  let alertItems: AlertItem[] = [];

  export const alertMessage = (alert: Alert) => {
    while (alertItems.length >= maxAlertCount) {
      const alertItem = alertItems.pop();
      window.clearTimeout(alertItem?.timer);
      alertItems = alertItems;
    }

    alertItems.unshift({
      alert,
      timer: window.setTimeout(() => {
        alertItems.pop();
        alertItems = alertItems;
      }, durationMs),
    });

    alertItems = alertItems;
  };

  const removeAlert = (i: number) => {
    const [ alertItem ] = alertItems.splice(i, 1);
    window.clearTimeout(alertItem?.timer);
    alertItems = alertItems;
  };

  const alertClassNames: Record<AlertLevel, string> = {
    'normal': '',
    'info': 'alert-info',
    'success': 'alert-success',
    'warning': 'alert-warning',
    'error': 'alert-error',
  };

</script>

{#if alertItems.length}
  <div class="toast p-2 sm:p-4">
    {#each alertItems as alertItem, i (alertItem.timer)}
      <div class="alert {alertClassNames[alertItem.alert.level]} flex max-w-md py-1 px-3 sm:p-4">
        <span class="text-sm sm:text-base grow text-left text-wrap">{alertItem.alert.message}</span>
        <button class="btn btn-xs sm:btn-sm btn-square btn-ghost "
          on:click={() => removeAlert(i)}
        >✕</button>
      </div>
    {/each}
  </div>
{/if}