import { useEffect, useMemo, useState } from "hono/jsx/dom";
import type { UsageLog } from "../core/types";
import { buildPageItems, formatDateTime } from "../core/utils";

type UsageViewProps = {
	usage: UsageLog[];
	onRefresh: () => void;
};

const pageSizeOptions = [50, 100, 200];

const formatTokens = (value: number | null | undefined) =>
	value === null || value === undefined ? "-" : value;

const formatSeconds = (value: number | null | undefined) => {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return "-";
	}
	return `${(value / 1000).toFixed(2)} s`;
};

const formatStream = (value: boolean | number | null | undefined) => {
	if (value === null || value === undefined) {
		return "-";
	}
	if (typeof value === "number") {
		return value > 0 ? "是" : "否";
	}
	return value ? "是" : "否";
};

/**
 * Renders the usage logs view.
 *
 * Args:
 *   props: Usage view props.
 *
 * Returns:
 *   Usage JSX element.
 */
export const UsageView = ({ usage, onRefresh }: UsageViewProps) => {
	const [pageSize, setPageSize] = useState(50);
	const [page, setPage] = useState(1);
	const total = usage.length;
	const totalPages = useMemo(
		() => Math.max(1, Math.ceil(total / pageSize)),
		[total, pageSize],
	);

	useEffect(() => {
		setPage(1);
	}, [pageSize]);

	useEffect(() => {
		setPage((prev) => Math.min(prev, totalPages));
	}, [totalPages]);

	const pagedUsage = useMemo(() => {
		const start = (page - 1) * pageSize;
		return usage.slice(start, start + pageSize);
	}, [usage, page, pageSize]);
	const pageItems = useMemo(
		() => buildPageItems(page, totalPages),
		[page, totalPages],
	);

	return (
		<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 class="mb-1 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
						使用日志
					</h3>
					<p class="text-xs text-stone-500">
						追踪每次调用的令牌与关键性能指标。
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<button
						class="h-9 rounded-full border border-stone-200 bg-stone-100 px-4 text-xs font-semibold text-stone-900 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
						type="button"
						onClick={onRefresh}
					>
						刷新
					</button>
				</div>
			</div>
			<div class="mt-4 overflow-hidden rounded-xl border border-stone-200">
				<div class="h-[520px] overflow-auto">
					<table class="min-w-[1100px] w-full border-collapse text-sm">
						<thead>
							<tr>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									时间
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									模型
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									渠道
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									令牌
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									输入 Tokens
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									输出 Tokens
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									用时
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									首 token 延迟
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									流式
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									推理强度
								</th>
								<th class="sticky top-0 border-b border-stone-200 bg-stone-50 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									状态
								</th>
							</tr>
						</thead>
						<tbody>
							{pagedUsage.length === 0 ? (
								<tr>
									<td
										class="px-3 py-10 text-center text-sm text-stone-500"
										colSpan={11}
									>
										暂无日志。
									</td>
								</tr>
							) : (
								pagedUsage.map((log) => (
									<tr class="hover:bg-stone-50" key={log.id}>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{formatDateTime(log.created_at)}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{log.model ?? "-"}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{log.channel_name ?? log.channel_id ?? "-"}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{log.token_name ?? log.token_id ?? "-"}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{formatTokens(log.prompt_tokens)}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{formatTokens(log.completion_tokens)}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{formatSeconds(log.latency_ms)}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{formatSeconds(log.first_token_latency_ms)}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{formatStream(log.stream)}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{log.reasoning_effort ?? "-"}
										</td>
										<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
											{log.status}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
			<div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-xs text-stone-500">共 {totalPages} 页</span>
					<button
						class="h-8 w-8 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
						type="button"
						disabled={page <= 1}
						onClick={() => setPage(Math.max(1, page - 1))}
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
									item === page
										? "border-stone-900 bg-stone-900 text-white shadow-md"
										: "border-stone-200 bg-white text-stone-600 hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-md"
								}`}
								type="button"
								key={item}
								onClick={() => setPage(item)}
							>
								{item}
							</button>
						),
					)}
					<button
						class="h-8 w-8 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
						type="button"
						disabled={page >= totalPages}
						onClick={() => setPage(Math.min(totalPages, page + 1))}
					>
						&gt;
					</button>
				</div>
				<label class="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-500">
					每页条数
					<select
						class="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-xs text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
						value={pageSize}
						onChange={(event) => {
							setPageSize(
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
	);
};
