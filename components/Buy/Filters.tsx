import Input from 'components/Input/Input';
import BankSelect from 'components/Select/BankSelect';
import CurrencySelect from 'components/Select/CurrencySelect';
import { Option } from 'components/Select/Select.types';
import TokenSelect from 'components/Select/TokenSelect';
import debounce from 'lodash.debounce';
import { SearchFilters } from 'models/search';
import { FiatCurrency, Token } from 'models/types';
import React, { useEffect, useState } from 'react';

import { XMarkIcon } from '@heroicons/react/20/solid';
import NetworkSelect from 'components/Select/NetworkSelect';
import { Chain } from 'wagmi';

interface FilterProps {
	onFilterUpdate: (filters: SearchFilters) => void;
	needToReset?: boolean;
	setNeedToReset?: (value: boolean) => void;
}

// 1. 定义仅支持的稳定币列表（USDT / USDC）
const STABLECOINS: Token[] = [
	{
		id: 1,
		name: 'Tether USD',
		symbol: 'USDT',
		decimals: 6,
		address: '0x...', // 替换为你的 USDT 合约地址
		chain_id: 1
	},
	{
		id: 2,
		name: 'USD Coin',
		symbol: 'USDC',
		decimals: 6,
		address: '0x...', // 替换为你的 USDC 合约地址
		chain_id: 1
	}
];

const Filters = ({ onFilterUpdate, needToReset, setNeedToReset }: FilterProps) => {
	const [chain, setChain] = useState<Chain>();
	const [amount, setAmount] = useState<number>();
	const [token, setToken] = useState<Token>();
	const [currency, setCurrency] = useState<FiatCurrency>();
	const [fiatAmount, setFiatAmount] = useState<number>();
	const [paymentMethod, setPaymentMethod] = useState<Option>();

	useEffect(() => {
		onFilterUpdate({ amount, currency, paymentMethod, token, fiatAmount, chain });
	}, [amount, fiatAmount, paymentMethod, token, chain]);

	useEffect(() => {
		if (needToReset) {
			reset();
			setNeedToReset?.(false);
		}
	}, [needToReset]);

	useEffect(() => {
		const availableInTheNewCurrency =
			currency &&
			paymentMethod &&
			// @ts-expect-error
			(!paymentMethod.fiat_currency || paymentMethod.fiat_currency.id === currency.id);
		const newPaymentMethod = availableInTheNewCurrency ? paymentMethod : undefined;
		setPaymentMethod(newPaymentMethod);
		onFilterUpdate({ amount, fiatAmount, currency, token, paymentMethod: newPaymentMethod, chain });
	}, [currency]);

	const reset = () => {
		setAmount(undefined);
		setToken(undefined);
		setCurrency(undefined);
		setPaymentMethod(undefined);
		setFiatAmount(undefined);
		setChain(undefined);
	};

	return (
		<div className="w-full flex flex-col lg:flex-row items-center lg:space-x-4">
			<div className="w-full lg:w-auto">
				<div className="my-8">
					<NetworkSelect
						selected={chain}
						onSelect={setChain}
						extraStyle="my-0 mt-4"
						labelStyle="text-sm truncate"
					/>
				</div>
			</div>
			<div className="w-full lg:w-auto">
				{/* 2. 修改 TokenSelect 仅传入 USDT 和 USDC */}
				<TokenSelect
					label="Token"
					onSelect={setToken}
					selected={token}
					networkId={chain?.id}
					tokens={STABLECOINS}
					labelStyle="text-sm truncate"
				/>
			</div>
			<Input
				label="Token Amount"
				id="amount"
				placeholder="1000"
				type="decimal"
				value={amount}
				onChangeNumber={debounce(setAmount, 800)}
				labelStyle="text-sm"
				containerExtraStyle="w-full lg:w-32 my-0"
				extraStyle="pr-2"
			/>
			<div className="w-full lg:w-auto">
				<CurrencySelect
					label="Currency"
					onSelect={setCurrency}
					selected={currency}
					labelStyle="text-sm truncate"
					selectByLocation
				/>
			</div>
			<Input
				label="Fiat Amount"
				id="fiatAmount"
				placeholder="500"
				type="decimal"
				value={fiatAmount}
				onChangeNumber={debounce(setFiatAmount, 800)}
				labelStyle="text-sm"
				containerExtraStyle="w-full lg:w-32 my-0"
				extraStyle="pr-2"
			/>
			<div className="w-full lg:w-auto">
				<BankSelect
					currencyId={currency?.id || -1}
					onSelect={setPaymentMethod}
					selected={paymentMethod}
					labelStyle="text-sm truncate w-full"
				/>
			</div>
			<div className="w-full mb-4 lg:w-auto lg:mt-6 lg:mb-0">
				<div className="flex items-center text-gray-600 hover:cursor-pointer">
					<XMarkIcon width={24} height={24} className="text-gray-600 hove:cursor-pointer" onClick={reset} />
					<div className="lg:hidden text-sm" onClick={reset}>
						Clear Filters
					</div>
				</div>
			</div>
		</div>
	);
};

export default Filters;
