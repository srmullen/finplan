import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@src": path.resolve(__dirname, "src"),
		},
	},
	test: {
		environment: "node",
		coverage: {
			provider: "istanbul",
			reporter: ["text", "html"],
			include: ["src/**", "server/**"],
			exclude: [
				"**/*.d.ts",
				"**/*.css",
				"src/api/client.ts",
				"**/*.test.ts",
				"**/*.test.tsx",
			],
			thresholds: {
				lines: 100,
				functions: 100,
				branches: 100,
				statements: 100,
			},
		},
	},
});
