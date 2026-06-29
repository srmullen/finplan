import { type Directory, dag, func, object } from "@dagger.io/dagger";

@object()
// biome-ignore lint/correctness/noUnusedVariables: registered by @object() decorator
class Finplan {
	/**
	 * Run the full CI pipeline: typecheck, test, and build.
	 */
	@func()
	async ci(source: Directory): Promise<string> {
		// Cache key includes the lock file hash so it invalidates when deps change
		const lockHash = await source.file("bun.lock").digest();
		const nodeCache = dag.cacheVolume(`finplan-node-modules-${lockHash}`);

		return dag
			.container()
			.from("node:22-alpine")
			.withDirectory("/app", source, { exclude: ["node_modules", ".git"] })
			.withWorkdir("/app")
			.withMountedCache("/app/node_modules", nodeCache)
			.withExec(["npm", "install"])
			.withExec(["npm", "run", "typecheck"])
			.withExec(["npm", "run", "typecheck:server"])
			.withExec(["npm", "run", "test:coverage"])
			.withExec(["npm", "run", "build"])
			.stdout();
	}
}
