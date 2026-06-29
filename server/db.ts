import Database from "better-sqlite3";

const db = new Database(process.env.DB_PATH ?? "finplan.db");

export default db;
