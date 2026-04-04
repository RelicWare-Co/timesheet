import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("timesheet");
const serverUrl = alchemy.env.VITE_SERVER_URL;

if (!serverUrl) {
  throw new Error("VITE_SERVER_URL is required");
}

export const web = await Vite("web", {
  assets: "dist",
  bindings: {
    VITE_SERVER_URL: serverUrl,
  },
  cwd: "../../apps/web",
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
