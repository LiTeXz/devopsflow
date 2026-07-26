#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dependencyFinding, emit, parseOptions, readText, type Finding } from "./common";

export function scanGitHub(root: string): Finding[] {
	const file = ".github/dependabot.yml";
	const text = readText(root, file);
	if (!text) return [dependencyFinding({ ecosystem: "github", file, dependency: "dependabot", type: "missing-policy", evidence: "no Dependabot configuration found", action: "add weekly npm/gradle/maven/github-actions updates after checking directories", autoFixable: false })];
	const findings: Finding[] = [];
	if (!/open-pull-requests-limit:\s*5\b/.test(text)) findings.push(dependencyFinding({ ecosystem: "github", file, dependency: "open-pull-requests-limit", type: "policy", evidence: "expected limit 5 is missing", action: "set the repository-approved PR limit", autoFixable: false }));
	if (!/schedule:\s*\n\s*interval:\s*weekly/.test(text)) findings.push(dependencyFinding({ ecosystem: "github", file, dependency: "schedule", type: "policy", evidence: "weekly schedule is missing", action: "configure weekly updates", autoFixable: false }));
	if (!/groups:/.test(text)) findings.push(dependencyFinding({ ecosystem: "github", file, dependency: "groups", type: "policy", evidence: "production/development grouping is missing", action: "add groups after reviewing update compatibility", autoFixable: false }));
	return findings;
}

async function main(): Promise<number> {
	const options = parseOptions(Bun.argv.slice(2));
	const findings = scanGitHub(options.root);
	if (options.fix && !options.dryRun && !existsSync(join(options.root, ".github/dependabot.yml"))) console.error("GitHub --fix does not invent directories; copy the reference policy and review it first");
	return emit(findings, options.format);
}
if (import.meta.main) process.exit(await main());
