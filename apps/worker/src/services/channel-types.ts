export type ChannelRow = {
	id: string;
	name: string;
	base_url: string;
	api_key: string;
	weight: number;
	status: string;
	rate_limit?: number | null;
	models_json?: string | null;
	type?: number | null;
	group_name?: string | null;
	priority?: number | null;
	metadata_json?: string | null;
	test_time?: number | string | null;
	response_time_ms?: number | null;
	created_at?: string | null;
	updated_at?: string | null;
};

export type ChannelRecord = ChannelRow;
