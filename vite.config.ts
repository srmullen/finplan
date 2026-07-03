import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [react()],
		server: {
			port: env.VITE_PORT ? Number(env.VITE_PORT) : 5173,
			proxy: {
				"/api": "http://localhost:3000",
			},
		},
	};
});
