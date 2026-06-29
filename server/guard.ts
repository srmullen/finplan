export function checkApiKey(key: string): void {
	if (!key) {
		console.error("Error: FINPLAN_API_KEY is not set. Refusing to start.");
		process.exit(1);
	}
}
