import type { SettingsForm } from "../core/types";

type SettingsViewProps = {
	settingsForm: SettingsForm;
	adminPasswordSet: boolean;
	onSubmit: (event: Event) => void;
	onFormChange: (patch: Partial<SettingsForm>) => void;
};

/**
 * Renders the settings view.
 *
 * Args:
 *   props: Settings view props.
 *
 * Returns:
 *   Settings JSX element.
 */
export const SettingsView = ({
	settingsForm,
	adminPasswordSet,
	onSubmit,
	onFormChange,
}: SettingsViewProps) => (
	<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="mb-0 font-['Space_Grotesk'] text-lg tracking-tight text-stone-900">
				系统设置
			</h3>
		</div>
		<form class="grid gap-3.5 lg:grid-cols-2" onSubmit={onSubmit}>
			<div>
				<label
					class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
					for="retention"
				>
					日志保留天数
				</label>
				<input
					class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
					id="retention"
					name="log_retention_days"
					type="number"
					min="1"
					value={settingsForm.log_retention_days}
					onInput={(event) => {
						const target = event.currentTarget as HTMLInputElement | null;
						onFormChange({
							log_retention_days: target?.value ?? "",
						});
					}}
				/>
			</div>
			<div>
				<label
					class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
					for="session-ttl"
				>
					会话时长（小时）
				</label>
				<input
					class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
					id="session-ttl"
					name="session_ttl_hours"
					type="number"
					min="1"
					value={settingsForm.session_ttl_hours}
					onInput={(event) => {
						const target = event.currentTarget as HTMLInputElement | null;
						onFormChange({
							session_ttl_hours: target?.value ?? "",
						});
					}}
				/>
			</div>
			<div class="lg:col-span-2">
				<label
					class="mb-1.5 block text-xs uppercase tracking-widest text-stone-500"
					for="admin-password"
				>
					管理员密码
				</label>
				<input
					class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
					id="admin-password"
					name="admin_password"
					type="password"
					placeholder={
						adminPasswordSet
							? "已设置，留空则不修改"
							: "未设置，保存后即为登录密码"
					}
					value={settingsForm.admin_password}
					onInput={(event) => {
						const target = event.currentTarget as HTMLInputElement | null;
						onFormChange({
							admin_password: target?.value ?? "",
						});
					}}
				/>
				<p class="mt-1 text-xs text-stone-500">
					密码状态：{adminPasswordSet ? "已设置" : "未设置"}
				</p>
			</div>
			<div class="flex items-end lg:col-span-2">
				<button
					class="h-11 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
					type="submit"
				>
					保存设置
				</button>
			</div>
		</form>
	</div>
);
