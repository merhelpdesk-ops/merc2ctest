import { ListsTable, Switcher } from 'components';
import { Buy, Sell } from 'components/QuickBuy';
import { List } from 'models/types';
import Link from 'next/link';
import React, { useState } from 'react';

import { ArrowLongLeftIcon } from '@heroicons/react/24/outline';

type QuickBuyType = 'Buy' | 'Sell';

const Quick = () => {
	const [buyLists, setBuyLists] = useState<List[]>([]);
	const [sellLists, setSellLists] = useState<List[]>([]);
	const [seeLists, setSeeLists] = useState(false);
	const [type, setType] = useState<QuickBuyType>('Buy');
	const [loading, setLoading] = useState(false);
	const [buyFiatAmount, setBuyFiatAmount] = useState<number>();
	const [buyTokenAmount, setBuyTokenAmount] = useState<number>();

	const onBuySellClick = (fiatAmount: number | undefined, tokenAmount: number) => {
		setBuyFiatAmount(fiatAmount);
		setBuyTokenAmount(tokenAmount);
		setSeeLists(true);
	};

	const selectedLists = type === 'Buy' ? buyLists : sellLists;
	const showLists = selectedLists.length > 0 && seeLists && (type === 'Sell' || !!buyFiatAmount) && !!buyTokenAmount;

	return (
		<div className="min-h-screen bg-[#05070A] text-gray-100 flex flex-col justify-center selection:bg-purple-500 selection:text-white relative overflow-hidden">
			{/* 背景科技感发光光晕 */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#2C76E5]/15 via-[#955AFF]/15 to-[#6FD9EC]/10 blur-[120px] rounded-full pointer-events-none" />

			{showLists && (
				<div className="py-6 relative z-10 animate-fadeIn">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
						<div className="flex">
							<div
								className="flex flex-row items-center cursor-pointer group text-gray-300 hover:text-white transition-colors duration-200"
								onClick={() => setSeeLists(false)}
							>
								<div className="p-2 rounded-xl bg-gray-900/80 border border-gray-800 group-hover:border-purple-500/50 shadow-lg transition-all">
									<ArrowLongLeftIcon width={24} className="text-[#6FD9EC]" />
								</div>
								<span className="pl-3 font-semibold tracking-wide">Back to {type}</span>
							</div>
						</div>
						<div className="py-6">
							<div className="backdrop-blur-2xl bg-gray-900/60 border border-gray-800/80 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
								<ListsTable
									lists={selectedLists}
									fiatAmount={buyFiatAmount}
									tokenAmount={buyTokenAmount}
									hideLowAmounts
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className={`flex flex-col justify-center sm:py-12 sm:px-6 lg:px-8 relative z-10 ${showLists ? 'hidden' : ''}`}>
				<Link
					href="/airdrop"
					className="flex w-full text-center md:hidden pt-4 px-4 group"
				>
					<span className="w-full px-16 py-3.5 bg-gradient-to-r from-[#2C76E5] via-[#955AFF] to-[#6FD9EC] rounded-2xl text-white text-base font-bold shadow-[0_0_25px_-5px_#955AFF] transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]">
						🎁 Rewards Airdrop
					</span>
				</Link>

				<div className="mt-8 mx-4 sm:mx-auto sm:w-full sm:max-w-md">
					{/* 极酷毛玻璃卡片 */}
					<div className="backdrop-blur-2xl bg-gray-900/70 py-8 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-gray-800/80 rounded-3xl sm:px-10 relative overflow-hidden">
						{/* 卡片顶部的霓虹流光边线 */}
						<div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#955AFF] to-transparent opacity-80" />

						<div className="space-y-6">
							<div className="flex flex-row items-center justify-between">
								<h1 className="text-2xl font-extrabold tracking-tight text-white">
									{type} <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6FD9EC] to-[#2C76E5]">Crypto</span>
								</h1>
								<div className="bg-gray-950/80 p-1 rounded-2xl border border-gray-800/60 shadow-inner">
									<Switcher
										leftLabel="Buy"
										rightLabel="Sell"
										selected={type}
										onToggle={(t) => setType(t as QuickBuyType)}
									/>
								</div>
							</div>

							<div className={`${loading ? 'animate-pulse opacity-80' : ''} transition-opacity`}>
								<div className={`${type === 'Sell' ? 'hidden' : ''}`}>
									<Buy
										lists={buyLists}
										updateLists={setBuyLists}
										onSeeOptions={onBuySellClick}
										onLoading={setLoading}
									/>
								</div>

								<div className={`${type === 'Buy' ? 'hidden' : ''}`}>
									<Sell
										lists={sellLists}
										updateLists={setSellLists}
										onLoading={setLoading}
										onSeeOptions={onBuySellClick}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

Quick.getInitialProps = async () => ({ simpleLayout: true });

export default Quick;
