/* eslint-disable no-console */

const execPath = process.env.npm_execpath || "";

// npm_execpath typically contains something like:
// - /path/to/yarn.js
// - /path/to/npm-cli.js
// - /path/to/pnpm.cjs
const isYarn = execPath.toLowerCase().includes("yarn");

if (!isYarn) {
  console.error("This repository uses Yarn. Please run: yarn install");
  process.exit(1);
}
