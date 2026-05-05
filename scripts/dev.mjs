import net from "node:net";
import { spawn } from "node:child_process";

const services = [
  {
    name: "backend",
    port: 3000,
    cwd: new URL("../backend/", import.meta.url),
    command: "npm",
    args: ["run", "start:dev"],
    url: "http://localhost:3000/api/health",
  },
  {
    name: "frontend",
    port: 9000,
    cwd: new URL("../frontend/", import.meta.url),
    command: "npm",
    args: ["run", "dev"],
    url: "http://localhost:9000",
    restartOnExitCodes: [143],
    restartOnSignals: ["SIGTERM"],
    restartDelayMs: 1000,
  },
];

const children = new Map();
let shuttingDown = false;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveCommand(command) {
  return process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
}

function pipeWithPrefix(stream, prefix, target) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      target.write(`[${prefix}] ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buffer) {
      target.write(`[${prefix}] ${buffer}\n`);
    }
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", () => {
      resolve(`${stdout}${stderr}`.trim());
    });
    child.on("error", () => {
      resolve("");
    });
  });
}

async function getPortDetails(port) {
  if (process.platform === "linux") {
    const details = await runCommand("ss", ["-lptn", `( sport = :${port} )`]);
    if (details) {
      const pid = details.match(/pid=(\d+)/)?.[1];
      if (!pid) {
        return details;
      }
      const commandLine = await runCommand("sh", ["-lc", `tr '\\0' ' ' </proc/${pid}/cmdline`]);
      return commandLine ? `${details}\ncmdline: ${commandLine}` : details;
    }
  }
  return runCommand("lsof", ["-nP", `-i:${port}`]);
}

async function getPortPids(port) {
  if (process.platform === "linux") {
    const details = await runCommand("ss", ["-lptn", `( sport = :${port} )`]);
    return [...details.matchAll(/pid=(\d+)/g)].map((match) => Number(match[1]));
  }

  const details = await runCommand("lsof", ["-ti", `:${port}`]);
  return details
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

async function printStatus() {
  for (const service of services) {
    const inUse = await isPortInUse(service.port);
    process.stdout.write(`${service.name}: ${inUse ? "running" : "stopped"} on port ${service.port}\n`);
    if (inUse) {
      const details = await getPortDetails(service.port);
      if (details) {
        process.stdout.write(`${details}\n`);
      }
    }
  }
}

async function ensurePortsAreFree() {
  const occupied = [];
  for (const service of services) {
    if (await isPortInUse(service.port)) {
      occupied.push(service);
    }
  }

  if (occupied.length === 0) {
    return;
  }

  process.stderr.write("Cannot start full dev environment because required ports are already in use.\n");
  for (const service of occupied) {
    process.stderr.write(`\n${service.name} port ${service.port} is occupied.\n`);
    const details = await getPortDetails(service.port);
    if (details) {
      process.stderr.write(`${details}\n`);
    }
  }
  process.stderr.write("\nRun `npm run dev:status` in the repo root to inspect current processes.\n");
  process.exit(1);
}

async function freeOccupiedPorts() {
  const occupied = [];
  for (const service of services) {
    if (await isPortInUse(service.port)) {
      occupied.push(service);
    }
  }

  if (occupied.length === 0) {
    return;
  }

  process.stdout.write("Stopping existing dev processes on required ports...\n");
  const pidSet = new Set();
  for (const service of occupied) {
    const details = await getPortDetails(service.port);
    process.stdout.write(`\n${service.name} port ${service.port} is occupied.\n`);
    if (details) {
      process.stdout.write(`${details}\n`);
    }
    for (const pid of await getPortPids(service.port)) {
      pidSet.add(pid);
    }
  }

  for (const pid of pidSet) {
    try {
      process.kill(pid, "SIGTERM");
      process.stdout.write(`Sent SIGTERM to pid ${pid}.\n`);
    } catch {
      // Ignore processes that already exited between detection and signal.
    }
  }

  await delay(1200);

  const remaining = [];
  for (const service of occupied) {
    if (await isPortInUse(service.port)) {
      remaining.push(service);
    }
  }

  if (remaining.length === 0) {
    return;
  }

  process.stdout.write("Some processes are still running; sending SIGKILL...\n");
  const remainingPidSet = new Set();
  for (const service of remaining) {
    for (const pid of await getPortPids(service.port)) {
      remainingPidSet.add(pid);
    }
  }

  for (const pid of remainingPidSet) {
    try {
      process.kill(pid, "SIGKILL");
      process.stdout.write(`Sent SIGKILL to pid ${pid}.\n`);
    } catch {
      // Ignore processes that already exited between detection and signal.
    }
  }

  await delay(400);

  for (const service of remaining) {
    if (await isPortInUse(service.port)) {
      process.stderr.write(`Could not free port ${service.port}. Run \`npm run dev:status\` to inspect the remaining process.\n`);
      process.exit(1);
    }
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of children.values()) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }
  setTimeout(() => process.exit(exitCode), 150);
}

function shouldRestartService(service, code, signal) {
  if (signal && service.restartOnSignals?.includes(signal)) {
    return true;
  }

  if (typeof code === "number" && service.restartOnExitCodes?.includes(code)) {
    return true;
  }

  return false;
}

async function restartService(service) {
  const restartDelayMs = service.restartDelayMs ?? 500;
  process.stderr.write(`[${service.name}] restarting in ${restartDelayMs}ms after transient shutdown.\n`);
  await delay(restartDelayMs);

  if (shuttingDown) {
    return;
  }

  startService(service);
}

function startService(service) {
  const child = spawn(resolveCommand(service.command), service.args, {
    cwd: service.cwd,
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  });
  children.set(service.name, child);
  pipeWithPrefix(child.stdout, service.name, process.stdout);
  pipeWithPrefix(child.stderr, service.name, process.stderr);
  child.on("exit", (code, signal) => {
    children.delete(service.name);
    if (shuttingDown) {
      return;
    }

    if (shouldRestartService(service, code, signal)) {
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? 0}`;
      process.stderr.write(`[${service.name}] exited with ${reason}.\n`);
      void restartService(service);
      return;
    }

    const reason = signal ? `signal ${signal}` : `exit code ${code ?? 0}`;
    process.stderr.write(`[${service.name}] stopped with ${reason}.\n`);
    shutdown(code ?? 1);
  });
}

async function waitForService(service, timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(service.url);
      if (response.ok) {
        return;
      }
    } catch {
      // Service is not ready yet.
    }

    await delay(300);
  }

  process.stderr.write(`[${service.name}] did not become ready within ${timeoutMs}ms at ${service.url}.\n`);
  shutdown(1);
}

async function main() {
  if (process.argv.includes("--status")) {
    await printStatus();
    return;
  }

  if (process.argv.includes("--reset")) {
    await freeOccupiedPorts();
  }

  await ensurePortsAreFree();

  process.stdout.write("Starting backend and frontend dev servers...\n");
  const [backendService, ...otherServices] = services;

  if (backendService) {
    process.stdout.write(`- ${backendService.name}: ${backendService.url}\n`);
    startService(backendService);
    await waitForService(backendService);
  }

  for (const service of otherServices) {
    process.stdout.write(`- ${service.name}: ${service.url}\n`);
    startService(service);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

await main();
