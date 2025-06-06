import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Get the value out of storage on load.
export type StoreList = string[] | '*';

let stored: StoreList = '*';
if (browser) {
	stored =
		localStorage !== undefined
			? localStorage.selectedStore
				? JSON.parse(localStorage.selectedStore)
				: '*'
			: '*';
}

export const selectedStore = writable(stored || '[]');

// Anytime the store changes, update the local storage value.
if (browser)
	selectedStore.subscribe((value) => (localStorage.selectedStore = JSON.stringify(value)));
