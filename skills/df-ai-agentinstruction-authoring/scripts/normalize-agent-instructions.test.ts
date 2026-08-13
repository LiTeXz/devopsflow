import { afterEach, describe, expect, it } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  findNormalizationIssues,
  loadVocabulary,
  normalizeGovernedFiles,
  normalizeInstructionText,
  runNormalizeCli,
} from "./normalize-agent-instructions";

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length) {
    const root = temporaryRoots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

function temporaryProject(): string {
  const root = mkdtempSync(join(tmpdir(), "normalize-agent-instructions-"));
  temporaryRoots.push(root);
  return root;
}

function writeFixture(
  root: string,
  relativePath: string,
  content: string,
): string {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf-8");
  return path;
}

describe("agent instruction normalization", () => {
  it("applies longest dictionary matches before shorter entries", () => {
    expect(
      normalizeInstructionText("如果插件安装验证失败, 检查项目根文件夹."),
    ).toBe(
      "if installed plugin verification error, check project root directory.",
    );
  });

  it("does not replace ASCII dictionary sources inside longer words", () => {
    expect(normalizeInstructionText("one task and milestone planning")).toBe(
      "1 个 task and milestone planning",
    );
  });

  it("preserves exact AGENTS wrapper markers", () => {
    const structure = `<!-- BEGINE_GLOBAL:~/.codex/ -->
# ~/.codex/AGENTS.md: Global Instructions
<!-- END_GLOBAL:~/.codex/ -->
<!-- BEGIN:skills/example/AGENTS.md -->
# skills/example/AGENTS.md
<!-- END:skills/example/AGENTS.md -->`;
    expect(normalizeInstructionText(structure)).toBe(structure);
  });

  it("normalizes extended engineering vocabulary with longest matches", () => {
    expect(
      normalizeInstructionText(
        "运行脚本并执行全套测试、所有测试与核心门禁。格式化后写入仓库，输出结果与退出代码。",
      ),
    ).toBe(
      "run script 并 execution all tests, all tests and core gate. format 后 write repository, output result and exit code.",
    );
    expect(
      normalizeInstructionText(
        "实体、服务、事件、技能、代理、输入、资源、补丁、校验与协议。",
      ),
    ).toBe(
      "eneity, service, event, skill, agent, input, source, patch, verify and protocol.",
    );
  });

  it("uses the first translation as canonical and recognizes every translation", () => {
    const root = temporaryProject();
    const dictionaryPath = writeFixture(
      root,
      "vocabulary.yaml",
      `literalRules:
  - from: "仓库"
    to: ["repository", "repositories"]
contextualRules: []
punctuationRules: []
allowedNonAsciiSymbols: []
`,
    );
    const vocabulary = loadVocabulary(dictionaryPath);

    expect(normalizeInstructionText("仓库", vocabulary)).toBe("repository");
    expect(normalizeInstructionText("多个repositories文件", vocabulary)).toBe(
      "多个 repositories 文件",
    );
  });

  it("normalizes verification success wording", () => {
    expect(normalizeInstructionText("测试通过。校验通过。")).toBe(
      "test passed. verify passed.",
    );
  });

  it("normalizes context and development vocabulary with abbreviations", () => {
    expect(
      normalizeInstructionText("检查点与检查规则。上下文驱动开发系统目标。"),
    ).toBe(
      "checkpoint and check rule. context driven development system target.",
    );

    const root = temporaryProject();
    const dictionaryPath = writeFixture(
      root,
      "vocabulary.yaml",
      `literalRules:
  - from: "规则"
    to: ["specification", "spec"]
  - from: "开发"
    to: ["development", "dev"]
contextualRules: []
punctuationRules: []
allowedNonAsciiSymbols: []
`,
    );
    const vocabulary = loadVocabulary(dictionaryPath);

    expect(normalizeInstructionText("规则开发", vocabulary)).toBe(
      "specification development",
    );
    expect(normalizeInstructionText("简化spec与dev流程", vocabulary)).toBe(
      "简化 spec 与 dev 流程",
    );
  });

  it("normalizes execution and editing vocabulary with longest matches", () => {
    expect(
      normalizeInstructionText("用户在编辑器中执行类型检查，编辑前确认。"),
    ).toBe("user 在 editor 中 execution type check, pre edit 确认.");
    expect(normalizeInstructionText("编辑或编辑器。")).toBe("edit or editor.");
  });

  it("normalizes task wording including the current task context", () => {
    expect(normalizeInstructionText("用户执行本任务。")).toBe(
      "user execution this task.",
    );
  });

  it("normalizes package and language vocabulary with longest matches", () => {
    expect(
      normalizeInstructionText(
        "包管理器管理包。操作系统框架使用中文和英语语言视图表格协议。",
      ),
    ).toBe(
      "package manager 管理 package. operation system framework 使用 chinese and english language view table protocol.",
    );
  });

  it("normalizes workflow, image, import, and adaptation vocabulary", () => {
    expect(
      normalizeInstructionText(
        "工作流平台使用图片静态导入默认值。你是适配器,你适配。",
      ),
    ).toBe(
      "workflow platform 使用 image static import default value. you are adaptor, you adapt.",
    );
    expect(normalizeInstructionText("photo img use using")).toBe(
      "photo img use using",
    );
  });

  it("normalizes instruction structure and availability vocabulary", () => {
    expect(
      normalizeInstructionText(
        "标题描述清单实现集成提示词循环调用。路由器返回不可用,路由可用。启用映射定义值对象,禁用软件硬件。",
      ),
    ).toBe(
      "title description manifest implementation integration prompt loop call. router return unavailable, route available. enable mapping definition value object, disable software hardware.",
    );
    expect(
      normalizeInstructionText(
        "list impl integrate returns enabled ON disabled OFF def val obj",
      ),
    ).toBe("list impl integrate returns enabled ON disabled OFF def val obj");
  });

  it("normalizes category and other wording with phrase precedence", () => {
    expect(
      normalizeInstructionText("分类或其他。categories or 其他,其他。"),
    ).toBe("category or later. categories or later, other.");
  });

  it("normalizes exit code wording with phrase precedence", () => {
    expect(normalizeInstructionText("exit 码和错误码。")).toBe(
      "exit code and 错误 code.",
    );
  });

  it("normalizes names, readiness, domain, history, examples, and locality", () => {
    expect(
      normalizeInstructionText("名字和名称已准备。准备领域历史示例与本地。"),
    ).toBe("name and name ready. ready domain history example and local.");
    expect(normalizeInstructionText("examples")).toBe("examples");
  });

  it("normalizes debugging, change, module, refactoring, work, generation, and feature vocabulary", () => {
    expect(
      normalizeInstructionText(
        "调试、修复、创建、更新、更改、改变模块，重构后再变更工作并生成功能结果。",
      ),
    ).toBe(
      "debugging, fix, create, update, change, change module, refactor 后再 change work 并 generate feature result.",
    );
    expect(normalizeInstructionText("debug")).toBe("debug");
    expect(normalizeInstructionText("Fixes")).toBe("Fixes");
    expect(normalizeInstructionText("features")).toBe("features");
  });

  it("replaces current-object 本 without changing 本地 or 本身", () => {
    expect(
      normalizeInstructionText("本 file 使用本地配置, 脚本本身保持不变."),
    ).toBe("this file 使用 local 配置, script 本身保持不变.");
  });

  it("preserves fenced code, inline code, links, and URLs", () => {
    const source = `项目说明中的文件与目录.

\`项目/文件\` and [项目文件](项目/文件.md) and [checklists.md](references/checklists.md) and https://example.com/项目/文件

\`\`\`text
如果插件安装失败, 不要改这个代码块.
\`\`\`
`;

    expect(
      normalizeInstructionText(source),
    ).toBe(`project 说明中的 file and directory.

\`项目/文件\` and [project file](项目/文件.md) and [checklists.md](references/checklists.md) and https://example.com/项目/文件

\`\`\`text
如果插件安装失败, 不要改这个代码块.
\`\`\`
`);
  });

  it("replaces forbidden Chinese digits in every file region", () => {
    const source = `一二三四五六七八九

\`第一项\` and [第九项](docs/第九项.md) and https://example.com/第二项

\`\`\`text
第三项
\`\`\`
`;

    expect(normalizeInstructionText(source)).toBe(`123456789

\`第1项\` and [第9项](docs/第9项.md) and https://example.com/第2项

\`\`\`text
第3项
\`\`\`
`);
    expect(
      findNormalizationIssues(source).map((issue) => issue.message),
    ).toEqual([
      "forbidden character U+4E00",
      "forbidden character U+4E8C",
      "forbidden character U+4E09",
      "forbidden character U+56DB",
      "forbidden character U+4E94",
      "forbidden character U+516D",
      "forbidden character U+4E03",
      "forbidden character U+516B",
      "forbidden character U+4E5D",
    ]);
  });

  it("normalizes compound phrases before restricted single characters", () => {
    expect(
      normalizeInstructionText(
        "参与者保持一致性与唯一性，统一编写包含功能测试的工作流程，并在下一次使用同一工作目录。",
      ),
    ).toBe(
      "participant 保持 consistency and uniqueness, unified write include functional tests 的 workflow, 并在后续使用相同 working directory.",
    );
  });

  it("adds readable spacing at general Chinese and English boundaries", () => {
    expect(normalizeInstructionText("读取API,CLI与JSON.object随后返回。")).toBe(
      "读取 API, CLI and JSON. object 随后 return.",
    );
  });

  it("normalizes Chinese punctuation while retaining ￥", () => {
    expect(
      normalizeInstructionText("预算￥100，检查文件。失败？停止；否则：继续。"),
    ).toBe("预算￥100, check file. 失败? 停止; 否则: 继续.");
  });

  it("checks, fixes, and remains idempotent across governed files", () => {
    const root = temporaryProject();
    const agentsPath = writeFixture(
      root,
      "AGENTS.md",
      `<!-- BEGIN:/AGENTS.md -->

# /AGENTS.md

本文件描述项目与插件安装.

<!-- END:/AGENTS.md -->
`,
    );
    writeFixture(root, "README.md", "本文件不在治理范围内。\n");

    const check = normalizeGovernedFiles(root, "check");
    expect(check.changedFiles).toEqual([agentsPath]);
    expect(readFileSync(agentsPath, "utf-8")).toContain("本文件");

    const fix = normalizeGovernedFiles(root, "fix");
    expect(fix.changedFiles).toEqual([agentsPath]);
    expect(readFileSync(agentsPath, "utf-8")).toContain(
      "this file description project and installed plugin.",
    );
    expect(normalizeGovernedFiles(root, "check").changedFiles).toEqual([]);
  });

  it("prints a unified diff without writing files", () => {
    const root = temporaryProject();
    const path = writeFixture(
      root,
      "agents/worker.toml",
      'description = "项目文件。"\n',
    );
    const output: string[] = [];

    const exitCode = runNormalizeCli(["--root", root, "--diff"], {
      log: (message) => output.push(message),
      error: (message) => output.push(message),
    });

    expect(exitCode).toBe(1);
    expect(output.join("\n")).toContain("--- a/agents/worker.toml");
    expect(output.join("\n")).toContain("+++ b/agents/worker.toml");
    expect(output.join("\n")).toContain('-description = "项目文件。"');
    expect(output.join("\n")).toContain('+description = "project file."');
    expect(readFileSync(path, "utf-8")).toContain("项目文件");
  });

  it("returns success after --fix and failure from --check when changes remain", () => {
    const root = temporaryProject();
    const path = writeFixture(
      root,
      "agents/worker.toml",
      'description = "第一个项目文件。"\n',
    );
    const errors: string[] = [];

    expect(
      runNormalizeCli(["--root", root, "--check"], {
        log: () => undefined,
        error: (message) => errors.push(message),
      }),
    ).toBe(1);
    expect(errors.join("\n")).toContain("requires normalization");
    expect(runNormalizeCli(["--root", root, "--fix"])).toBe(0);
    expect(readFileSync(path, "utf-8")).toContain(
      'description = "首个 project file."',
    );
    expect(runNormalizeCli(["--root", root, "--check"])).toBe(0);
  });

  it("limits normalization to an explicit file path", () => {
    const root = temporaryProject();
    const first = writeFixture(
      root,
      "agents/first.toml",
      'description = "项目文件。"\n',
    );
    const second = writeFixture(
      root,
      "agents/second.toml",
      'description = "项目目录。"\n',
    );

    expect(runNormalizeCli(["--root", root, "--path", first, "--fix"])).toBe(0);
    expect(readFileSync(first, "utf-8")).toContain(
      'description = "project file."',
    );
    expect(readFileSync(second, "utf-8")).toContain("项目目录");
  });

  it("limits normalization to governed files under an explicit directory", () => {
    const root = temporaryProject();
    const targetDirectory = join(root, "skills", "target");
    const target = writeFixture(
      root,
      "skills/target/SKILL.md",
      "# Target\n\n项目文件。\n",
    );
    const other = writeFixture(
      root,
      "skills/other/SKILL.md",
      "# Other\n\n项目目录。\n",
    );

    expect(
      runNormalizeCli(["--root", root, "--path", targetDirectory, "--fix"]),
    ).toBe(0);
    expect(readFileSync(target, "utf-8")).toContain("project file.");
    expect(readFileSync(other, "utf-8")).toContain("项目目录");
  });

  it("allows ￥ and rejects undeclared non-ASCII punctuation or symbols", () => {
    const root = temporaryProject();
    writeFixture(root, "agents/worker.toml", 'description = "预算￥100 ©"\n');
    const errors: string[] = [];

    expect(
      runNormalizeCli(["--root", root, "--check"], {
        log: () => undefined,
        error: (message) => errors.push(message),
      }),
    ).toBe(1);
    expect(errors.join("\n")).toContain("unsupported symbol U+00A9");
    expect(
      runNormalizeCli(["--root", root, "--fix"], {
        log: () => undefined,
        error: (message) => errors.push(message),
      }),
    ).toBe(1);
  });

  it("rejects duplicate dictionary sources", () => {
    const root = temporaryProject();
    const dictionaryPath = writeFixture(
      root,
      "vocabulary.yaml",
      `literalRules:
  - from: "项目"
    to: "project"
  - from: "项目"
    to: "project2"
contextualRules: []
punctuationRules: []
allowedNonAsciiSymbols: []
`,
    );

    expect(() => loadVocabulary(dictionaryPath)).toThrow(
      'duplicate dictionary source "项目"',
    );
  });
});
