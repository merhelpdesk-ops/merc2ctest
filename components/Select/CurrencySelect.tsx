/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/indent */
import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import Loading from 'components/Loading/Loading';
import { FiatCurrency, PriceSource } from 'models/types';
import React, { useEffect, useState } from 'react';

import Select from './Select';
import { FiatCurrencySelect, SelectProps } from './Select.types';

const ALLOWED_CURRENCY_CODES = ['CNY', 'CNH', 'EUR', 'USD', 'SGD'];

// 兜底本地数据，防止接口无数据或未登录时为空
const DEFAULT_FIAT_CURRENCIES: FiatCurrency[] = [
	{
		id: 1,
		code: 'CNY',
		name: 'Chinese Yuan',
		symbol: '¥',
		icon: '',
		country_code: 'CN',
		allow_binance_rates: true,
		default_price_source: 'binance' as unknown as PriceSource
	},
	{
		id: 2,
		code: 'CNH',
		name: 'Offshore Chinese Yuan',
		symbol: '¥',
		icon: '',
		country_code: 'CN',
		allow_binance_rates: true,
		default_price_source: 'binance' as unknown as PriceSource
	},
	{
		id: 3,
		code: 'EUR',
		name: 'Euro',
		symbol: '€',
		icon: '',
		country_code: 'EU',
		allow_binance_rates: true,
		default_price_source: 'binance' as unknown as PriceSource
	},
	{
		id: 4,
		code: 'USD',
		name: 'US Dollar',
		symbol: '$',
		icon: '',
		country_code: 'US',
		allow_binance_rates: true,
		default_price_source: 'binance' as unknown as PriceSource
	},
	{
		id: 5,
		code: 'SGD',
		name: 'Singapore Dollar',
		symbol: 'S$',
		icon: '',
		country_code: 'SG',
		allow_binance_rates: true,
		default_price_source: 'binance' as unknown as PriceSource
	}
];

const CurrencySelect = ({
	onSelect,
	selected,
	error,
	height,
	selectedIdOnLoad,
	label = 'Choose Fiat currency to receive',
	minimal = false,
	selectTheFirst = false,
	selectByLocation = false,
	labelStyle = ''
}: FiatCurrencySelect) => {
	const [rawCurrencies, setRawCurrencies] = useState<FiatCurrency[]>();
	const [currencies, setCurrencies] = useState<FiatCurrency[]>();
	const [isLoading, setLoading] = useState(false);
	const [search, setSearch] = useState('');

	useEffect(() => {
		const fetchCurrencyByLocation = async () => {
			if (selectByLocation && currencies) {
				try {
					const response = await fetch('https://ipapi.co/currency/');
					const currency = await response.text();

					if (currency) {
						const toSelect = currencies.find((c) => c.code === currency);
						if (toSelect) {
							onSelect(toSelect);
						}
					}

					if (selectTheFirst && !selected && currencies[0]) {
						onSelect(currencies[0]);
					}
				} catch (e) {
					console.error('Currency API', e);
				}
			}
		};
		fetchCurrencyByLocation();
	}, [currencies]);

	useEffect(() => {
		setLoading(true);
		fetch('/api/currencies', {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.json())
			.then((data) => {
				let filteredData: FiatCurrency[] = [];

				if (Array.isArray(data)) {
					filteredData = data.filter((c: FiatCurrency) =>
						ALLOWED_CURRENCY_CODES.includes(c?.code?.toUpperCase())
					);
				}

				// 如果接口没返回数据或没有匹配到，则使用兜底数据
				if (!filteredData || filteredData.length === 0) {
					filteredData = DEFAULT_FIAT_CURRENCIES;
				}

				setRawCurrencies(filteredData);
				const filtered: FiatCurrency[] = filteredData.map((c: FiatCurrency) => ({
					...c,
					name: c.code
				}));
				setCurrencies(filtered);

				if (selectedIdOnLoad) {
					if (!selected) {
						const toSelect = filtered.find(({ id }) => String(id) === selectedIdOnLoad);
						if (toSelect && !selected) {
							onSelect(toSelect);
						}
					}
				} else if (selectTheFirst && !selected && filtered[0]) {
					onSelect(filtered[0]);
				}
			})
			.catch(() => {
				// 接口报错时使用兜底数据
				const fallback = DEFAULT_FIAT_CURRENCIES.map((c) => ({ ...c, name: c.code }));
				setRawCurrencies(DEFAULT_FIAT_CURRENCIES);
				setCurrencies(fallback);
				if (selectTheFirst && !selected && fallback[0]) {
					onSelect(fallback[0]);
				}
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const selectCurrency = (option: FiatCurrency | undefined) => {
		onSelect(option);
		setSearch('');
	};

	if (isLoading) {
		return <Loading message="" big={false} />;
	}
	const result =
		search && rawCurrencies
			? rawCurrencies
					.filter(
						(c) =>
							c.code.toLowerCase().includes(search.toLowerCase()) ||
							c.name.toLowerCase().includes(search.toLowerCase()) ||
							String(c.country_code).toLowerCase().includes(search.toLowerCase()) ||
							c.symbol.toLowerCase().includes(search.toLowerCase())
					)
					.map((c: FiatCurrency) => ({ ...c, ...{ name: c.code } }))
			: currencies;

	return result ? (
		<Select
			label={label}
			options={result}
			selected={selected}
			onSelect={selectCurrency as SelectProps['onSelect']}
			error={error}
			minimal={minimal}
			height={height}
			flag
			onSearch={setSearch}
			labelStyle={labelStyle}
		/>
	) : (
		<></>
	);
};
export default CurrencySelect;
