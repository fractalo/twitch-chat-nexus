<script lang="ts" generics="T">

    interface Item {
        label: string;
        value: T;
    }

    export let items: Item[] = [];

    export let value: T | null;

    export let onChange: (() => void) | null = null;

    const createCheckedStates = () => {
      if (value === null) {
        return items.map(() => false);
      } else {
        return items.map(item => item.value === value);
      }
    };

    let checkedStates: boolean[] = createCheckedStates();

    const handleChange = (i: number) => {
      if (checkedStates[i]) {
        checkedStates = checkedStates.map((_, j) => {
          return i === j ? true : false;
        });
        value = items[i].value;
      } else {
        value = null;
      }
      onChange?.();
    };

    const updateCheckedStates = () => {
      checkedStates = createCheckedStates();
    };

    $: value, updateCheckedStates();

</script>

<div class="flex gap-1.5">
  {#each items as item, i}
    <input class="btn btn-sm bg-base-300 whitespace-nowrap" type="checkbox"  
      bind:checked={checkedStates[i]}
      on:change={() => handleChange(i)}
      aria-label={item.label} 
    />
  {/each}
</div>



