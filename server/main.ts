import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import db from "./db";
import { checkApiKey } from "./guard";
import { createApp } from "./index";
import { createSQLiteStores } from "./stores";

const apiKey = process.env.FINPLAN_API_KEY ?? "";
checkApiKey(apiKey);

const stores = createSQLiteStores(db);
const app = createApp(stores, apiKey);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) });
}
