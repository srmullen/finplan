import {
	type Directory,
	dag,
	func,
	object,
	type Platform,
	type Secret,
} from "@dagger.io/dagger";

const IMAGE = "ghcr.io/srmullen/finplan";
const PLATFORMS = ["linux/amd64", "linux/arm64"] as Platform[];

@object()
// biome-ignore lint/correctness/noUnusedVariables: registered by @object() decorator
class Finplan {
	/**
	 * Run the full CI pipeline: typecheck, test, and build.
	 */
	@func()
	async ci(source: Directory): Promise<string> {
		// Cache key includes the lock file hash so it invalidates when deps change
		const lockHash = await source.file("package-lock.json").digest();
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

	/**
	 * Build a multi-platform release image from the Dockerfile and push it to
	 * GHCR, tagged with the given release tag and `latest`.
	 */
	@func()
	async publish(
		source: Directory,
		tag: string,
		registryToken: Secret,
	): Promise<string> {
		const buildContext = source
			.withoutDirectory("node_modules")
			.withoutDirectory(".git");

		const variants = PLATFORMS.map((platform) =>
			buildContext.dockerBuild({ platform }),
		);

		const publishTag = (t: string) =>
			dag
				.container()
				.withRegistryAuth("ghcr.io", "srmullen", registryToken)
				.publish(`${IMAGE}:${t}`, { platformVariants: variants });

		await publishTag("latest");
		return publishTag(tag);
	}
}
