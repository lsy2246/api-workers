import type { Token } from "../core/types";

type TokensViewProps = {
	tokens: Token[];
	onSubmit: (event: Event) => void;
	onReveal: (id: string) => void;
	onToggle: (id: string, status: string) => void;
	onDelete: (id: string) => void;
};

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
	tokens,
	onSubmit,
	onReveal,
	onToggle,
	onDelete,
}: TokensViewProps) => (
	<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
		<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
					生成令牌
				</h3>
			</div>
			<form class="grid gap-3.5" onSubmit={onSubmit}>
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
				<button
					class="h-11 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
					type="submit"
				>
					生成令牌
				</button>
			</form>
		</div>
		<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
					令牌列表
				</h3>
			</div>
			<table class="w-full border-collapse text-sm">
				<thead>
					<tr>
						<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
							名称
						</th>
						<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
							状态
						</th>
						<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
							已用/额度
						</th>
						<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
							操作
						</th>
					</tr>
				</thead>
				<tbody>
					{tokens.map((tokenItem) => (
						<tr class="hover:bg-stone-50" key={tokenItem.id}>
							<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
								{tokenItem.name}
							</td>
							<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
								{tokenItem.status}
							</td>
							<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
								{tokenItem.quota_used} / {tokenItem.quota_total ?? "∞"}
							</td>
							<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
								<div class="flex flex-wrap gap-2">
									<button
										class="h-11 rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-900 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
										type="button"
										onClick={() => onReveal(tokenItem.id)}
									>
										查看
									</button>
									<button
										class="h-11 rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-900 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
										type="button"
										onClick={() => onToggle(tokenItem.id, tokenItem.status)}
									>
										切换
									</button>
									<button
										class="h-11 rounded-lg border border-stone-200 bg-transparent px-4 py-2.5 text-sm font-semibold text-stone-500 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
										type="button"
										onClick={() => onDelete(tokenItem.id)}
									>
										删除
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	</div>
);
