<script lang="ts">
	import LeleTable from '$lib/Component/htmlWrapper/LeleTable.svelte';
	import LeleThead from '$lib/Component/htmlWrapper/LeleThead.svelte';
	import LeleTbody from '$lib/Component/htmlWrapper/LeleTbody.svelte';
	import LeleTbodyTr from '$lib/Component/htmlWrapper/LeleTbodyTr.svelte';
	import { type StoreRow } from '$lib/db';

	interface Props {
		totalData?: {
			artist_name: string | null;
			total_sales: number;
			net_sales: number;
			discount: number;
		}[];
		dataReady: any;
		realTotal?: number[];
		RemitDataMulNetTotal?: {
			netSaleMulRemit: number;
			total_sales: number;
			net_sales: number;
			discount: number;
			quantity: number;
			artist_id: number | null;
			artist_name: string | null;
			store_name: string;
			commission: number;
		}[];
		storeData?: StoreRow[];
		selectedStore: string[] | '*';
	}

	let {
		totalData = [],
		dataReady,
		realTotal = [],
		RemitDataMulNetTotal = [],
		storeData = [],
		selectedStore
	}: Props = $props();
	const needSum = false;

	function FindItem(artist_name: string | null, store_name: string) {
		console.log('finding ', RemitDataMulNetTotal);
		return RemitDataMulNetTotal.find(
			(item) => item.artist_name === artist_name && item.store_name === store_name
		);
	}

	function getProcessedNetSale(artist_name: string | null, store_name: string) {
		const item = FindItem(artist_name, store_name);
		return item ? `${item.netSaleMulRemit}(${100 - item.commission}%)` : '';
	}

	function calculateStoreSum(artist_name: string | null) {
		const stores =
			selectedStore === '*' ? storeData.map((store) => store.store_name) : selectedStore;
		return stores.reduce((acc, store) => {
			return acc + (FindItem(artist_name, store)?.netSaleMulRemit ?? 0);
		}, 0);
	}
</script>

<LeleTable>
	<LeleThead>
		<tr>
			<th scope="col" class="w-60 p-2">name</th>
			<th scope="col" class="w-20 p-2">Net Total</th>
			{#each selectedStore as store}
				<th scope="col" class="w-20 p-2">{store}</th>
			{/each}
			{#if needSum}
				<th scope="col" class="w-20 p-2">store sum</th>
			{/if}
		</tr>
	</LeleThead>
	<LeleTbody>
		{#if dataReady}
			<LeleTbodyTr>
				<td class="p-2">Total</td>
				<td class="p-2"
					>{realTotal.reduce((pre, nex) => {
						return pre + nex;
					}, 0)}</td
				>
				{#each selectedStore as store}
					<td class="p-2"
						>{RemitDataMulNetTotal.filter((item) => item.store_name === store).reduce(
							(pre, nex) => {
								return pre + nex.netSaleMulRemit;
							},
							0
						)}</td
					>
				{/each}
				{#if needSum}
					<td class="p-2"
						>{RemitDataMulNetTotal.reduce((pre, nex) => {
							return pre + nex.netSaleMulRemit;
						}, 0)}</td
					>
				{/if}
			</LeleTbodyTr>
			{#if RemitDataMulNetTotal.length === 0}
				<tr>
					<td class="p-2" colspan={selectedStore.length + 2}>No data</td>
				</tr>
			{:else}
				{#each totalData as data, index}
					<LeleTbodyTr>
						<td class="p-2">{data.artist_name}</td>
						<td class="p-2">{realTotal[index]}</td>
						{#each selectedStore as store}
							<td class="p-2">{getProcessedNetSale(data.artist_name, store)}</td>
						{/each}
						{#if needSum}
							<td class="p-2">{calculateStoreSum(data.artist_name)}</td>
						{/if}
					</LeleTbodyTr>
				{/each}
			{/if}
		{:else}
			<tr>
				<td class="p-2" colspan={selectedStore.length + 2}>Loading...</td>
			</tr>
		{/if}
	</LeleTbody>
</LeleTable>
