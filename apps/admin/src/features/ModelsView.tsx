import type { ModelItem } from "../core/types";

type ModelsViewProps = {
	models: ModelItem[];
};

/**
 * Renders the models view.
 *
 * Args:
 *   props: Models view props.
 *
 * Returns:
 *   Models JSX element.
 */
export const ModelsView = ({ models }: ModelsViewProps) => (
	<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
				模型广场
			</h3>
			<span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
				{models.length} 个模型
			</span>
		</div>
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						模型
					</th>
					<th class="border-b border-stone-200 px-3 py-2.5 text-left text-xs uppercase tracking-widest text-stone-500">
						渠道
					</th>
				</tr>
			</thead>
			<tbody>
				{models.map((model) => (
					<tr class="hover:bg-stone-50" key={model.id}>
						<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
							{model.id}
						</td>
						<td class="border-b border-stone-200 px-3 py-2.5 text-left text-sm text-stone-700">
							{model.channels.map((channel) => channel.name).join(" / ")}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);
