import { resolve } from "node:path";

export const GIT_GLOBAL_OPTIONS_WITH_VALUE = new Set([
	"-C",
	"-c",
	"--git-dir",
	"--work-tree",
	"--namespace",
]);
export const GIT_GLOBAL_OPTIONS_WITH_OPTIONAL_VALUE = new Set(["--config-env"]);

export const SHELL_WRITE_COMMANDS = new Set([
	"apply_patch",
	"chmod",
	"chown",
	"cp",
	"dd",
	"install",
	"ln",
	"mkdir",
	"mv",
	"patch",
	"rm",
	"tee",
	"touch",
	"truncate",
]);

export const PACKAGE_MANAGERS = new Set([
	"npm",
	"pnpm",
	"yarn",
	"bun",
	"pip",
	"pip3",
	"uv",
	"cargo",
	"go",
]);

export const GIT_WRITE_SUBCOMMANDS = new Set([
	"add",
	"am",
	"apply",
	"cherry-pick",
	"clean",
	"commit",
	"merge",
	"mv",
	"pull",
	"rebase",
	"reset",
	"restore",
	"revert",
	"rm",
	"stash",
]);

export const SAFE_BRANCH_ESCAPE = new Set(["git switch", "git checkout"]);

export const SHELL_SEPARATORS = new Set([";", "&&", "||", "|"]);

export function commandSegments(command: string): string[][] {
	let tokens: string[];
	try {
		tokens = shellTokenize(command);
	} catch {
		tokens = command.split(/\s+/);
	}
	const segments: string[][] = [];
	let current: string[] = [];
	for (const token of tokens) {
		if (SHELL_SEPARATORS.has(token)) {
			if (current.length) {
				segments.push(current);
				current = [];
			}
			continue;
		}
		current.push(token);
	}
	if (current.length) {
		segments.push(current);
	}
	return segments;
}

function shellTokenize(command: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	while (i < command.length) {
		while (i < command.length && /\s/.test(command[i])) i++;
		if (i >= command.length) break;

		if (command[i] === "'") {
			i++;
			let token = "";
			while (i < command.length && command[i] !== "'") {
				token += command[i];
				i++;
			}
			if (i < command.length) i++;
			tokens.push(token);
			continue;
		}

		if (command[i] === '"') {
			i++;
			let token = "";
			while (i < command.length && command[i] !== '"') {
				if (command[i] === "\\" && i + 1 < command.length) {
					const next = command[i + 1];
					if (next === '"' || next === "\\") {
						token += next;
						i += 2;
					} else {
						token += command[i];
						i++;
					}
				} else {
					token += command[i];
					i++;
				}
			}
			if (i < command.length) i++;
			tokens.push(token);
			continue;
		}

		let token = "";
		while (
			i < command.length &&
			!/\s/.test(command[i]) &&
			command[i] !== "'" &&
			command[i] !== '"'
		) {
			token += command[i];
			i++;
		}
		tokens.push(token);
	}
	return tokens;
}

export function normalizeCommandPrefix(tokens: string[]): string[] {
	const normalized = stripLauncherPrefix(tokens);
	if (normalized.length && normalized[0] === "rtk") {
		normalized.shift();
		const next = normalized[0] as string | undefined;
		if (normalized.length && next === "proxy") {
			normalized.shift();
		}
	}
	return normalized;
}

export function stripLauncherPrefix(tokens: string[]): string[] {
	const normalized = [...tokens];
	let changed = true;
	while (changed) {
		changed = false;
		while (normalized.length && isEnvAssignment(normalized[0])) {
			normalized.shift();
			changed = true;
		}
		while (
			normalized.length &&
			["command", "builtin", "exec", "env"].includes(normalized[0] as string)
		) {
			normalized.shift();
			changed = true;
		}
	}
	return normalized;
}

export function isEnvAssignment(token: string): boolean {
	if (!token.includes("=")) return false;
	const [name] = token.split("=", 1);
	return name.length > 0 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export function hasShellRedirection(tokens: string[]): boolean {
	const redirectOps = new Set([">", ">>", "1>", "2>", "&>", "<>"]);
	return tokens.some(
		(token) =>
			redirectOps.has(token) || token.startsWith(">") || token.startsWith(">>"),
	);
}

export function gitSubcommand(args: string[]): string | undefined {
	let index = 0;
	while (index < args.length) {
		const token = args[index];
		if (token === "--") {
			return index + 1 < args.length ? args[index + 1] : undefined;
		}
		if (GIT_GLOBAL_OPTIONS_WITH_VALUE.has(token)) {
			index += 2;
			continue;
		}
		if (
			GIT_GLOBAL_OPTIONS_WITH_VALUE.values().some((opt) =>
				token.startsWith(`${opt}=`),
			)
		) {
			index += 1;
			continue;
		}
		if (GIT_GLOBAL_OPTIONS_WITH_OPTIONAL_VALUE.has(token)) {
			index += 2;
			continue;
		}
		if (token.startsWith("--") && token.includes("=")) {
			index += 1;
			continue;
		}
		if (token.startsWith("-")) {
			index += 1;
			continue;
		}
		return token;
	}
	return undefined;
}

export function gitEffectiveCwd(tokens: string[], cwd: string): string {
	let effectiveCwd = cwd;
	let index = tokens[0] === "git" ? 1 : 0;
	while (index < tokens.length) {
		const token = tokens[index];
		if (token === "--") return effectiveCwd;
		if (token === "-C") {
			const next = tokens[index + 1];
			if (next) effectiveCwd = resolve(effectiveCwd, next);
			index += 2;
			continue;
		}
		if (token.startsWith("-C=")) {
			effectiveCwd = resolve(effectiveCwd, token.slice(3));
			index += 1;
			continue;
		}
		if (token.startsWith("-C") && token.length > 2) {
			effectiveCwd = resolve(effectiveCwd, token.slice(2));
			index += 1;
			continue;
		}
		if (GIT_GLOBAL_OPTIONS_WITH_VALUE.has(token)) {
			index += 2;
			continue;
		}
		if (
			GIT_GLOBAL_OPTIONS_WITH_VALUE.values().some((opt) =>
				token.startsWith(`${opt}=`),
			)
		) {
			index += 1;
			continue;
		}
		if (GIT_GLOBAL_OPTIONS_WITH_OPTIONAL_VALUE.has(token)) {
			index += 2;
			continue;
		}
		if (token.startsWith("--") && token.includes("=")) {
			index += 1;
			continue;
		}
		if (token.startsWith("-")) {
			index += 1;
			continue;
		}
		return effectiveCwd;
	}
	return effectiveCwd;
}

export function firstNonOption(tokens: string[]): string | undefined {
	let index = 0;
	while (index < tokens.length) {
		const token = tokens[index];
		if (token === "--") {
			return index + 1 < tokens.length ? tokens[index + 1] : undefined;
		}
		if (token.startsWith("-")) {
			index += 1;
			continue;
		}
		return token;
	}
	return undefined;
}

export function isPackageCommandWrites(tokens: string[]): boolean {
	const manager = tokens[0];
	const subcommand = firstNonOption(tokens.slice(1));
	if (!subcommand) return false;

	if (["npm", "pnpm", "yarn", "bun"].includes(manager)) {
		return [
			"add",
			"build",
			"generate",
			"codegen",
			"install",
			"i",
			"remove",
			"rm",
			"run",
			"update",
			"upgrade",
		].includes(subcommand);
	}
	if (["pip", "pip3", "uv"].includes(manager)) {
		return ["install", "add", "remove", "sync"].includes(subcommand);
	}
	if (manager === "cargo") {
		return ["add", "remove", "update", "install"].includes(subcommand);
	}
	if (manager === "go") {
		return ["get", "mod", "work"].includes(subcommand);
	}
	return false;
}

export function isPackageCommandWritesRestricted(tokens: string[]): boolean {
	const manager = tokens[0];
	const subcommand = firstNonOption(tokens.slice(1));
	if (!subcommand) return false;

	if (["npm", "pnpm", "yarn", "bun"].includes(manager)) {
		return [
			"add",
			"install",
			"i",
			"remove",
			"rm",
			"update",
			"upgrade",
		].includes(subcommand);
	}
	if (["pip", "pip3", "uv"].includes(manager)) {
		return ["install", "add", "remove", "sync"].includes(subcommand);
	}
	if (manager === "cargo") {
		return ["add", "remove", "update", "install"].includes(subcommand);
	}
	if (manager === "go") {
		return ["get", "mod", "work"].includes(subcommand);
	}
	return false;
}

export function isSedWriteCommand(tokens: string[]): boolean {
	const args = tokens.slice(1);
	return args.some(isSedInPlaceOption);
}

export function isSedInPlaceOption(token: string): boolean {
	return (
		token === "-i" ||
		token.startsWith("-i") ||
		token === "--in-place" ||
		token.startsWith("--in-place=")
	);
}

export function isPythonSafeTestCommand(args: string[]): boolean {
	const filtered = stripPythonRuntimeOptions(args);
	if (!filtered.length) return false;
	if (filtered[0] === "-m" && filtered.length >= 2) {
		return ["pytest", "unittest", "py_compile", "json.tool"].includes(
			filtered[1],
		);
	}
	const scriptPath = filtered[0];
	const script = scriptPath.split("/").pop()?.toLowerCase() ?? "";

	if (script.startsWith("test-") || script.startsWith("test_")) return true;
	return false;
}

export function pythonWriteReason(args: string[]): string | undefined {
	const filtered = stripPythonRuntimeOptions(args);
	if (!filtered.length) return undefined;

	if (filtered[0] === "-c" || filtered[0].startsWith("-c")) {
		const code =
			filtered[0].startsWith("-c") && filtered[0].length > 2
				? `${filtered[0].slice(2)} ${filtered.slice(1).join(" ")}`
				: filtered.slice(1).join(" ");
		if (pythonInlineCodeWrites(code)) {
			return "`python -c` 内联代码包含明显文件写入调用";
		}
		return undefined;
	}

	const script = filtered[0].split("/").pop()?.toLowerCase() ?? "";
	if (
		["write", "update", "generate", "codegen", "modify", "migrate"].some((m) =>
			script.includes(m),
		)
	) {
		return `\`python ${args.join(" ")}\` 可能执行写入型脚本`;
	}
	return undefined;
}

export function pythonInlineCodeWrites(code: string): boolean {
	if (/open\([^)]*,\s*['"][^'"]*[wax+][^'"]*['"]/.test(code)) return true;
	return [
		".write(",
		".write_text(",
		".write_bytes(",
		"os.remove(",
		"shutil.",
	].some((m) => code.includes(m));
}

export function stripPythonRuntimeOptions(args: string[]): string[] {
	const filtered = [...args];
	let index = 0;
	while (index < filtered.length) {
		const token = filtered[index];
		if (token === "-m") return filtered.slice(index);
		if (token === "-X" || token === "-W") {
			index += 2;
			continue;
		}
		if (
			(token.startsWith("-X") || token.startsWith("-W")) &&
			token.length > 2
		) {
			index += 1;
			continue;
		}
		if (token === "-c" || token.startsWith("-c")) return filtered.slice(index);
		if (token.startsWith("-")) {
			index += 1;
			continue;
		}
		return filtered.slice(index);
	}
	return [];
}

export function isTestCommand(tokens: string[]): boolean {
	const command = tokens[0];
	const args = tokens.slice(1);

	if (["pytest", "tox", "nox"].includes(command)) return true;

	if (["npm", "pnpm", "yarn", "bun"].includes(command)) {
		const subcommand = firstNonOption(args);
		if (subcommand === "test") return true;
		if (subcommand === "run") {
			const scriptName = scriptNameAfterRun(args);
			return scriptName !== undefined && isTestLikeScriptName(scriptName);
		}
		return false;
	}

	if (["cargo", "go"].includes(command)) return firstNonOption(args) === "test";

	if (["mvn", "gradle", "./gradlew"].includes(command)) {
		return args.some(
			(arg) =>
				arg.toLowerCase().includes("test") ||
				arg.toLowerCase().includes("check"),
		);
	}

	if (["python", "python3"].includes(command))
		return isPythonSafeTestCommand(args);

	return false;
}

function scriptNameAfterRun(args: string[]): string | undefined {
	const runIndex = args.indexOf("run");
	if (runIndex === -1) return undefined;
	for (const token of args.slice(runIndex + 1)) {
		if (token === "--") continue;
		if (token.startsWith("-")) continue;
		return token;
	}
	return undefined;
}

function isTestLikeScriptName(scriptName: string): boolean {
	const normalized = scriptName.toLowerCase();
	return ["test", "check", "lint", "typecheck"].some((m) =>
		normalized.includes(m),
	);
}

export const SHELL_BINARIES = new Set([
	"bash",
	"sh",
	"zsh",
	"dash",
	"ksh",
	"fish",
	"csh",
	"tcsh",
]);

export function binaryName(token: string): string {
	const parts = token.split("/");
	return parts[parts.length - 1];
}

export function extractWrappedScript(tokens: string[]): string | undefined {
	if (!tokens.length) return undefined;
	const binary = binaryName(tokens[0]);
	if (SHELL_BINARIES.has(binary)) {
		const cIndex = tokens.indexOf("-c");
		if (cIndex !== -1 && cIndex + 1 < tokens.length) {
			return tokens[cIndex + 1];
		}
	}
	if (binary === "eval" && tokens.length > 1) {
		return tokens.slice(1).join(" ");
	}
	return undefined;
}

export function containsGitOrGh(command: string): boolean {
	for (const segment of commandSegments(command)) {
		const normalized = normalizeCommandPrefix(segment);
		if (!normalized.length) continue;
		const binary = binaryName(normalized[0]);
		if (binary === "git" || binary === "gh") return true;
		const wrapped = extractWrappedScript(normalized);
		if (wrapped && containsGitOrGh(wrapped)) return true;
	}
	return false;
}

export const GIT_BLOCKED_SUBCOMMANDS = new Set(["push", "commit"]);

export const GH_BLOCKED_SUBCOMMANDS = new Set(["issue", "pr"]);

const GH_GLOBAL_OPTIONS_WITH_VALUE = new Set(["--repo", "-R", "--hostname"]);

export function ghSubcommand(args: string[]): string | undefined {
	let index = 0;
	while (index < args.length) {
		const token = args[index];
		if (token === "--") {
			return index + 1 < args.length ? args[index + 1] : undefined;
		}
		if (GH_GLOBAL_OPTIONS_WITH_VALUE.has(token)) {
			index += 2;
			continue;
		}
		if (token.startsWith("--repo=") || token.startsWith("-R=")) {
			index += 1;
			continue;
		}
		if (token.startsWith("-")) {
			index += 1;
			continue;
		}
		return token;
	}
	return undefined;
}

export function containsBlockedGitGh(command: string): boolean {
	for (const segment of commandSegments(command)) {
		const normalized = normalizeCommandPrefix(segment);
		if (!normalized.length) continue;
		const binary = binaryName(normalized[0]);
		if (binary === "git") {
			const subcommand = gitSubcommand(normalized.slice(1));
			if (subcommand && GIT_BLOCKED_SUBCOMMANDS.has(subcommand)) return true;
			continue;
		}
		if (binary === "gh") {
			const subcommand = ghSubcommand(normalized.slice(1));
			if (subcommand && GH_BLOCKED_SUBCOMMANDS.has(subcommand)) return true;
			continue;
		}
		const wrapped = extractWrappedScript(normalized);
		if (wrapped && containsBlockedGitGh(wrapped)) return true;
	}
	return false;
}
