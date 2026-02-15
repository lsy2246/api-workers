import type { DashboardData } from "../core/types";

type DashboardViewProps = {
	dashboard: DashboardData | null;
};

/**
 * Renders the dashboard summary and charts.
 *
 * Args:
 *   props: Dashboard view props.
 *
 * Returns:
 *   Dashboard JSX element.
 */
export const DashboardView = ({ dashboard }: DashboardViewProps) => {
	if (!dashboard) {
		return (
			<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
				暂无数据
			</div>
		);
	}
	const errorRate = dashboard.summary.total_requests
		? Math.round(
				(dashboard.summary.total_errors / dashboard.summary.total_requests) *
					100,
			)
		: 0;
	return (
		<div class="space-y-5">
			<div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
				<div class="flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					<span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
						总请求
					</span>
					<div class="text-2xl font-semibold text-stone-900">
						{dashboard.summary.total_requests}
					</div>
					<span class="font-['Space_Grotesk'] text-xs text-stone-500">
						最近窗口
					</span>
				</div>
				<div class="flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					<span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
						总 Tokens
					</span>
					<div class="text-2xl font-semibold text-stone-900">
						{dashboard.summary.total_tokens}
					</div>
					<span class="font-['Space_Grotesk'] text-xs text-stone-500">
						累计消耗
					</span>
				</div>
				<div class="flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					<span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
						错误率
					</span>
					<div class="text-2xl font-semibold text-stone-900">{errorRate}%</div>
					<span class="font-['Space_Grotesk'] text-xs text-stone-500">
						平均延迟 {Math.round(dashboard.summary.avg_latency)}ms
					</span>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
							按日趋势
						</h3>
					</div>
					<table class="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									日期
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									请求
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									Tokens
								</th>
							</tr>
						</thead>
						<tbody>
							{dashboard.byDay.map((row) => (
								<tr class="hover:bg-stone-50" key={row.day}>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.day}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.requests}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.tokens}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
							模型排行
						</h3>
					</div>
					<table class="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									模型
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									请求
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									Tokens
								</th>
							</tr>
						</thead>
						<tbody>
							{dashboard.byModel.map((row) => (
								<tr class="hover:bg-stone-50" key={row.model}>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.model ?? "-"}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.requests}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.tokens}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
							渠道贡献
						</h3>
					</div>
					<table class="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									渠道
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									请求
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									Tokens
								</th>
							</tr>
						</thead>
						<tbody>
							{dashboard.byChannel.map((row) => (
								<tr
									class="hover:bg-stone-50"
									key={row.channel_name ?? "unknown"}
								>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.channel_name ?? "-"}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.requests}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.tokens}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
							令牌贡献
						</h3>
					</div>
					<table class="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									令牌
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									请求
								</th>
								<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
									Tokens
								</th>
							</tr>
						</thead>
						<tbody>
							{dashboard.byToken.map((row) => (
								<tr class="hover:bg-stone-50" key={row.token_name ?? "unknown"}>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.token_name ?? "-"}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.requests}
									</td>
									<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
										{row.tokens}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
