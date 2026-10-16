import { runCli } from "./telegram-enrich/cli.ts";

runCli(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
