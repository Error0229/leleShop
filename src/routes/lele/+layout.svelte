<script lang="ts">
	import { supabase } from '$lib/db';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Menu from './Menu.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(async () => {
		const access_token = (await supabase.auth.getSession()).data.session?.access_token;
		if (access_token === undefined || access_token === '') {
			goto('/login', { replaceState: true });
		}
	});

	async function LogoutSubmit() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
		} else {
			goto('/');
		}
	}
</script>

<div class="flex justify-center">
	<div class="flex w-full justify-between">
		<div class="flex overflow-auto">
			<Menu></Menu>
		</div>
		<!-- <div class="flex justify-end">
			<div
				class="m-2 content-center items-center justify-center rounded-xl bg-red-600 px-3 text-center font-semibold text-white"
			>
				<form
					action="/login?/logout"
					onsubmit={(e) => {
						e.preventDefault();
						LogoutSubmit();
					}}
				>
					<button type="submit">Logout</button>
				</form>
			</div>
		</div> -->
	</div>
</div>
{@render children?.()}
