import type { Token } from "../core/types";
import { buildPageItems, formatDateTime } from "../core/utils";

type TokensViewProps = {
	pagedTokens: Token[];
	tokenPage: number;
	tokenPageSize: number;
	tokenTotal: number;
	tokenTotalPages: number;
	isTokenModalOpen: boolean;
	onCreate: () => void;
	onCloseModal: () => void;
	onPageChange: (next: number) => void;
	onPageSizeChange: (next: number) => void;
	onSubmit: (event: Event) => void;
	onReveal: (id: string) => void;
	onToggle: (id: string, status: string) => void;
	onDelete: (id: string) => void;
};

const pageSizeOptions = [10, 20, 50];

/**
 * Renders the tokens management view.
 *
 * Args:
 *   props: Tokens view props.
 *
 * Returns:
 *   Tokens JSX element.
 */
export const TokensView = ({
	pagedTokens,
	tokenPage,
	tokenPageSize,
	tokenTotal,
	tokenTotalPages,
	isTokenModalOpen,
	onCreate,
	onCloseModal,
	onPageChange,
	onPageSizeChange,
	onSubmit,
	onReveal,
	onToggle,
	onDelete,
}: TokensViewProps) => {
	const pageItems = buildPageItems(tokenPage, tokenTotalPages);
	return (
		<div class="space-y-5">
			<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h3 class="mb-1 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
							令牌列表
						</h3>
						<p class="text-xs text-stone-500">
							统一管理令牌状态、额度与操作入口。
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button
							class="h-9 rounded-full bg-stone-900 px-4 text-xs font-semibold text-white transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
							type="button"
							onClick={onCreate}
						>
							新增令牌
						</button>
					</div>
				</div>
				<div class="mt-4 overflow-hidden rounded-xl border border-stone-200">
					<div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-3 bg-stone-50 px-4 py-3 text-xs uppercase tracking-widest text-stone-500">
						<div>名称</div>
						<div>状态</div>
						<div>已用/额度</div>
						<div>前缀</div>
						<div>创建时间</div>
						<div>操作</div>
					</div>
					{pagedTokens.length === 0 ? (
						<div class="px-4 py-10 text-center text-sm text-stone-500">
							暂无令牌，请先创建。
						</div>
					) : (
						<div class="divide-y divide-stone-100">
							{pagedTokens.map((tokenItem) => {
								const isActive = tokenItem.status === "active";
								return (
									<div
										class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 px-4 py-4 text-sm"
										key={tokenItem.id}
									>
										<div class="flex min-w-0 flex-col">
											<span class="truncate font-semibold text-stone-900">
												{tokenItem.name}
											</span>
										</div>
										<div>
											<span
												class={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
													isActive
														? "border-emerald-100 bg-emerald-50 text-emerald-600"
														: "border-stone-200 bg-stone-100 text-stone-500"
												}`}
											>
												{isActive ? "启用" : "禁用"}
											</span>
										</div>
										<div class="text-sm font-semibold text-stone-700">
											{tokenItem.quota_used} / {tokenItem.quota_total ?? "∞"}
										</div>
										<div class="text-sm text-stone-700">
											{tokenItem.key_prefix ?? "-"}
										</div>
										<div class="text-sm text-stone-700">
											{formatDateTime(tokenItem.created_at)}
										</div>
										<div class="flex flex-wrap gap-2">
											<button
												class="h-9 rounded-full border border-stone-200 bg-stone-100 px-3 text-xs font-semibold text-stone-900 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
												type="button"
												onClick={() => onReveal(tokenItem.id)}
											>
												查看
											</button>
											<button
												class="h-9 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
												type="button"
												onClick={() => onToggle(tokenItem.id, tokenItem.status)}
											>
												切换
											</button>
											<button
												class="h-9 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
												type="button"
												onClick={() => onDelete(tokenItem.id)}
											>
												删除
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
				<div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-xs text-stone-500">
							共 {tokenTotal} 条 · {tokenTotalPages} 页
						</span>
						<button
							class="h-8 w-8 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
							type="button"
							disabled={tokenPage <= 1}
							onClick={() => onPageChange(Math.max(1, tokenPage - 1))}
						>
							&lt;
						</button>
						{pageItems.map((item, index) =>
							item === "ellipsis" ? (
								<span class="px-2 text-xs text-stone-400" key={`e-${index}`}>
									...
								</span>
							) : (
								<button
									class={`h-8 min-w-8 rounded-full border px-3 text-xs font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
										item === tokenPage
											? "border-stone-900 bg-stone-900 text-white shadow-md"
											: "border-stone-200 bg-white text-stone-600 hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-md"
									}`}
									type="button"
									key={item}
									onClick={() => onPageChange(item)}
								>
									{item}
								</button>
							),
						)}
						<button
							class="h-8 w-8 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
							type="button"
							disabled={tokenPage >= tokenTotalPages}
							onClick={() =>
								onPageChange(Math.min(tokenTotalPages, tokenPage + 1))
							}
						>
							&gt;
						</button>
					</div>
					<label class="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-500">
						每页条数
						<select
							class="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-xs text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
							value={tokenPageSize}
							onChange={(event) => {
								onPageSizeChange(
									Number((event.currentTarget as HTMLSelectElement).value),
								);
							}}
						>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
					</label>
				</div>
			</div>
			{isTokenModalOpen && (
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 py-8">
					<div class="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h3 class="mb-1 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
									生成令牌
								</h3>
								<p class="text-xs text-stone-500">
									创建后可在列表中查看与管理。
								</p>
							</div>
							<button
								class="h-9 rounded-full border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-500 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
								type="button"
								onClick={onCloseModal}
							>
								关闭
							</button>
						</div>
						<form class="mt-4 grid gap-3.5" onSubmit={onSubmit}>
							<div>
								<label
									class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
									for="token-name"
								>
									名称
								</label>
								<input
									class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
									id="token-name"
									name="name"
									required
								/>
							</div>
							<div>
								<label
									class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
									for="token-quota"
								>
									额度（可选）
								</label>
								<input
									class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
									id="token-quota"
									name="quota_total"
									type="number"
									min="0"
									placeholder="留空表示无限"
								/>
							</div>
							<div class="flex flex-wrap items-center justify-end gap-2 pt-2">
								<button
									class="h-10 rounded-full border border-stone-200 bg-stone-50 px-4 text-xs font-semibold text-stone-500 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
									type="button"
									onClick={onCloseModal}
								>
									取消
								</button>
								<button
									class="h-10 rounded-full bg-stone-900 px-5 text-xs font-semibold text-white transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
									type="submit"
								>
									生成令牌
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
