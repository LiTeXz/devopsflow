#!/usr/bin/env bun
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { dependencyFinding, emit, parseOptions, readText, runTool, type Finding } from "./common";

export function detectPackageManager(root: string): "npm" | "pnpm" | "bun" | undefined {
	if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
	if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock"))) return "bun";
	if (existsSync(join(root, "package-lock.json")) || existsSync(join(root, "npm-shrinkwrap.json"))) return "npm";
	return existsSync(join(root, "package.json")) ? "npm" : undefined;
}

export function scanJavaScript(root: string): Finding[] {
	const packageText = readText(root, "package.json");
	if (!packageText) return [dependencyFinding({ ecosystem: "javascript", file: "package.json", dependency: "package.json", type: "missing", evidence: "no package manifest found", risk: "suggestion", action: "skip JavaScript scan", autoFixable: false })];
	const manifest = JSON.parse(packageText) as Record<string, Record<string, unknown>>;
	const dependencies = { ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) };
	const sourceFiles = readdirSync(root, { recursive: true }).filter((entry): entry is string => typeof entry === "string" && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry) && !entry.includes("node_modules"));
	const source = sourceFiles.map((file) => readText(root, file)).join("\n");
	const findings: Finding[] = [];
	for (const dependency of Object.keys(dependencies)) {
		const packageName = dependency.startsWith("@") ? dependency.split("/").slice(0, 2).join("/") : dependency.split("/")[0];
		if (!source.includes(packageName)) findings.push(dependencyFinding({ ecosystem: "javascript", file: "package.json", dependency, type: "unused-direct", evidence: "dependency name is absent from tracked source imports; confirm Knip before removal", action: "run Knip and remove only if its result is definite", autoFixable: true }));
	}
	return findings;
}

async function main(): Promise<number> {
	const options = parseOptions(Bun.argv.slice(2));
	const manager = detectPackageManager(options.root);
	if (!manager) return emit([], options.format);
	const findings = scanJavaScript(options.root);
	const knip = runTool(manager === "bun" ? "bunx" : manager, ["exec", "knip", "--no-progress"], options.root);
	const toolFailed = !knip.available || knip.exitCode !== 0;
	if (toolFailed) findings.push(dependencyFinding({ ecosystem: "javascript", file: "package.json", dependency: "knip", type: "tool-missing", evidence: "Knip did not complete successfully through the detected package manager", risk: "blocking", action: "install or invoke the repository-approved Knip version", autoFixable: false }));
	if (options.fix && !options.dryRun) console.error("--fix requires Knip confirmation; this checker reports candidates without editing manifests");
	const exitCode = emit(findings, options.format);
	return toolFailed ? 2 : exitCode;
}

if (import.meta.main) process.exit(await main());
