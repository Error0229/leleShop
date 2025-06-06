import { supabase } from '$lib/db';
import { YearMonth } from '$lib/class/YearMonth';

export async function GetTradeTotalDataEachOne(
	firstDate: Date,
	lastDate: Date,
	store_list: string[] | '*'
) {
	if (!firstDate || !lastDate) {
		return { error: 'invalid date', result: [] };
	}
	const query = supabase
		.from('artist_trade')
		.select(
			'total_sales:total_sales.sum(), net_sales:net_sales.sum(), discount:discount.sum(), quantity:quantity.sum(), artist_id, artist_name'
		)
		.gte('trade_date', firstDate.toISOString())
		.lt('trade_date', lastDate.toISOString())
		.order('artist_id', { ascending: true });

	if (store_list !== '*') {
		query.in('store_name', store_list);
	}

	const { data, error } = await query;

	if (error) {
		console.error(error);
		alert(error.message);
		return {
			error: 'get trade data fail',
			result: null
		};
	}

	return { data, error: null };
}

export async function GetCommission(yearMonth: YearMonth, selectedStore: string) {
	const { data, error } = await supabase
		.from('default_commission_view')
		.select('*')
		.eq('store_name', selectedStore)
		.eq('year_month', yearMonth.toString());
	if (error) {
		console.error(error);
		return [];
	}
	return data ?? [];
}

export async function GetTotalWithRemit(yearMonth: YearMonth, selectedStore: string) {
	const { data: commission, error } = await supabase
		.from('default_commission_view')
		.select('*')
		.eq('store_name', selectedStore)
		.eq('year_month', yearMonth.toString());
	if (error) {
		console.error(error);
		return [];
	}

	const firstDate = yearMonth.getFirstTimePoint();
	const lastDate = yearMonth.getLastTimePoint();
	const data = await GetTradeTotalDataEachOne(firstDate, lastDate, [selectedStore]);

	return (
		data?.data?.map((totalData) => {
			const comm =
				commission.find(
					(c) =>
						c.artist_id === totalData.artist_id &&
						c.store_name === selectedStore &&
						c.year_month === yearMonth.toString()
				)?.commission ?? 10;
			return {
				...totalData,
				commission: comm,
				netSaleMulRemit: totalData.net_sales - Math.floor(totalData.net_sales * (comm / 100))
			};
		}) ?? []
	);
}
