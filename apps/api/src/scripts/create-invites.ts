/** Usage: npm run invite:create -w @fl3x/api -- 10 1 "launch batch" */
import { db, schema } from "../db";
import { generateCode } from "../lib/codes";

const [count = "1", maxUses = "1", note] = process.argv.slice(2);
const rows = Array.from({ length: Number(count) }, () => ({ code: generateCode(), maxUses: Number(maxUses), note }));
const created = await db.insert(schema.inviteCodes).values(rows).returning();
for (const c of created) console.log(c.code);
process.exit(0);
