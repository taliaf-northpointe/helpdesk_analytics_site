import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

import { runSync } from "../src/lib/integrations/servicedesk-plus/sync";

async function main() {
  console.log("Starting full sync from SDP...");
  console.log("SDP_BASE_URL:", process.env.SDP_BASE_URL);
  console.log("SDP_ZOHO_CLIENT_ID:", process.env.SDP_ZOHO_CLIENT_ID?.slice(0, 10) + "...");
  try {
    const result = await runSync("FULL");
    console.log("Sync complete:", result);
  } catch (e) {
    console.error("Sync failed:", e);
    process.exit(1);
  }
  process.exit(0);
}
main();