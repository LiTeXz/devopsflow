import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = join(import.meta.dir!, "..");
const WORKFLOW = readFileSync(
	join(ROOT, ".github", "workflows", "version-check.yml"),
	"utf-8",
);

describe("version-check workflow", () => {
	it("uses package.json as the release tag version source", () => {
		expect(WORKFLOW).toContain('tags: ["v*"]');
		expect(WORKFLOW).toContain(
			"PKG_VERSION=$(bun -e \"console.log(require('./package.json').version)\")",
		);
		expect(WORKFLOW).toContain('EXPECTED_TAG="v$' + '{PKG_VERSION}"');
		expect(WORKFLOW).toContain('"$GITHUB_REF_NAME" != "$EXPECTED_TAG"');
		expect(WORKFLOW).toContain(
			"package.json version requires tag $" + "{EXPECTED_TAG}",
		);
		expect(WORKFLOW).toContain("if: github.ref_type == 'tag'");
	});
});
