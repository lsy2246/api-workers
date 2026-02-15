import type { Channel, ChannelForm } from "../core/types";

type ChannelsViewProps = {
	channelForm: ChannelForm;
	channelPage: number;
	channelPageSize: number;
	channelTotal: number;
	channelTotalPages: number;
	pagedChannels: Channel[];
	editingChannel: Channel | null;
	isChannelModalOpen: boolean;
	onCreate: () => void;
	onCloseModal: () => void;
	onEdit: (channel: Channel) => void;
	onSubmit: (event: Event) => void;
	onTest: (id: string) => void;
	onToggle: (id: string, status: string) => void;
	onDelete: (id: string) => void;
	onPageChange: (next: number) => void;
	onPageSizeChange: (next: number) => void;
	onFormChange: (patch: Partial<ChannelForm>) => void;
};

/**
 * Renders the channels management view.
 *
 * Args:
 *   props: Channels view props.
 *
 * Returns:
 *   Channels JSX element.
 */
export const ChannelsView = ({
	channelForm,
	channelPage,
	channelPageSize,
	channelTotal,
	channelTotalPages,
	pagedChannels,
	editingChannel,
	isChannelModalOpen,
	onCreate,
	onCloseModal,
	onEdit,
	onSubmit,
	onTest,
	onToggle,
	onDelete,
	onPageChange,
	onPageSizeChange,
	onFormChange,
}: ChannelsViewProps) => {
	const isEditing = Boolean(editingChannel);
	return (
		<div class="space-y-5">
			<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h3 class="mb-1 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
							渠道列表
						</h3>
						<p class="text-xs text-stone-500">状态、权重与操作入口集中展示。</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button
							class="h-9 rounded-full bg-stone-900 px-4 text-xs font-semibold text-white transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
							type="button"
							onClick={onCreate}
						>
							新增渠道
						</button>
						<span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
							{channelTotal} 条
						</span>
						<label class="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-500">
							每页
							<select
								class="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-xs text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
								value={channelPageSize}
								onChange={(event) => {
									onPageSizeChange(
										Number((event.currentTarget as HTMLSelectElement).value),
									);
								}}
							>
								<option value="10">10</option>
								<option value="20">20</option>
								<option value="50">50</option>
							</select>
						</label>
					</div>
				</div>
				<div class="mt-4 overflow-hidden rounded-xl border border-stone-200">
					<div class="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,1.6fr)] gap-3 bg-stone-50 px-4 py-3 text-xs uppercase tracking-widest text-stone-500">
						<div>渠道</div>
						<div>状态</div>
						<div>权重</div>
						<div>操作</div>
					</div>
					{pagedChannels.length === 0 ? (
						<div class="px-4 py-10 text-center text-sm text-stone-500">
							暂无渠道，请先创建。
						</div>
					) : (
						<div class="divide-y divide-stone-100">
							{pagedChannels.map((channel) => {
								const isActive = channel.status === "active";
								return (
									<div
										class={`grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,1.6fr)] items-center gap-3 px-4 py-4 text-sm ${
											editingChannel?.id === channel.id
												? "bg-amber-50/60"
												: "bg-white"
										}`}
										key={channel.id}
									>
										<div class="flex min-w-0 flex-col">
											<span class="truncate font-semibold text-stone-900">
												{channel.name}
											</span>
											<span
												class="truncate text-xs text-stone-500"
												title={channel.base_url}
											>
												{channel.base_url}
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
											{channel.weight}
										</div>
										<div class="flex flex-wrap gap-2">
											<button
												class="h-9 rounded-full border border-stone-200 bg-stone-100 px-3 text-xs font-semibold text-stone-900 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
												type="button"
												onClick={() => onTest(channel.id)}
											>
												连通测试
											</button>
											<button
												class="h-9 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
												type="button"
												onClick={() => onToggle(channel.id, channel.status)}
											>
												{isActive ? "禁用" : "启用"}
											</button>
											<button
												class="h-9 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
												type="button"
												onClick={() => onEdit(channel)}
											>
												编辑
											</button>
											<button
												class="h-9 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
												type="button"
												onClick={() => onDelete(channel.id)}
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
					<div>
						第 {channelPage} / {channelTotalPages} 页 · 共 {channelTotal} 条
					</div>
					<div class="flex items-center gap-2">
						<button
							class="h-9 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
							type="button"
							disabled={channelPage <= 1}
							onClick={() => onPageChange(Math.max(1, channelPage - 1))}
						>
							上一页
						</button>
						<button
							class="h-9 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
							type="button"
							disabled={channelPage >= channelTotalPages}
							onClick={() =>
								onPageChange(Math.min(channelTotalPages, channelPage + 1))
							}
						>
							下一页
						</button>
					</div>
				</div>
			</div>
			{isChannelModalOpen && (
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 px-4 py-8">
					<div class="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h3 class="mb-1 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
									{isEditing ? "编辑渠道" : "新增渠道"}
								</h3>
								<p class="text-xs text-stone-500">
									{isEditing
										? `正在编辑：${editingChannel?.name ?? ""}`
										: "填写渠道信息并保存。"}
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
									for="channel-name"
								>
									名称
								</label>
								<input
									class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
									id="channel-name"
									name="name"
									value={channelForm.name}
									required
									onInput={(event) =>
										onFormChange({
											name: (event.currentTarget as HTMLInputElement).value,
										})
									}
								/>
							</div>
							<div>
								<label
									class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
									for="channel-base"
								>
									Base URL
								</label>
								<input
									class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
									id="channel-base"
									name="base_url"
									placeholder="https://api.openai.com"
									value={channelForm.base_url}
									required
									onInput={(event) =>
										onFormChange({
											base_url: (event.currentTarget as HTMLInputElement).value,
										})
									}
								/>
							</div>
							<div>
								<label
									class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
									for="channel-key"
								>
									API Key
								</label>
								<input
									class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
									id="channel-key"
									name="api_key"
									value={channelForm.api_key}
									required
									onInput={(event) =>
										onFormChange({
											api_key: (event.currentTarget as HTMLInputElement).value,
										})
									}
								/>
							</div>
							<div>
								<label
									class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
									for="channel-weight"
								>
									权重
								</label>
								<input
									class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
									id="channel-weight"
									name="weight"
									type="number"
									min="1"
									value={channelForm.weight}
									onInput={(event) =>
										onFormChange({
											weight: Number(
												(event.currentTarget as HTMLInputElement).value || 0,
											),
										})
									}
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
									{isEditing ? "保存修改" : "创建渠道"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
