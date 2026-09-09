import { ListsTable, Switcher } from 'components';
import { Buy, Sell } from 'components/QuickBuy';
import { List } from 'models/types';
import Link from 'next/link';
import React, { useState } from 'react';

import { ArrowLongLeftIcon, GiftIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
		<div className="min-h-screen bg-[#090D16] text-white relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
			{/* 背景流光炫彩光晕 */}
			<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/20 via-purple-600/15 to-transparent blur-[160px] pointer-events-none rounded-full" />
			<div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[180px] pointer-events-none rounded-full" />

			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center min-h-screen">
				
				{/* 1. 列表详情页（点击 See Options 后展示） */}
				{showLists && (
					<div className="w-full max-w-5xl mx-auto transition-all duration-300">
						<div className="flex items-center justify-between mb-6">
							<button
								type="button"
								onClick={() => setSeeLists(false)}
								className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/50 hover:bg-slate-800/80 transition-all shadow-lg group backdrop-blur-md"
							>
								<ArrowLongLeftIcon className="w-5 h-5 text-blue-400 group-hover:-translate-x-1 transition-transform" />
								<span className="font-semibold text-sm">Back to {type}</span>
							</button>
						</div>

						<div className="backdrop-blur-2xl bg-slate-900/60 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
							<ListsTable
								lists={selectedLists}
								fiatAmount={buyFiatAmount}
								tokenAmount={buyTokenAmount}
								hideLowAmounts
							/>
						</div>
					</div>
				)}

				{/* 2. 首页主界面 */}
				{!showLists && (
					<div className="flex flex-col items-center">
						
						{/* 顶部 Hero 标语区 */}
						<section className="text-center max-w-3xl mx-auto mb-10 pt-4">
							<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
								<SparklesIcon className="w-4 h-4" />
								<span>Next-Gen P2P Trading</span>
							</div>

							<h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
								全新 Web3 极速交易体验
							</h1>
							
							<p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
								安全、顺畅、零附加费的去中心化 OTC / P2P 数字货币交易平台
							</p>

							{/* 移动端 Rewards Airdrop 按钮 */}
							<div className="mt-6 md:hidden w-full max-w-md mx-auto">
								<Link
									href="/airdrop"
									className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl text-white font-bold shadow-[0_0_25px_-5px_rgba(79,70,229,0.5)] transition-all active:scale-[0.98]"
								>
									<GiftIcon className="w-5 h-5" />
									<span>Rewards Airdrop</span>
								</Link>
							</div>
						</section>

						{/* 核心交易卡片区 */}
						<section className="w-full max-w-md">
							<div className="backdrop-blur-2xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden group">
								{/* 卡片顶部高光流线 */}
								<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

								<div className="space-y-6">
									{/* 卡片头部：标题 + Buy/Sell 切换器 */}
									<div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
										<h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
											<span>{type}</span>
											<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
												Crypto
											</span>
										</h2>

										<div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
											<Switcher
												leftLabel="Buy"
												rightLabel="Sell"
												selected={type}
												onToggle={(t) => setType(t as QuickBuyType)}
											/>
										</div>
									</div>

									{/* 卡片主体：Buy / Sell 组件 */}
									<div className={`${loading ? 'animate-pulse opacity-70' : ''} transition-all`}>
										<div className={type === 'Sell' ? 'hidden' : 'block'}>
											<Buy
												lists={buyLists}
												updateLists={setBuyLists}
												onSeeOptions={onBuySellClick}
												onLoading={setLoading}
											/>
										</div>

										<div className={type === 'Buy' ? 'hidden' : 'block'}>
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
						</section>

					</div>
				)}
			</div>
		</div>
	);
};

Quick.getInitialProps = async () => ({ simpleLayout: true });

export default Quick;
