import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { AppEnv } from "./env";
import { adminAuth } from "./middleware/adminAuth";
import authRoutes from "./routes/auth";
import channelRoutes from "./routes/channels";
import dashboardRoutes from "./routes/dashboard";
import modelRoutes from "./routes/models";
import newapiChannelRoutes from "./routes/newapiChannels";
import newapiGroupRoutes from "./routes/newapiGroups";
import newapiUserRoutes from "./routes/newapiUsers";
import proxyRoutes from "./routes/proxy";
import settingsRoutes from "./routes/settings";
import tokenRoutes from "./routes/tokens";
import usageRoutes from "./routes/usage";

const app = new Hono<AppEnv>({ strict: false });

app.use("*", async (c, next) => {
	const method = c.req.method;
	const path = c.req.path;
	const contentType = c.req.header("content-type") ?? "";
	if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
		const raw = c.req.raw.clone();
		let bodyType = "unknown";
		let bodyKeys: string[] = [];
		let bodySize = 0;
		try {
			const payload = await raw.json();
			bodyType = "json";
			if (payload && typeof payload === "object" && !Array.isArray(payload)) {
				bodyKeys = Object.keys(payload);
			}
		} catch {
			try {
				const text = await raw.text();
				bodyType = "text";
				bodySize = text.length;
			} catch {
				bodyType = "unreadable";
			}
		}
		console.log("[request]", {
			method,
			path,
			content_type: contentType,
			body_type: bodyType,
			body_keys: bodyKeys,
			body_size: bodySize,
		});
	} else {
		console.log("[request]", { method, path });
	}
	await next();
});

app.use("*", logger());
app.use(
	"/api/*",
	cors({
		origin: (_origin, c) => {
			const allowed = c.env.CORS_ORIGIN ?? "*";
			return allowed === "*"
				? "*"
				: allowed.split(",").map((item: string) => item.trim());
		},
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"x-api-key",
			"x-admin-token",
			"New-Api-User",
		],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	}),
);
app.use(
	"/v1/*",
	cors({
		origin: "*",
		allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
		allowMethods: ["GET", "POST", "OPTIONS"],
	}),
);

app.use("/api/*", async (c, next) => {
	if (
		c.req.path === "/api/auth/login" ||
		c.req.path.startsWith("/api/channel") ||
		c.req.path.startsWith("/api/user") ||
		c.req.path.startsWith("/api/group")
	) {
		return next();
	}
	return adminAuth(c, next);
});

app.get("/health", (c) => c.json({ ok: true }));

app.route("/api/auth", authRoutes);
app.route("/api/channels", channelRoutes);
app.route("/api/models", modelRoutes);
app.route("/api/tokens", tokenRoutes);
app.route("/api/usage", usageRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/channel", newapiChannelRoutes);
app.route("/api/user", newapiUserRoutes);
app.route("/api/group", newapiGroupRoutes);

app.route("/v1", proxyRoutes);

export default app;
