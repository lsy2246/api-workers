import type { AdminData, ChannelForm, SettingsForm, TabItem } from "./types";

export const apiBase = import.meta.env.VITE_API_BASE ?? "";

export const tabs: TabItem[] = [
	{ id: "dashboard", label: "数据面板" },
	{ id: "channels", label: "渠道管理" },
	{ id: "models", label: "模型广场" },
	{ id: "tokens", label: "令牌管理" },
	{ id: "usage", label: "使用日志" },
	{ id: "settings", label: "系统设置" },
];

export const initialData: AdminData = {
	channels: [],
	tokens: [],
	models: [],
	usage: [],
	dashboard: null,
	settings: null,
};

export const initialChannelForm: ChannelForm = {
	name: "",
	base_url: "",
	api_key: "",
	weight: 1,
};

export const initialSettingsForm: SettingsForm = {
	log_retention_days: "30",
	session_ttl_hours: "12",
	admin_password: "",
};
