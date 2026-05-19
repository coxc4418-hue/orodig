import { getTableConfig } from "drizzle-orm";
import { membersTable } from "../lib/db/dist/schema/index.js";

try {
  const config = getTableConfig(membersTable);
  console.log("Table config name:", config?.name);
} catch (err) {
  console.error("Error getting table config:", err);
}
