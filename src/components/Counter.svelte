<script lang="ts">
    export let count: number;
    export const func = () => {};
  
    const increment = () => ++count;
    const decrement = () => --count;
  

</script>
  
<div class=" bg-blue-50 min-w-[20rem] p-4 flex flex-col gap-4">
    <p class="text-blue-800 text-xl">
        Current count: <span class="font-extrabold">{count}</span>
    </p>
    <div class="flex gap-2">
        <button class="btn" on:click={decrement}>-</button>
        <button class="btn" on:click={increment}>+</button>
    </div>
</div>
  
<style>
    p {
        color: green;
    }
</style>