import type { TabId, TabItem } from "../core/types";

type AppLayoutProps = {
	tabs: TabItem[];
	activeTab: TabId;
	activeLabel: string;
	token: string | null;
	notice: string;
	onTabChange: (tabId: TabId) => void;
	onLogout: () => void;
	children?: unknown;
};

/**
 * Renders the admin app layout.
 *
 * Args:
 *   props: App layout props.
 *
 * Returns:
 *   App shell JSX element.
 */
export const AppLayout = ({
	tabs,
	activeTab,
	activeLabel,
	token,
	notice,
	onTabChange,
	onLogout,
	children,
}: AppLayoutProps) => (
	<div class="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
		<aside class="border-b border-stone-200 bg-white px-5 py-8 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
			<div class="mb-8 flex flex-col gap-1.5">
				<h2 class="font-['Space_Grotesk'] text-lg font-semibold tracking-tight text-stone-900">
					api-workers
				</h2>
				<span class="text-xs uppercase tracking-widest text-stone-500">
					console
				</span>
			</div>
			<nav class="flex flex-col gap-2.5">
				{tabs.map((tab) => (
					<button
						class={`flex h-11 w-full items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
							activeTab === tab.id
								? "bg-stone-100 text-stone-900"
								: "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
						}`}
						type="button"
						onClick={() => onTabChange(tab.id)}
					>
						{tab.label}
					</button>
				))}
			</nav>
		</aside>
		<main class="px-6 pt-6 pb-16 sm:px-10 sm:pt-8">
			<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="font-['Space_Grotesk'] text-2xl tracking-tight text-stone-900">
						{activeLabel}
					</h1>
					<p class="text-sm text-stone-500">
						集中管理渠道、模型、令牌与使用情况。
					</p>
				</div>
				<div class="flex items-center gap-3">
					<span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
						{token ? "已登录" : "未登录"}
					</span>
					<button
						class="h-11 rounded-lg border border-stone-200 bg-transparent px-4 py-2.5 text-sm font-semibold text-stone-500 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:text-stone-900 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
						type="button"
						onClick={onLogout}
					>
						退出
					</button>
				</div>
			</div>
			{notice && (
				<div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
					{notice}
				</div>
			)}
			{children}
		</main>
	</div>
);
