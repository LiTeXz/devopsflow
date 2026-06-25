export const PROTECTED_BRANCHES = new Set(["main", "dev", "develop", "devlop"]);

export function currentBranch(cwd: string): string | undefined {
	try {
		const result = Bun.spawnSync({
			cmd: ["git", "symbolic-ref", "--quiet", "--short", "HEAD"],
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		const branch = result.stdout?.toString().trim();
		return branch || undefined;
	} catch {
		return undefined;
	}
}
