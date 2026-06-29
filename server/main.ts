import db from "./db";
import { checkApiKey } from "./guard";
import { createApp } from "./index";
import { createSQLiteStores } from "./stores";

const apiKey = process.env.FINPLAN_API_KEY ?? "";
checkApiKey(apiKey);

const stores = createSQLiteStores(db);
const app = createApp(stores, apiKey);

export default {
	port: Number(process.env.PORT ?? 3000),
	fetch: app.fetch,
};
