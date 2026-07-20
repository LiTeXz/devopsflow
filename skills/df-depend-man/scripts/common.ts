import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export type Finding = {
	ecosystem: string;
	file: string;
	dependency: string;
	type: string;
	evidence: string;
	risk: "blocking" | "suggestion";
	action: string;
	autoFixable: boolean;
};

export type Options = { root: string; fix: boolean; dryRun: boolean; format: "text" | "json" };

export function parseOptions(argv: string[]): Options {
	let root = process.cwd();
	let format: "text" | "json" = "text";
	let fix = false;
	let dryRun = false;
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === "--path") root = argv[index + 1] ?? root;
		if (argument === "--format" && argv[index + 1] === "json") format = "json";
		if (argument === "--fix") fix = true;
		if (argument === "--dry-run") dryRun = true;
	}
	return { root, fix, dryRun, format };
}

export function emit(findings: Finding[], format: Options["format"]): number {
	if (format === "json") console.log(JSON.stringify(findings, null, 2));
	else if (!findings.length) console.log("dependency check passed");
	else for (const finding of findings) console.log(`${finding.risk.toUpperCase()} ${finding.ecosystem} ${finding.file}: ${finding.dependency} - ${finding.evidence}. ${finding.action}`);
	return findings.some((finding) => finding.risk === "blocking") ? 1 : 0;
}

export function readText(root: string, file: string): string {
	const path = join(root, file);
	return existsSync(path) ? readFileSync(path, "utf8") : "";
}

export function displayPath(root: string, file: string): string {
	return relative(root, join(root, file)).replaceAll("\\", "/");
}

export function dependencyFinding(input: Omit<Finding, "risk"> & { risk?: Finding["risk"] }): Finding {
	return { ...input, risk: input.risk ?? "blocking" };
}

export function runTool(command: string, args: string[], cwd: string): { available: boolean; exitCode: number } {
	try {
		const result = Bun.spawnSync([command, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
		return { available: true, exitCode: result.exitCode };
	} catch {
		return { available: false, exitCode: 2 };
	}
}
