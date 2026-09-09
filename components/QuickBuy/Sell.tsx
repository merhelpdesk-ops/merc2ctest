/* eslint-disable no-promise-executor-return */
import Button from 'components/Button/Button';
import Input from 'components/Input/Input';
import Loading from 'components/Loading/Loading';
import CurrencySelect from 'components/Select/CurrencySelect';
import TokenSelect from 'components/Select/TokenSelect';
import { useEscrowFee } from 'hooks';
import debounce from 'lodash.debounce';
import { FiatCurrency, List, PriceSource, Token } from 'models/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { formatUnits } from 'viem';

interface SellProps {
	lists: List[];
	updateLists: (lists: List[]) => void;
	onSeeOptions: (fiatAmount: number | undefined, tokenAmount: number) => void;
	onLoading: (loading: boolean) => void;
}

// 1. 定义仅支持的稳定币列表 (USDT / USDC)
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

// 2. 限制支持的 5 种法币 (CNY, CNH, EUR, USD, SGD)
const FIAT_CURRENCIES: FiatCurrency[] = [
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

// 降级兜底汇率
const FALLBACK_RATES: Record<string, number> = {
	CNY: 7.23,
	CNH: 7.23,
	EUR: 0.92,
	USD: 1.0,
	SGD: 1.34
};

const Sell = ({ lists, updateLists, onSeeOptions, onLoading }: SellProps) => {
	const [tokenAmount, setTokenAmount] = useState<number>();

	const [currency, setCurrency] = useState<FiatCurrency | undefined>(FIAT_CURRENCIES[0]);
	const [token, setToken] = useState<Token | undefined>(STABLECOINS[0]);
	const [creatingAd, setCreatingAd] = useState(false);
	const [loading, setLoading] = useState(false);

	// 储存币安估算参考汇率
	const [estimatedPrice, setEstimatedPrice] = useState<number>();

	const { fee } = useEscrowFee({ token, tokenAmount, chainId: token?.chain_id });

	const router = useRouter();

	const updateLoading = (l: boolean) => {
		setLoading(l);
		onLoading(l);
	};

	// 获取币安实时汇率
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
				type: 'BuyList',
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
			const data = await response.json();

			// 防崩处理：校验 data 是否为数组
			const searchLists: List[] = Array.isArray(data) ? data : [];
			updateLists(searchLists);

			const [list] = searchLists;
			const { price } = list || {};

			if (price) {
				// 有商家买单，显示最高的收单价
				setEstimatedPrice(price);
			} else {
				// 无商家买单，抓取币安参考汇率进行折算显示
				const rate = await fetchBinanceRate(currency.code, token.symbol);
				setEstimatedPrice(rate);
			}
		} catch (error) {
			console.error(error);
			updateLists([]);
		}
		updateLoading(false);
	};

	const onChangeToken = (val: number | undefined) => {
		setTokenAmount(val);
		if (val && token && currency) {
			search({ fiatValue: undefined, tokenValue: val });
		}
	};

	useEffect(() => {
		search({ fiatValue: undefined, tokenValue: tokenAmount });
	}, [token, currency]);

	const presentSearchParams = currency && token && tokenAmount;
	const disabled = loading || !presentSearchParams;

	const onPostAd = async () => {
		if (disabled) return;

		if (lists.length === 0) {
			setCreatingAd(true);
			await new Promise((resolve) => setTimeout(resolve, 1500));
			router.push(
				{
					pathname: '/sell',
					query: { currency: currency?.id, token: token?.id, tokenAmount }
				},
				'/sell'
			);
		} else {
			onSeeOptions(undefined, tokenAmount);
		}
	};

	return (
		<>
			<div className={`${creatingAd ? 'hidden' : ''}`}>
				<div>
					<Input
						label="Crypto to Sell"
						id="cryptoSell"
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
				<CurrencySelect
					onSelect={setCurrency}
					selected={currency}
					label="Fiat to Receive"
					height="h-16"
					selectTheFirst
				/>

				{/* 汇率与计算结果提示 */}
				{lists.length > 0 ? (
					<div className="mb-2 flex flex-row items-center">
						<CheckIcon width={20} height={20} className="text-green-500 stroke-2 mr-1" />
						<span className="text-sm text-gray-700">
							{lists.length} {lists.length > 1 ? 'options' : 'option'} available up to {currency?.symbol}{' '}
							{Number(lists[0].price).toFixed(2)} per {token?.symbol}
						</span>
					</div>
				) : (
					!!token &&
					!!currency &&
					!!tokenAmount &&
					!loading && (
						<div className="mb-3">
							{!!estimatedPrice && (
								<div className="mb-1 flex flex-row items-center text-xs text-blue-600">
									<InformationCircleIcon width={16} height={16} className="mr-1" />
									<span>
										Estimated to receive: ≈ {currency?.symbol}{' '}
										{(tokenAmount * estimatedPrice).toFixed(2)} {currency?.code} (Rate: {estimatedPrice.toFixed(2)})
									</span>
								</div>
							)}
							<div className="text-sm text-gray-700">
								<span>We could not find any available buyers. Post a sell ad instead.</span>
							</div>
						</div>
					)
				)}

				<Button
					disabled={disabled}
					onClick={onPostAd}
					title={!presentSearchParams || lists.length > 0 ? 'See Sell Options' : 'Post a Sell Ad'}
				/>

				<div className="text-center mt-4">
					{!!fee && !!token && (
						<span className="text-xs text-gray-600 text-center">
							Total fee: {formatUnits(fee, token.decimals)} {token.symbol}
						</span>
					)}
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

export default Sell;
