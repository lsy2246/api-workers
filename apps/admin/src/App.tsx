import "./styles.css";
import {
	render,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "hono/jsx/dom";
import { createApiFetch } from "./core/api";
import {
	initialChannelForm,
	initialData,
	initialSettingsForm,
	tabs,
} from "./core/constants";
import type {
	AdminData,
	Channel,
	ChannelForm,
	DashboardData,
	Settings,
	SettingsForm,
	TabId,
	Token,
	UsageLog,
} from "./core/types";
import { toggleStatus } from "./core/utils";
import { AppLayout } from "./features/AppLayout";
import { ChannelsView } from "./features/ChannelsView";
import { DashboardView } from "./features/DashboardView";
import { LoginView } from "./features/LoginView";
import { ModelsView } from "./features/ModelsView";
import { SettingsView } from "./features/SettingsView";
import { TokensView } from "./features/TokensView";
import { UsageView } from "./features/UsageView";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
	throw new Error("Missing #app root");
}

/**
 * Renders the admin console application.
 *
 * Returns:
 *   Root application JSX element.
 */
const App = () => {
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem("admin_token"),
	);
	const [activeTab, setActiveTab] = useState<TabId>("dashboard");
	const [loading, setLoading] = useState(false);
	const [notice, setNotice] = useState("");
	const [data, setData] = useState<AdminData>(initialData);
	const [settingsForm, setSettingsForm] =
		useState<SettingsForm>(initialSettingsForm);
	const [channelPage, setChannelPage] = useState(1);
	const [channelPageSize, setChannelPageSize] = useState(10);
	const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
	const [channelForm, setChannelForm] = useState<ChannelForm>(() => ({
		...initialChannelForm,
	}));
	const [isChannelModalOpen, setChannelModalOpen] = useState(false);

	const updateToken = useCallback((next: string | null) => {
		setToken(next);
		if (next) {
			localStorage.setItem("admin_token", next);
		} else {
			localStorage.removeItem("admin_token");
		}
	}, []);

	const apiFetch = useMemo(
		() => createApiFetch(token, () => updateToken(null)),
		[token, updateToken],
	);

	const loadDashboard = useCallback(async () => {
		const dashboard = await apiFetch<DashboardData>("/api/dashboard");
		setData((prev) => ({ ...prev, dashboard }));
	}, [apiFetch]);

	const loadChannels = useCallback(async () => {
		const result = await apiFetch<{ channels: Channel[] }>("/api/channels");
		setData((prev) => ({ ...prev, channels: result.channels }));
	}, [apiFetch]);

	const loadModels = useCallback(async () => {
		const result = await apiFetch<{
			models: Array<{
				id: string;
				channels: Array<{ id: string; name: string }>;
			}>;
		}>("/api/models");
		setData((prev) => ({ ...prev, models: result.models }));
	}, [apiFetch]);

	const loadTokens = useCallback(async () => {
		const result = await apiFetch<{ tokens: Token[] }>("/api/tokens");
		setData((prev) => ({ ...prev, tokens: result.tokens }));
	}, [apiFetch]);

	const loadUsage = useCallback(async () => {
		const result = await apiFetch<{ logs: UsageLog[] }>("/api/usage?limit=50");
		setData((prev) => ({ ...prev, usage: result.logs }));
	}, [apiFetch]);

	const loadSettings = useCallback(async () => {
		const settings = await apiFetch<Settings>("/api/settings");
		setData((prev) => ({ ...prev, settings }));
	}, [apiFetch]);

	const loadTab = useCallback(
		async (tabId: TabId) => {
			setLoading(true);
			setNotice("");
			try {
				if (tabId === "dashboard") {
					await loadDashboard();
				}
				if (tabId === "channels") {
					await loadChannels();
				}
				if (tabId === "models") {
					await loadModels();
				}
				if (tabId === "tokens") {
					await loadTokens();
				}
				if (tabId === "usage") {
					await loadUsage();
				}
				if (tabId === "settings") {
					await loadSettings();
				}
			} catch (error) {
				setNotice((error as Error).message);
			} finally {
				setLoading(false);
			}
		},
		[
			loadChannels,
			loadDashboard,
			loadModels,
			loadSettings,
			loadTokens,
			loadUsage,
		],
	);

	useEffect(() => {
		if (token) {
			loadTab(activeTab);
		}
	}, [token, activeTab, loadTab]);

	useEffect(() => {
		if (!data.settings) {
			return;
		}
		setSettingsForm({
			log_retention_days: String(data.settings.log_retention_days ?? 30),
			session_ttl_hours: String(data.settings.session_ttl_hours ?? 12),
			admin_password: "",
		});
	}, [data.settings]);

	const handleLogin = useCallback(
		async (event: Event) => {
			event.preventDefault();
			const form = event.currentTarget as HTMLFormElement;
			const formData = new FormData(form);
			const password = String(formData.get("password") ?? "");
			try {
				const result = await apiFetch<{ token: string }>("/api/auth/login", {
					method: "POST",
					body: JSON.stringify({ password }),
				});
				updateToken(result.token);
				setNotice("");
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, updateToken],
	);

	const handleLogout = useCallback(async () => {
		await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
		updateToken(null);
	}, [apiFetch, updateToken]);

	const handleChannelFormChange = useCallback((patch: Partial<ChannelForm>) => {
		setChannelForm((prev) => ({ ...prev, ...patch }));
	}, []);

	const handleSettingsFormChange = useCallback(
		(patch: Partial<SettingsForm>) => {
			setSettingsForm((prev) => ({ ...prev, ...patch }));
		},
		[],
	);

	const handleChannelPageChange = useCallback((next: number) => {
		setChannelPage(next);
	}, []);

	const handleChannelPageSizeChange = useCallback((next: number) => {
		setChannelPageSize(next);
		setChannelPage(1);
	}, []);

	const handleTabChange = useCallback((tabId: TabId) => {
		setActiveTab(tabId);
	}, []);

	const closeChannelModal = useCallback(() => {
		setEditingChannel(null);
		setChannelForm({ ...initialChannelForm });
		setChannelModalOpen(false);
	}, []);

	const openChannelCreate = useCallback(() => {
		setEditingChannel(null);
		setChannelForm({ ...initialChannelForm });
		setChannelModalOpen(true);
		setNotice("");
	}, []);

	const startChannelEdit = useCallback((channel: Channel) => {
		setEditingChannel(channel);
		setChannelForm({
			name: channel.name ?? "",
			base_url: channel.base_url ?? "",
			api_key: channel.api_key ?? "",
			weight: channel.weight ?? 1,
		});
		setChannelModalOpen(true);
		setNotice("");
	}, []);

	const handleChannelSubmit = useCallback(
		async (event: Event) => {
			event.preventDefault();
			const channelName = channelForm.name.trim();
			const normalizedName = channelName.toLowerCase();
			const nameExists = data.channels.some(
				(channel) =>
					channel.name.trim().toLowerCase() === normalizedName &&
					channel.id !== editingChannel?.id,
			);
			if (nameExists) {
				setNotice("渠道名称已存在，请使用其他名称");
				return;
			}
			try {
				const body = {
					name: channelName,
					base_url: channelForm.base_url.trim(),
					api_key: channelForm.api_key.trim(),
					weight: Number(channelForm.weight),
				};
				if (editingChannel) {
					await apiFetch(`/api/channels/${editingChannel.id}`, {
						method: "PATCH",
						body: JSON.stringify(body),
					});
					setNotice("渠道已更新");
				} else {
					await apiFetch("/api/channels", {
						method: "POST",
						body: JSON.stringify(body),
					});
					setNotice("渠道已创建");
				}
				closeChannelModal();
				await loadChannels();
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[
			apiFetch,
			channelForm,
			closeChannelModal,
			data.channels,
			editingChannel,
			loadChannels,
		],
	);

	const handleTokenSubmit = useCallback(
		async (event: Event) => {
			event.preventDefault();
			const form = event.currentTarget as HTMLFormElement;
			const formData = new FormData(form);
			const payload = Object.fromEntries(formData.entries()) as Record<
				string,
				FormDataEntryValue
			>;
			try {
				const result = await apiFetch<{ token: string }>("/api/tokens", {
					method: "POST",
					body: JSON.stringify({
						name: payload.name,
						quota_total: payload.quota_total
							? Number(payload.quota_total)
							: null,
					}),
				});
				setNotice(`新令牌: ${result.token}`);
				form.reset();
				await loadTokens();
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, loadTokens],
	);

	const handleSettingsSubmit = useCallback(
		async (event: Event) => {
			event.preventDefault();
			const retention = Number(settingsForm.log_retention_days);
			const sessionTtlHours = Number(settingsForm.session_ttl_hours);
			const payload: Record<string, number | string> = {
				log_retention_days: retention,
				session_ttl_hours: sessionTtlHours,
			};
			const password = settingsForm.admin_password.trim();
			if (password) {
				payload.admin_password = password;
			}
			try {
				await apiFetch("/api/settings", {
					method: "PUT",
					body: JSON.stringify(payload),
				});
				await loadSettings();
				setSettingsForm((prev) => ({ ...prev, admin_password: "" }));
				setNotice("设置已更新");
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, loadSettings, settingsForm],
	);

	const handleChannelTest = useCallback(
		async (id: string) => {
			try {
				const result = await apiFetch<{ models: Array<{ id: string }> }>(
					`/api/channels/${id}/test`,
					{
						method: "POST",
					},
				);
				await loadChannels();
				setNotice(`连通测试完成，模型数 ${result.models?.length ?? 0}`);
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, loadChannels],
	);

	const handleChannelDelete = useCallback(
		async (id: string) => {
			try {
				await apiFetch(`/api/channels/${id}`, { method: "DELETE" });
				await loadChannels();
				setNotice("渠道已删除");
				if (editingChannel?.id === id) {
					closeChannelModal();
				}
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, closeChannelModal, editingChannel, loadChannels],
	);

	const handleChannelToggle = useCallback(
		async (id: string, status: string) => {
			try {
				const next = toggleStatus(status);
				await apiFetch(`/api/channels/${id}`, {
					method: "PATCH",
					body: JSON.stringify({ status: next }),
				});
				await loadChannels();
				setNotice(`渠道已${next === "active" ? "启用" : "停用"}`);
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, loadChannels],
	);

	const handleTokenDelete = useCallback(
		async (id: string) => {
			try {
				await apiFetch(`/api/tokens/${id}`, { method: "DELETE" });
				await loadTokens();
				setNotice("令牌已删除");
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, loadTokens],
	);

	const handleTokenReveal = useCallback(
		async (id: string) => {
			try {
				const result = await apiFetch<{ token: string | null }>(
					`/api/tokens/${id}/reveal`,
				);
				setNotice(result.token ? `令牌: ${result.token}` : "未找到令牌");
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch],
	);

	const handleTokenToggle = useCallback(
		async (id: string, status: string) => {
			try {
				const next = toggleStatus(status);
				await apiFetch(`/api/tokens/${id}`, {
					method: "PATCH",
					body: JSON.stringify({ status: next }),
				});
				await loadTokens();
				setNotice(`令牌已${next === "active" ? "启用" : "停用"}`);
			} catch (error) {
				setNotice((error as Error).message);
			}
		},
		[apiFetch, loadTokens],
	);

	const handleUsageRefresh = useCallback(async () => {
		try {
			await loadUsage();
			setNotice("日志已刷新");
		} catch (error) {
			setNotice((error as Error).message);
		}
	}, [loadUsage]);

	const channelTotal = data.channels.length;
	const channelTotalPages = useMemo(
		() => Math.max(1, Math.ceil(channelTotal / channelPageSize)),
		[channelTotal, channelPageSize],
	);
	const pagedChannels = useMemo(() => {
		const start = (channelPage - 1) * channelPageSize;
		return data.channels.slice(start, start + channelPageSize);
	}, [channelPage, channelPageSize, data.channels]);

	useEffect(() => {
		setChannelPage((prev) => Math.min(prev, channelTotalPages));
	}, [channelTotalPages]);

	const activeLabel = useMemo(
		() => tabs.find((tab) => tab.id === activeTab)?.label ?? "管理台",
		[activeTab],
	);

	const renderContent = () => {
		if (loading) {
			return (
				<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
					加载中...
				</div>
			);
		}
		if (activeTab === "dashboard") {
			return <DashboardView dashboard={data.dashboard} />;
		}
		if (activeTab === "channels") {
			return (
				<ChannelsView
					channelForm={channelForm}
					channelPage={channelPage}
					channelPageSize={channelPageSize}
					channelTotal={channelTotal}
					channelTotalPages={channelTotalPages}
					pagedChannels={pagedChannels}
					editingChannel={editingChannel}
					isChannelModalOpen={isChannelModalOpen}
					onCreate={openChannelCreate}
					onCloseModal={closeChannelModal}
					onEdit={startChannelEdit}
					onSubmit={handleChannelSubmit}
					onTest={handleChannelTest}
					onToggle={handleChannelToggle}
					onDelete={handleChannelDelete}
					onPageChange={handleChannelPageChange}
					onPageSizeChange={handleChannelPageSizeChange}
					onFormChange={handleChannelFormChange}
				/>
			);
		}
		if (activeTab === "models") {
			return <ModelsView models={data.models} />;
		}
		if (activeTab === "tokens") {
			return (
				<TokensView
					tokens={data.tokens}
					onSubmit={handleTokenSubmit}
					onReveal={handleTokenReveal}
					onToggle={handleTokenToggle}
					onDelete={handleTokenDelete}
				/>
			);
		}
		if (activeTab === "usage") {
			return <UsageView usage={data.usage} onRefresh={handleUsageRefresh} />;
		}
		if (activeTab === "settings") {
			return (
				<SettingsView
					settingsForm={settingsForm}
					adminPasswordSet={data.settings?.admin_password_set ?? false}
					onSubmit={handleSettingsSubmit}
					onFormChange={handleSettingsFormChange}
				/>
			);
		}
		return (
			<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-lg">
				未知模块
			</div>
		);
	};

	return (
		<div class="min-h-screen bg-linear-to-b from-white via-stone-50 to-stone-100 font-['IBM_Plex_Sans'] text-stone-900 antialiased">
			{token ? (
				<AppLayout
					tabs={tabs}
					activeTab={activeTab}
					activeLabel={activeLabel}
					token={token}
					notice={notice}
					onTabChange={handleTabChange}
					onLogout={handleLogout}
				>
					{renderContent()}
				</AppLayout>
			) : (
				<LoginView notice={notice} onSubmit={handleLogin} />
			)}
		</div>
	);
};

render(<App />, root);
