import { writable } from "svelte/store";
import type { MainCategorySettingValues } from "src/components/settings";

export const settingValuesStore = writable<MainCategorySettingValues | null>(null);
