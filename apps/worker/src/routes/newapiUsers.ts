import { Hono } from "hono";
import type { AppEnv } from "../env";
import { newApiAuth } from "../middleware/newApiAuth";
import { collectUniqueModelIds } from "../services/channel-models";
import { listActiveChannels } from "../services/channel-repo";
import { newApiSuccess } from "../utils/newapi-response";

const users = new Hono<AppEnv>({ strict: false });
users.use("*", newApiAuth);

users.get("/models", async (c) => {
	const channels = await listActiveChannels(c.env.DB);
	const data = collectUniqueModelIds(channels).map((id) => ({
		id,
		name: id,
	}));
	return newApiSuccess(c, data);
});

export default users;
