import { beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type ValidateIdentifier = (value: string) => string[];
type ValidateLines = (
	text: string,
	kind: "permission" | "role",
) => Array<{ line: number; value: string; errors: string[] }>;

let validatePermissionIdentifier: ValidateIdentifier;
let validateRoleIdentifier: ValidateIdentifier;
let validateIdentifierLines: ValidateLines;

beforeAll(async () => {
	const module = await import("./validate-authorization-identifiers");
	validatePermissionIdentifier = module.validatePermissionIdentifier;
	validateRoleIdentifier = module.validateRoleIdentifier;
	validateIdentifierLines = module.validateIdentifierLines;
});

describe("permission identifiers", () => {
	it.each([
		"compute.instances.list",
		"iam.serviceAccounts.actAs",
		"cloudkms.cryptoKeyVersions.useToEncrypt",
	])("accepts %s", (identifier) => {
		expect(validatePermissionIdentifier(identifier)).toEqual([]);
	});

	it.each([
		"rbac:user:read",
		"compute.instances.*",
		"compute.instances",
		"compute.instances.list.extra",
		"compute.service_accounts.get",
		"compute.service-accounts.get",
		"Compute.instances.get",
		"compute.Instances.get",
		"compute.instances.Get",
		" compute.instances.get",
	])("rejects %s", (identifier) => {
		expect(validatePermissionIdentifier(identifier).length).toBeGreaterThan(0);
	});
});

describe("role identifiers", () => {
	it.each([
		"roles/compute.viewer",
		"roles/iam.serviceAccountAdmin",
	])("accepts %s", (identifier) => {
		expect(validateRoleIdentifier(identifier)).toEqual([]);
	});

	it.each([
		"compute:viewer",
		"compute.viewer",
		"roles/compute.*",
		"roles/Compute.viewer",
		"roles/compute.Viewer",
		"roles/compute.service_account_admin",
	])("rejects %s", (identifier) => {
		expect(validateRoleIdentifier(identifier).length).toBeGreaterThan(0);
	});
});

describe("line catalogs", () => {
	it("ignores blank lines and comments while retaining source lines", () => {
		const findings = validateIdentifierLines(
			"# catalog\n\ncompute.instances.get\nrbac:user:read\n",
			"permission",
		);

		expect(findings).toHaveLength(1);
		expect(findings[0]?.line).toBe(4);
		expect(findings[0]?.value).toBe("rbac:user:read");
		expect(findings[0]?.errors.length).toBeGreaterThan(0);
	});

	it("returns blocking CLI exit codes for invalid catalogs", () => {
		const directory = mkdtempSync(join(tmpdir(), "iam-identifiers-"));
		const validPath = join(directory, "valid.txt");
		const invalidPath = join(directory, "invalid.txt");
		const scriptPath = join(
			import.meta.dir,
			"validate-authorization-identifiers.ts",
		);

		try {
			writeFileSync(validPath, "compute.instances.get\n", "utf-8");
			writeFileSync(invalidPath, "compute:instances:get\n", "utf-8");

			const valid = Bun.spawnSync([
				process.execPath,
				scriptPath,
				"--kind",
				"permission",
				"--input",
				validPath,
			]);
			const invalid = Bun.spawnSync([
				process.execPath,
				scriptPath,
				"--kind",
				"permission",
				"--input",
				invalidPath,
			]);

			expect(valid.exitCode).toBe(0);
			expect(invalid.exitCode).toBe(1);
			expect(invalid.stderr.toString()).toContain(
				"legacy colon-delimited identifiers are forbidden",
			);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
