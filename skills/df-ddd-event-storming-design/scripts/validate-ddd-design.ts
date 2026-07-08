#!/usr/bin/env bun

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SMELLS: Record<string, string[]> = {
	table_first: [
		"\\b(create|update|delete)\\s+(table|record|row)\\b",
		"\\b(order_item|user_table|.*_table)\\b",
		"数据库表|数据表|表结构",
	],
	technical_event: [
		"缓存.*已刷新|消息.*已发送|日志.*已记录|接口.*已调用",
		"MQ|Kafka|Redis|HTTP.*事件",
	],
	crud_command: [
		"新增.*命令|修改.*命令|删除.*命令|Create.*Command|Update.*Command|Delete.*Command",
		"(建立|创建|变更|修改|调整|撤销|删除|维护|管理).*(公司|部门|岗位|员工|用户|角色|菜单|权限)",
		"(公司|部门|岗位|员工|用户|角色|菜单|权限).*(建立|创建|变更|修改|调整|撤销|删除|维护|管理)",
	],
	generic_change_event: [
		"(公司|部门|岗位|员工|用户|角色|菜单|权限)?.*(信息|资料|状态|记录).*已(变更|更新|修改|删除)",
		"已停用或解散|已启用或停用|已通过或拒绝",
	],
	actorless_design: [
		"[\\s\\S]*(命令清单|#\\s*命令|##\\s*命令)(?![\\s\\S]*(Actor|主体|发起|角色|外部系统|Timer|System))",
	],
	flat_admin_nouns: [
		"[\\s\\S]*(公司.*聚合.*部门.*聚合.*岗位.*聚合.*员工.*聚合|用户.*聚合.*角色.*聚合.*菜单.*聚合.*权限.*聚合)",
		"[\\s\\S]*(公司聚合.*部门聚合.*岗位聚合.*员工聚合|用户聚合.*角色聚合.*菜单聚合.*权限聚合)",
	],
	data_model_echo: [
		"(字段|表|数据表|字段名|外键|主键).*(领域事件|命令|聚合|读模型)",
		"(create|update|delete|insert|upsert).*(command|event|aggregate)",
		"(新增|修改|删除|维护|管理).*(领域事件|命令|聚合)",
		"(Company|Dept|Department|Position|Employee)(Created|Updated|Deleted|Edited)Event",
		"(公司|部门|岗位|员工).*(新增|修改|删除|编辑).*事件",
	],
};

const REQUIRED_SECTIONS = [
	"问题域边界",
	"主体",
	"领域事件",
	"命令",
	"Policy",
	"聚合",
	"读模型",
	"完整性检查",
];

function readText(filePath: string): string {
	try {
		const stat = require("node:fs").statSync(filePath);
		if (stat.isDirectory()) {
			const parts: string[] = [];
			const files = readdirSync(filePath).sort();
			for (const file of files) {
				if (file.endsWith(".md")) {
					parts.push(`\n# FILE: ${file}\n`);
					parts.push(readFileSync(join(filePath, file), "utf-8"));
				}
			}
			return parts.join("\n");
		}
	} catch {
		// Not a directory, treat as file
	}
	return readFileSync(filePath, "utf-8");
}

function hasAny(text: string, patterns: string[]): boolean {
	return patterns.some((pattern) => new RegExp(pattern, "i").test(text));
}

function findConfirmationGateViolations(text: string): string[] {
	const findings: string[] = [];

	const hasCrudNounCluster = hasAny(text, [
		"公司.*部门.*岗位.*员工",
		"company.*dept.*position.*employee",
		"company.*department.*position.*employee",
		"用户.*角色.*菜单.*权限",
		"user.*role.*menu.*permission",
	]);

	const hasGateQuestion = hasAny(text, [
		"是否.*(权威|唯一主数据|主数据权威|成立|包含|纳入|确认)",
		"请.*确认",
		"需要你.*确认",
		"先确认",
		"问题域.*确认",
	]);

	const hasDownstreamSections =
		hasAny(text, ["领域事件清单|#\\s*领域事件|##\\s*领域事件"]) &&
		hasAny(text, ["命令清单|#\\s*命令|##\\s*命令"]) &&
		hasAny(text, ["聚合设计|#\\s*聚合|##\\s*聚合"]);

	const hasReadModelSection = hasAny(text, [
		"读模型设计|#\\s*读模型|##\\s*读模型",
	]);

	if (hasCrudNounCluster && hasDownstreamSections && !hasGateQuestion) {
		findings.push(
			"artifact_flooding: CRUD-looking ambiguous input expanded into downstream events, commands, and aggregates without confirmation gate evidence",
		);
	}

	if (hasCrudNounCluster && hasGateQuestion && hasDownstreamSections) {
		findings.push(
			"confirmation_gate_skipped: CRUD-looking boundary question is still open while events, commands, and aggregates are already expanded",
		);
	}

	if (
		hasCrudNounCluster &&
		hasGateQuestion &&
		hasDownstreamSections &&
		hasReadModelSection
	) {
		findings.push(
			"full_draft_before_gate_confirmation: read models were expanded before upstream confirmation gates were resolved",
		);
	}

	return findings;
}

function findAggregateStateViolations(text: string): string[] {
	const findings: string[] = [];
	const hasAggregateSection = hasAny(text, [
		"聚合设计|#\\s*聚合|##\\s*聚合|Aggregate",
	]);
	const hasStateSection = hasAny(text, [
		"聚合.*(属性|状态|state)|状态字段|聚合属性|state fields?",
	]);

	if (!hasAggregateSection || !hasStateSection) {
		return findings;
	}

	const hasStateJustification = hasAny(text, [
		"业务方法.*(读取|读|改变|修改|写入|使用)",
		"(读取|改变|修改|写入|使用).*业务方法",
		"(不变量|唯一性|资格|准入|规则|生命周期|事件.*产生|事件.*决策)",
		"(business method|invariant|uniqueness|eligibility|lifecycle|event decision)",
	]);

	if (!hasStateJustification) {
		findings.push(
			"aggregate_state_without_behavior_evidence: aggregate state fields are listed without business-method, invariant, lifecycle, or event-decision evidence",
		);
	}

	const persistenceOnlyEvidence = hasAny(text, [
		"(snapshot|快照|mapper|映射|repository|仓储|persistence|持久化|projection|投影|read model|读模型|display|展示|page|页面|export|导出|report|报表).*" +
			"(所以|因此|用于|作为|需要).*(聚合.*(属性|状态)|状态字段|聚合属性)",
		"(聚合.*(属性|状态)|状态字段|聚合属性).*" +
			"(snapshot|快照|mapper|映射|repository|仓储|persistence|持久化|projection|投影|read model|读模型|display|展示|page|页面|export|导出|report|报表)",
	]);

	if (persistenceOnlyEvidence) {
		findings.push(
			"aggregate_state_justified_by_projection_or_persistence: aggregate state appears justified only by snapshot, mapping, persistence, projection, or display concerns",
		);
	}

	const fakeLifecycleState =
		hasAny(text, [
			"(状态|来源|类型|status|source|type).*(聚合.*(属性|状态)|状态字段|聚合属性)",
		]) &&
		!hasAny(text, [
			"(状态|来源|类型|status|source|type).*(命令|事件|业务方法|规则|分支|改变|切换|停用|启用|恢复)",
			"(命令|事件|业务方法|规则|分支|改变|切换|停用|启用|恢复).*(状态|来源|类型|status|source|type)",
		]);

	if (fakeLifecycleState) {
		findings.push(
			"fake_lifecycle_state: status/source/type state is present without commands, events, or rules that change or branch on it",
		);
	}

	return findings;
}

export function validateDesign(
	text: string,
	requireSections: boolean = false,
): string[] {
	const findings: string[] = [];

	for (const [smell, patterns] of Object.entries(SMELLS)) {
		for (const pattern of patterns) {
			if (new RegExp(pattern, "i").test(text)) {
				findings.push(`${smell}: matched ${pattern}`);
			}
		}
	}

	findings.push(...findConfirmationGateViolations(text));
	findings.push(...findAggregateStateViolations(text));

	if (requireSections) {
		for (const section of REQUIRED_SECTIONS) {
			if (!text.includes(section)) {
				findings.push(`missing_section: ${section}`);
			}
		}
	}

	return findings;
}

function main(): number {
	const rawArgs = Bun.argv;
	const scriptIdx = rawArgs.findIndex((a) => a.includes("validate-ddd-design"));
	const args = scriptIdx >= 0 ? rawArgs.slice(scriptIdx + 1) : rawArgs.slice(2);

	const path = args.find((a) => !a.startsWith("--"));
	const requireSections = args.includes("--require-sections");

	if (!path) {
		console.error("Usage: validate-ddd-design.ts <path> [--require-sections]");
		return 1;
	}

	const text = readText(path);
	const findings = validateDesign(text, requireSections);

	if (findings.length) {
		console.log("DDD design guardrail findings:");
		for (const finding of findings) {
			console.log(`- ${finding}`);
		}
		return 1;
	}

	console.log("DDD design guardrail checks passed.");
	return 0;
}

if (import.meta.main) {
	process.exit(main());
}
