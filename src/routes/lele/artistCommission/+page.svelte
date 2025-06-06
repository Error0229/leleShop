<script lang="ts">
	import LeleTable from '$lib/Component/htmlWrapper/LeleTable.svelte';
	import LeleTbody from '$lib/Component/htmlWrapper/LeleTbody.svelte';
	import LeleTbodyTr from '$lib/Component/htmlWrapper/LeleTbodyTr.svelte';
	import LeleThead from '$lib/Component/htmlWrapper/LeleThead.svelte';
	import InfoBox from '$lib/Component/InfoBox.svelte';
	import db, { supabase, type ArtistRow, type StoreRow } from '$lib/db';
	import type { CommissionViewRow } from '$lib/db/DbCommission';
	import { ThisMonthFirstDate } from '$lib/function/Utils';
	import { selectedStore } from '$lib/store/choosing';
	import { onDestroy, onMount } from 'svelte';

	let showStoreName: string[] = $state([]);
	let commissionData: CommissionViewRow[] = $state([]);
	let choosingArtist: number[] = $state([]);
	let choosingStoreName: string[] = $state([]);
	let storeData: StoreRow[] = [];
	let artistData: ArtistRow[] = $state([]);

	let choosingDate =
		$state(ThisMonthFirstDate().getFullYear() +
		'-' +
		(ThisMonthFirstDate().getMonth() + 1).toString().padStart(2, '0') +
		'-01');

	onDestroy(
		selectedStore.subscribe(async () => {
			await OnStoreChange();
		})
	);

	async function OnStoreChange() {
		if ($selectedStore === '*') {
			const { data, error } = await db.store.getStoreData();
			if (error) {
				console.error(error);
			}
			storeData = data ?? [];
			showStoreName = (data ?? []).map((item) => item.store_name);
			$selectedStore = showStoreName;
		} else {
			showStoreName = $selectedStore;
		}
		choosingStoreName = choosingStoreName.filter((item) => showStoreName.includes(item));
		await QueryCommissionData();
	}

	async function QueryCommissionData() {
		const yearMonth = choosingDate.split('-').slice(0, 2).join('-');
		let query = supabase.from('default_commission_view').select('*').eq('year_month', yearMonth);

		if ($selectedStore !== '*') query = query.in('store_name', $selectedStore);

		const { data, error } = await query;
		if (error) {
			console.error(error);
		}
		commissionData = data ?? [];
	}

	onMount(async () => {
		await loadInitialData();
	});

	async function loadInitialData() {
		const { data: yearMonthData, error: yearMonthError } = await supabase
			.from('default_commission_view')
			//@ts-expect-error
			.select('year_month', { distinct: true })
			.order('year_month', { ascending: false });
		if (yearMonthError) {
			console.error(yearMonthError);
		}

		const { data: artistDataResponse, error: artistError } = await supabase
			.from('artist')
			.select('*');
		if (artistError) {
			console.error(artistError);
		}
		artistData = artistDataResponse ?? [];

		const { data: storeDataResponse, error: storeError } = await db.store.getStoreData();
		if (storeError) {
			console.error(storeError);
		}
		storeData = storeDataResponse ?? [];

		choosingArtist = [];
		// todo : get artist use store filter, and when only choose store, only modify artist in show
		choosingStoreName = [];
	}

	let newCommission: number = $state();

	async function updateCommission() {
		const toInsert = [];

		if (choosingArtist.length === 0 && choosingStoreName.length === 0) {
			alert('Please select at least one artist or store');
			return;
		} else if (choosingArtist.length !== 0 && choosingStoreName.length !== 0) {
			for (const artistId of choosingArtist) {
				for (const storeName of choosingStoreName) {
					const storeId = storeData.find((item) => item.store_name === storeName)?.id;
					if (!storeId) continue;

					const existingCommission = commissionData.find(
						(item) => item.artist_id === artistId && item.store_name === storeName
					);

					if (!existingCommission) {
						toInsert.push({
							artist_id: artistId,
							store_id: storeId,
							commission: newCommission,
							year_month: choosingDate.split('-').slice(0, 2).join('-')
						});
					}
				}
			}
		} else if (choosingArtist.length !== 0) {
			for (const artistId of choosingArtist) {
				for (const storeName of showStoreName) {
					const storeId = storeData.find((item) => item.store_name === storeName)?.id;
					if (!storeId) continue;

					const existingCommission = commissionData.find(
						(item) => item.artist_id === artistId && item.store_name === storeName
					);

					if (!existingCommission) {
						toInsert.push({
							artist_id: artistId,
							store_id: storeId,
							commission: newCommission,
							year_month: choosingDate.split('-').slice(0, 2).join('-')
						});
					}
				}
			}
		} else if (choosingStoreName.length !== 0) {
			for (const artist of artistData) {
				const artistId = artist.id;
				for (const storeName of choosingStoreName) {
					const storeId = storeData.find((item) => item.store_name === storeName)?.id;
					if (!storeId) continue;

					const existingCommission = commissionData.find(
						(item) => item.artist_id === artistId && item.store_name === storeName
					);

					if (!existingCommission) {
						toInsert.push({
							artist_id: artistId,
							store_id: storeId,
							commission: newCommission,
							year_month: choosingDate.split('-').slice(0, 2).join('-')
						});
					}
				}
			}
		}

		let query = supabase
			.from('artist_commission')
			.update({ commission: newCommission })
			.eq('year_month', choosingDate.split('-').slice(0, 2).join('-'));

		if (choosingStoreName.length > 0 && choosingArtist.length > 0)
			query = query
				.in(
					'store_id',
					storeData
						.filter((item) => choosingStoreName.includes(item.store_name))
						.map((item) => item.id)
				)
				.in('artist_id', choosingArtist);
		else if (choosingStoreName.length > 0)
			query = query.in(
				'store_id',
				storeData
					.filter((item) => choosingStoreName.includes(item.store_name))
					.map((item) => item.id)
			);
		else if (choosingArtist.length > 0) {
			query = query.in('artist_id', choosingArtist).in(
				'store_id',
				storeData.filter((item) => showStoreName.includes(item.store_name)).map((item) => item.id)
			);
		}

		const { error } = await query.select();

		if (error) {
			console.error(error);
			alert(`Error updating commissions: ${error.message}`);
			return;
		}

		if (toInsert.length > 0) {
			const { error } = await supabase.from('artist_commission').insert(toInsert).select();

			if (error) {
				console.error(error);
				alert(`Error inserting commissions: ${error.message}`);
				return;
			}
		}

		await QueryCommissionData();
	}

	async function updateChoosingDate() {
		await QueryCommissionData();
	}
</script>

<!-- todo: only show visible shop -->
<input type="date" bind:value={choosingDate} onchange={updateChoosingDate} />
<span>choose date only see year and month</span>

{#if commissionData}
	<form
		onsubmit={async () => {
			await updateCommission();
		}}
		class="m-2 flex w-fit justify-start gap-4 rounded-lg border-4 border-lele-line p-2 font-bold"
	>
		<input
			type="number"
			required
			bind:value={newCommission}
			placeholder="Enter new commission"
			min="0"
			max="100"
			class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		/>
		<div class="justify-end">(%)</div>
		<button type="submit">
			<InfoBox title={'Update'}></InfoBox>
		</button>
	</form>

	<LeleTable>
		<LeleThead>
			<tr>
				<th scope="col" class="w-auto p-2"> name </th>
				{#each showStoreName as s}
					<th scope="col" class="w-20">
						<label class="flex h-full w-full cursor-pointer items-center justify-center p-2">
							<input
								type="checkbox"
								onclick={(e) => {
									// @ts-expect-error no want to change e type use as
									if (e?.target?.checked) {
										choosingStoreName = [...choosingStoreName, s];
									} else {
										choosingStoreName = choosingStoreName.filter((item) => item !== s);
									}
								}}
								checked={choosingStoreName.includes(s)}
							/>
							<span>
								{s.split(' ').length !== 1 ? s.split(' ')[1] : s}
							</span>
						</label>
					</th>
				{/each}
			</tr>
		</LeleThead>
		<LeleTbody>
			{#each artistData as artist}
				<LeleTbodyTr>
					<td>
						<label class="flex w-full cursor-pointer items-center">
							<input
								type="checkbox"
								onclick={(e) => {
									//@ts-expect-error
									if (e?.target?.checked) {
										choosingArtist = [...choosingArtist, artist.id];
									} else {
										choosingArtist = choosingArtist.filter((item) => item !== artist.id);
									}
								}}
								checked={choosingArtist.includes(artist.id)}
							/>
							<span>
								{artist.artist_name}
							</span>
						</label>
					</td>
					{#if showStoreName}
						{#each showStoreName as s}
							<td
								class:bg-orange-900={choosingArtist.includes(artist.id) ||
									choosingStoreName.includes(s)}
								class:text-white={choosingArtist.includes(artist.id) ||
									choosingStoreName.includes(s)}
								class="duration-300 ease-in-out"
							>
								{commissionData.find(
									(item) => item.store_name === s && item.artist_id === artist.id
								)
									? commissionData.find(
											(item) => item.store_name === s && item.artist_id === artist.id
										)?.commission
									: 10}
							</td>
						{/each}
					{/if}
				</LeleTbodyTr>
			{/each}
		</LeleTbody>
	</LeleTable>
{/if}
