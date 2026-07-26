import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { detectPackageManager, scanJavaScript } from "./check-js-dependencies";
import { scanGradle } from "./check-gradle-dependencies";
import { scanMaven } from "./check-maven-dependencies";
import { scanGitHub } from "./check-github-dependencies";

function fixture(run: (root: string) => void): void {
	const root = mkdtempSync(join(tmpdir(), "depend-man-"));
	try { run(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

describe("JavaScript dependency checker", () => {
	it("detects package managers and direct candidates", () => fixture((root) => {
		writeFileSync(join(root, "package.json"), JSON.stringify({ dependencies: { used: "1", unused: "1" } }));
		writeFileSync(join(root, "package-lock.json"), "{}");
		writeFileSync(join(root, "index.ts"), "import 'used';");
		expect(detectPackageManager(root)).toBe("npm");
		expect(scanJavaScript(root).map((finding) => finding.dependency)).toEqual(["unused"]);
	}));
	it("does not treat peer and optional declarations as automatic fixes", () => fixture((root) => {
		writeFileSync(join(root, "package.json"), JSON.stringify({ peerDependencies: { peer: "1" }, optionalDependencies: { optional: "1" } }));
		writeFileSync(join(root, "index.ts"), "export {}; ");
		expect(scanJavaScript(root)).toEqual([]);
	}));
});

describe("Gradle and Maven dependency checkers", () => {
	it("recognizes Gradle declarations but keeps them review-only", () => fixture((root) => {
		writeFileSync(join(root, "gradlew.bat"), "");
		writeFileSync(join(root, "build.gradle"), "dependencies { implementation(\"example:lib:1\") }");
		expect(scanGradle(root)[0]?.autoFixable).toBe(false);
	}));
	it("reports Maven duplicate review evidence", () => fixture((root) => {
		writeFileSync(join(root, "pom.xml"), "<project><groupId>a</groupId><artifactId>x</artifactId><groupId>b</groupId><artifactId>x</artifactId></project>");
		expect(scanMaven(root)[0]?.type).toBe("duplicate-review");
	}));
});

describe("GitHub dependency policy checker", () => {
	it("reports missing Dependabot policy", () => fixture((root) => {
		expect(scanGitHub(root)[0]?.type).toBe("missing-policy");
	}));
	it("reports missing weekly policy fields", () => fixture((root) => {
		mkdirSync(join(root, ".github"), { recursive: true });
		writeFileSync(join(root, ".github", "dependabot.yml"), "version: 2\nupdates: []\n");
		const types = scanGitHub(root).map((finding) => finding.type);
		expect(types).toEqual(["policy", "policy", "policy"]);
	}));
});
