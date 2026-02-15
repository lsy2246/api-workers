export type Channel = {
	id: string;
	name: string;
	base_url: string;
	api_key: string;
	weight: number;
	status: string;
	models_json?: string;
};

export type Token = {
	id: string;
	name: string;
	key_prefix: string;
	quota_total: number | null;
	quota_used: number;
	status: string;
};

export type UsageLog = {
	id: string;
	model: string;
	channel_id: string;
	channel_name?: string | null;
	token_id: string;
	token_name?: string | null;
	total_tokens: number;
	latency_ms: number;
	status: string;
	created_at: string;
};

export type DashboardData = {
	summary: {
		total_requests: number;
		total_tokens: number;
		avg_latency: number;
		total_errors: number;
	};
	byDay: Array<{ day: string; requests: number; tokens: number }>;
	byModel: Array<{ model: string; requests: number; tokens: number }>;
	byChannel: Array<{ channel_name: string; requests: number; tokens: number }>;
	byToken: Array<{ token_name: string; requests: number; tokens: number }>;
};

export type Settings = {
	log_retention_days: number;
	session_ttl_hours: number;
	admin_password_set?: boolean;
};

export type ModelChannel = {
	id: string;
	name: string;
};

export type ModelItem = {
	id: string;
	channels: ModelChannel[];
};

export type AdminData = {
	channels: Channel[];
	tokens: Token[];
	models: ModelItem[];
	usage: UsageLog[];
	dashboard: DashboardData | null;
	settings: Settings | null;
};

export type TabId =
	| "dashboard"
	| "channels"
	| "models"
	| "tokens"
	| "usage"
	| "settings";

export type TabItem = {
	id: TabId;
	label: string;
};

export type ChannelForm = {
	name: string;
	base_url: string;
	api_key: string;
	weight: number;
};

export type SettingsForm = {
	log_retention_days: string;
	session_ttl_hours: string;
	admin_password: string;
};
