import { eq } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";

const dummyTable = pgTable("dummy", {
  username: text("username"),
});

const cond = eq(dummyTable.username, "admin");
console.log("Drizzle eq condition structure:");
console.log("Condition details:", cond);
console.log("Condition properties:", Object.getOwnPropertyNames(cond));
console.log("Condition symbols:", Object.getOwnPropertySymbols(cond));
