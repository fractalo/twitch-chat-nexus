import type { MainCategorySettingValues } from "src/components/settings";
import { writable } from "svelte/store";

export const settingValuesStore = writable<MainCategorySettingValues | null>(null);
