<script lang="ts">
	import { type ArtistWithTradeRow, type SalesTotalData } from '$lib/db';
	import { FormatDate } from '$lib/function/Utils';
	import LeleTable from '../htmlWrapper/LeleTable.svelte';
	import LeleTbody from '../htmlWrapper/LeleTbody.svelte';
	import LeleTbodyTr from '../htmlWrapper/LeleTbodyTr.svelte';
	import LeleThead from '../htmlWrapper/LeleThead.svelte';
	interface Props {
		showedTradeDataList: ArtistWithTradeRow[];
		totalData: SalesTotalData;
	}

	let { showedTradeDataList, totalData }: Props = $props();

	let total = $derived(totalData.sales_total);
	let net_total = $derived(totalData.net_total);
	let discount_total = $derived(totalData.discount_total);
	let total_quantity = $derived(totalData.total_quantity);
</script>

<LeleTable>
	<LeleThead>
		<tr>
			<th scope="col" class="w-24 p-2"> 日期 </th>
			<th scope="col" class="w-24 p-2"> 收據號碼 </th>
			<th scope="col" class="w-40 p-2"> 商品 </th>
			<th scope="col" class="w-16 p-2"> 數量 </th>
			<th scope="col" class="w-20 min-w-20 p-2"> 銷售總額 </th>
			<th scope="col" class="w-16 p-2"> 折扣 </th>
			<th scope="col" class="w-20 min-w-20 p-2"> 淨銷售額 </th>
		</tr>
	</LeleThead>
	<LeleTbody>
		<LeleTbodyTr>
			<td></td>
			<td></td>
			<td class="p-2">總和</td>
			<td class="p-2">{total_quantity}</td>
			<td class="p-2">
				{total}
			</td>
			<td class="p-2">
				{discount_total}
			</td>
			<td class="p-2">
				{net_total}
			</td>
		</LeleTbodyTr>
		{#each showedTradeDataList as trade}
			<LeleTbodyTr>
				<td class="p-2">
					<p>
						{FormatDate(trade.trade_date)}
					</p>
					<!-- <p>
										{trade.trade_head?.trade_date?.split('+')[0].split('T')[1]}
									</p> -->
				</td>
				<td class="p-2"> {trade.trade_id}</td>
				<td class="p-2"> {trade.item_name}</td>
				<td class="p-2"> {trade.quantity}</td>
				<td class="p-2"> {trade.total_sales}</td>
				<td class="p-2"> {trade.discount}</td>
				<td class="p-2"> {trade.net_sales}</td>
			</LeleTbodyTr>
		{/each}
	</LeleTbody>
</LeleTable>
