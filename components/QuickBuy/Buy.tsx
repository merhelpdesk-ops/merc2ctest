/* eslint-disable no-promise-executor-return */
import { Button, CurrencySelect, Input, Loading, TokenSelect } from 'components';
import debounce from 'lodash.debounce';
import { FiatCurrency, List, PriceSource, Token } from 'models/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { truncate } from 'utils';

import { CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';

interface BuyProps {
	lists: List[];
	updateLists: (lists: List[]) => void;
	onSeeOptions: (fiatAmount: number, tokenAmount: number) => void;
	onLoading: (loading: boolean) => void;
}

// 1. 仅支持 USDT 和 USDC
const STABLECOINS: Token[] = [
	{
		id: 1,
		name: 'Tether USD',
		symbol: 'USDT',
		decimals: 6,
		address: '0x...',
		chain_id: 1,
		coingecko_id: 'tether',
		icon: '',
		gasless: false,
		allow_binance_rates: false
	},
	{
		id: 2,
		name: 'USD Coin',
		symbol: 'USDC',
		decimals: 6,
		address: '0x...',
		chain_id: 1,
		coingecko_id: 'usd-coin',
		icon: '',
		gasless: false,
		allow_binance_rates: false
	}
];

// 2. 仅支持指定 5 种法币 (CNY, CNH, EUR, USD, SGD)
const ALLOWED_FIATS: FiatCurrency[] = [
	{ id: 1, code: 'CNY', name: 'Chinese Yuan', symbol: '¥', icon: '', country_code: 'CN', allow_binance_rates: true, default_price_source: 'binance' as unknown as PriceSource },
	{ id: 2, code: 'CNH', name: 'Offshore Chinese Yuan', symbol: '¥', icon: '', country_code: 'CN', allow_binance_rates: true, default_price_source: 'binance' as unknown as PriceSource },
	{ id: 3, code: 'EUR', name: 'Euro', symbol: '€', icon: '', country_code: 'EU', allow_binance_rates: true, default_price_source: 'binance' as unknown as PriceSource },
	{ id: 4, code: 'USD', name: 'US Dollar', symbol: '$', icon: '', country_code: 'US', allow_binance_rates: true, default_price_source: 'binance' as unknown as PriceSource },
	{ id: 5, code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', icon: '', country_code: 'SG', allow_binance_rates: true, default_price_source: 'binance' as unknown as PriceSource }
];

// 5 种法币的汇率备用降级策略
const FALLBACK_RATES: Record<string, number> = {
	CNY: 7.23,
	CNH: 7.23,
	EUR: 0.92,
	USD: 1.0,
	SGD: 1.34
};

const Buy = ({ lists, updateLists, onSeeOptions, onLoading }: BuyProps) => {
	const [fiatAmount, setFiatAmount] = useState<number>();
	const [tokenAmount, setTokenAmount] = useState<number>();

	const [currency, setCurrency] = useState<FiatCurrency | undefined>(ALLOWED_FIATS[0]);
	const [token, setToken] = useState<Token | undefined>(STABLECOINS[0]);
	const [loading, setLoading] = useState(false);
	const [creatingAd, setCreatingAd] = useState(false);

	const [estimatedPrice, setEstimatedPrice] = useState<number>();

	const router = useRouter();

	const updateLoading = (l: boolean) => {
		setLoading(l);
		onLoading(l);
	};

	// 抓取币安实时汇率
	const fetchBinanceRate = async (fiatCode: string, tokenSymbol: string) => {
		try {
			if (fiatCode === 'USD') return 1;

			const symbol = `${tokenSymbol}${fiatCode === 'CNH' ? 'CNY' : fiatCode}`.toUpperCase();
			const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
			const data = await res.json();
			if (data && data.price) {
				return parseFloat(data.price);
			}
		} catch (e) {
			console.error('Fetch binance rate error:', e);
		}

		return FALLBACK_RATES[fiatCode] || 1;
	};

	const search = async ({
		tokenValue,
		fiatValue
	}: {
		tokenValue: number | undefined;
		fiatValue: number | undefined;
	}) => {
		if (!token || !currency || (!tokenValue && !fiatValue)) return;
		updateLoading(true);
		try {
			const params = {
				type: 'SellList',
				fiat_currency_code: currency.code,
				token_symbol: token.symbol,
				token_amount: String(tokenValue || ''),
				fiat_amount: String(fiatValue || '')
			};

			const filteredParams = Object.fromEntries(
				Object.entries(params).filter(([, value]) => value !== undefined)
			);
			const response = await fetch(`/api/quickbuy?${new URLSearchParams(filteredParams).toString()}`, {
				headers: {
					Authorization: `Bearer ${getAuthToken()}`
				}
			});
			const searchLists: List[] = await response.json();
			updateLists(searchLists);

			const [list] = searchLists;
			const { price } = list || {};

			if (price) {
				// 有卖单：取订单价格
				setEstimatedPrice(price);
				if (tokenValue) setFiatAmount(tokenValue * price);
				if (fiatValue) setTokenAmount(truncate(fiatValue / price, token.decimals));
			} else {
				// 无卖单：抓取币安参考汇率进行换算
				const rate = await fetchBinanceRate(currency.code, token.symbol);
				setEstimatedPrice(rate);

				if (rate) {
					if (fiatValue) setTokenAmount(truncate(fiatValue / rate, token.decimals));
					if (tokenValue) setFiatAmount(tokenValue * rate);
				}
			}
		} catch (error) {
			console.error(error);
		}
		updateLoading(false);
	};

	useEffect(() => {
		search({ fiatValue: fiatAmount, tokenValue: undefined });
	}, [currency]);

	useEffect(() => {
		search({ fiatValue: undefined, tokenValue: tokenAmount });
	}, [token]);

	const onChangeFiat = (val: number | undefined) => {
		setFiatAmount(val);
		if (val && token && currency) {
			search({ fiatValue: val, tokenValue: undefined });
		}
	};

	const onChangeToken = (val: number | undefined) => {
		setTokenAmount(val);
		if (val && token && currency) {
			search({ fiatValue: undefined, tokenValue: val });
		}
	};

	const presentSearchParams = currency && token && (fiatAmount || tokenAmount);
	const disabled = loading || !presentSearchParams;

	const onButtonClick = async () => {
		if (disabled) return;

		if (!!fiatAmount && !!tokenAmount && !!currency && !!token && lists.length > 0) {
			onSeeOptions(fiatAmount, tokenAmount);
		} else if (presentSearchParams && lists.length === 0) {
			setCreatingAd(true);
			await new Promise((resolve) => setTimeout(resolve, 1500));
			router.push(
				{
					pathname: '/sell',
					query: { currency: currency?.id, token: token?.id, fiatAmount, tokenAmount }
				},
				'/sell'
			);
		}
	};

	return (
		<>
			<div className={`${creatingAd ? 'hidden' : ''}`}>
				<div>
					<Input
						label="Fiat Amount"
						id="fiat"
						placeholder="Enter Amount"
						extraStyle="h-16 text-gray-900"
						addOn={
							<CurrencySelect
								onSelect={setCurrency}
								selected={currency}
								minimal
								selectTheFirst
							/>
						}
						type="decimal"
						onChangeNumber={debounce(onChangeFiat, 1000)}
						value={fiatAmount}
					/>
				</div>
				<div>
					<Input
						label="Crypto to Receive"
						id="crypto"
						placeholder="Enter Amount"
						extraStyle="h-16 text-gray-900"
						addOn={
							<TokenSelect
								onSelect={setToken}
								selected={token}
								minimal
								tokens={STABLECOINS}
							/>
						}
						type="decimal"
						decimalScale={token?.decimals}
						onChangeNumber={debounce(onChangeToken, 1000)}
						value={tokenAmount}
					/>
				</div>

				{/* 汇率与挂单提示 */}
				{lists.length > 0 ? (
					<div className="mb-2 flex flex-row items-center">
						<CheckIcon width={20} height={20} className="text-green-500 stroke-2 mr-1" />
						<span className="text-sm text-gray-700">
							{lists.length} {lists.length > 1 ? 'options' : 'option'} available from {currency?.symbol}{' '}
							{Number(lists[0].price).toFixed(2)} per {token?.symbol}
						</span>
					</div>
				) : (
					!!token &&
					!!currency &&
					(!!fiatAmount || !!tokenAmount) &&
					!loading && (
						<div className="mb-3">
							{!!estimatedPrice && (
								<div className="mb-1 flex flex-row items-center text-xs text-blue-600">
									<InformationCircleIcon width={16} height={16} className="mr-1" />
									<span>
										Estimated Binance Rate: 1 {token?.symbol} ≈ {currency?.symbol}{' '}
										{estimatedPrice.toFixed(2)} {currency?.code}
									</span>
								</div>
							)}
							<div className="text-sm text-gray-700">
								<span>We could not find any available sellers. Post a buy ad instead.</span>
							</div>
						</div>
					)
				)}

				<Button
					title={!presentSearchParams || lists.length > 0 ? 'See Buy Options' : 'Post a Buy Ad'}
					processing={loading}
					disabled={disabled}
					onClick={onButtonClick}
				/>
				<div className="text-center mt-4">
					<span className="text-xs text-gray-600 text-center">Always zero fees for buyers 🎉</span>
				</div>
			</div>
			<div className={`${!creatingAd ? 'hidden' : ''}`}>
				<div className="">
					<Loading message="We are redirecting you to your ad 🚀" big={false} row={false} />
				</div>
			</div>
		</>
	);
};

export default Buy;
