import { defineConfig } from "vite";

const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:8787";

export default defineConfig({
	build: {
		outDir: "dist",
	},
	server: {
		proxy: {
			"/api": apiTarget,
			"/v1": apiTarget,
		},
	},
});
