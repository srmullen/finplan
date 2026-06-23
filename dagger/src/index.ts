import { dag, Directory, object, func } from "@dagger.io/dagger";

@object()
class Finplan {
  /**
   * Run the full CI pipeline: typecheck, test, and build.
   */
  @func()
  async ci(source: Directory): Promise<string> {
    const nodeCache = dag.cacheVolume("finplan-node-modules");

    return dag
      .container()
      .from("oven/bun:latest")
      .withDirectory("/app", source, { exclude: ["node_modules", ".git"] })
      .withWorkdir("/app")
      .withMountedCache("/app/node_modules", nodeCache)
      .withExec(["bun", "install", "--frozen-lockfile"])
      .withExec(["bun", "run", "typecheck"])
      .withExec(["bun", "run", "typecheck:server"])
      .withExec(["bun", "run", "test:run"])
      .withExec(["bun", "run", "build"])
      .stdout();
  }
}
