import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import Loading from 'components/Loading/Loading';
import { Token } from 'models/types';
import React, { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import { polygon } from 'wagmi/chains';

import Select from './Select';
import { SelectProps, TokenSelectProps } from './Select.types';

const TokenSelect = ({
	onSelect,
	selected,
	error,
	minimal,
	selectedIdOnLoad,
	label = 'Choose token to list',
	labelStyle = '',
	networkId,
	allTokens = false,
	tokens: customTokens
}: TokenSelectProps) => {
	const [tokens, setTokens] = useState<Token[]>();
	const [isLoading, setLoading] = useState(false);
	const { chain, chains } = useNetwork();
	const chainId = allTokens ? undefined : networkId || chain?.id || chains[0]?.id || polygon.id;

	useEffect(() => {
		if (customTokens && customTokens.length > 0) {
			setTokens(customTokens);
			if (selectedIdOnLoad) {
				if (!selected) {
					const toSelect = customTokens.find(({ id }) => String(id) === selectedIdOnLoad);
					if (toSelect) {
						onSelect(toSelect);
					}
				}
			} else if (minimal && !selected && customTokens[0]) {
				onSelect(customTokens[0]);
			}
			return;
		}

		if (!chainId && !allTokens) return;

		setLoading(true);

		fetch(`/api/tokens?${new URLSearchParams({ chain_id: chainId ? chainId.toString() : '' }).toString()}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.json())
			.then((data) => {
				const source: Token[] = minimal ? data.map((t: Token) => ({ ...t, ...{ name: t.symbol } })) : data;
				if (allTokens) {
					const uniqueSymbols = new Set<string>();
					const uniqueSource = source.filter((t) => {
						if (uniqueSymbols.has(t.symbol)) {
							return false;
						}
						uniqueSymbols.add(t.symbol);
						return true;
					});
					setTokens(uniqueSource);
				} else {
					setTokens(source);
				}

				if (selectedIdOnLoad) {
					if (!selected) {
						const toSelect = source.find(({ id }) => String(id) === selectedIdOnLoad);
						if (toSelect && !selected) {
							onSelect(toSelect);
						}
					}
				} else if (minimal && !selected && source[0]) {
					onSelect(source[0]);
				}
				setLoading(false);
			});
	}, [chainId, customTokens]);

	if (isLoading) {
		return <Loading message="" big={false} />;
	}

	return tokens ? (
		<Select
			label={label}
			options={tokens}
			selected={selected}
			onSelect={onSelect as SelectProps['onSelect']}
			error={error}
			minimal={minimal}
			token
			labelStyle={labelStyle}
		/>
	) : (
		<></>
	);
};
export default TokenSelect;
