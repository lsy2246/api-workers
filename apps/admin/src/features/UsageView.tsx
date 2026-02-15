import type { UsageLog } from "../core/types";
import { formatDateTime } from "../core/utils";

type UsageViewProps = {
	usage: UsageLog[];
	onRefresh: () => void;
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
export const UsageView = ({ usage, onRefresh }: UsageViewProps) => (
	<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
				使用日志
			</h3>
			<button
				class="h-11 rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-900 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
				type="button"
				onClick={onRefresh}
			>
				刷新
			</button>
		</div>
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						时间
					</th>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						模型
					</th>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						渠道
					</th>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						Tokens
					</th>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						延迟
					</th>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						状态
					</th>
				</tr>
			</thead>
			<tbody>
				{usage.map((log) => (
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
							{log.total_tokens ?? 0}
						</td>
						<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
							{log.latency_ms ?? 0} ms
						</td>
						<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
							{log.status}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);
