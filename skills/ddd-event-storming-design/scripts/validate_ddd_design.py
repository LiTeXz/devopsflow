#!/usr/bin/env python3
"""Lightweight text checks for DDD event-storming artifacts.

This script is intentionally heuristic. It catches common process smells in
drafts or persisted Markdown; it does not replace human domain review.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


SMELLS = {
  "table_first": [
    r"\b(create|update|delete)\s+(table|record|row)\b",
    r"\b(order_item|user_table|.*_table)\b",
    r"数据库表|数据表|表结构",
  ],
  "technical_event": [
    r"缓存.*已刷新|消息.*已发送|日志.*已记录|接口.*已调用",
    r"MQ|Kafka|Redis|HTTP.*事件",
  ],
  "crud_command": [
    r"新增.*命令|修改.*命令|删除.*命令|Create.*Command|Update.*Command|Delete.*Command",
    r"(建立|创建|变更|修改|调整|撤销|删除|维护|管理).*(公司|部门|岗位|员工|用户|角色|菜单|权限)",
    r"(公司|部门|岗位|员工|用户|角色|菜单|权限).*(建立|创建|变更|修改|调整|撤销|删除|维护|管理)",
  ],
  "generic_change_event": [
    r"(公司|部门|岗位|员工|用户|角色|菜单|权限)?.*(信息|资料|状态|记录).*已(变更|更新|修改|删除)",
    r"已停用或解散|已启用或停用|已通过或拒绝",
  ],
  "actorless_design": [
    r"(?s)(命令清单|#\s*命令|##\s*命令)(?!.*(Actor|主体|发起|角色|外部系统|Timer|System))",
  ],
  "flat_admin_nouns": [
    r"(?s)(公司.*聚合.*部门.*聚合.*岗位.*聚合.*员工.*聚合|用户.*聚合.*角色.*聚合.*菜单.*聚合.*权限.*聚合)",
    r"(?s)(公司聚合.*部门聚合.*岗位聚合.*员工聚合|用户聚合.*角色聚合.*菜单聚合.*权限聚合)",
  ],
  "data_model_echo": [
    r"(字段|表|数据表|字段名|外键|主键).*(领域事件|命令|聚合|读模型)",
    r"(create|update|delete|insert|upsert).*(command|event|aggregate)",
    r"(新增|修改|删除|维护|管理).*(领域事件|命令|聚合)",
    r"(Company|Dept|Department|Position|Employee)(Created|Updated|Deleted|Edited)Event",
    r"(公司|部门|岗位|员工).*(新增|修改|删除|编辑).*事件",
  ],
}

REQUIRED_SECTIONS = [
  "问题域边界",
  "主体",
  "领域事件",
  "命令",
  "Policy",
  "聚合",
  "读模型",
  "完整性检查",
]


def read_text(path: Path) -> str:
  if path.is_dir():
    parts = []
    for file in sorted(path.rglob("*.md")):
      parts.append(f"\n# FILE: {file}\n")
      parts.append(file.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(parts)
  return path.read_text(encoding="utf-8", errors="replace")


def has_any(text: str, patterns: list[str]) -> bool:
  return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)


def find_confirmation_gate_violations(text: str) -> list[str]:
  findings: list[str] = []

  has_crud_noun_cluster = has_any(
    text,
    [
      r"公司.*部门.*岗位.*员工",
      r"company.*dept.*position.*employee",
      r"company.*department.*position.*employee",
      r"用户.*角色.*菜单.*权限",
      r"user.*role.*menu.*permission",
    ],
  )
  has_gate_question = has_any(
    text,
    [
      r"是否.*(权威|唯一主数据|主数据权威|成立|包含|纳入|确认)",
      r"请.*确认",
      r"需要你.*确认",
      r"先确认",
      r"问题域.*确认",
    ],
  )
  has_downstream_sections = (
    has_any(text, [r"领域事件清单|#\s*领域事件|##\s*领域事件"])
    and has_any(text, [r"命令清单|#\s*命令|##\s*命令"])
    and has_any(text, [r"聚合设计|#\s*聚合|##\s*聚合"])
  )
  has_read_model_section = has_any(text, [r"读模型设计|#\s*读模型|##\s*读模型"])

  if has_crud_noun_cluster and has_downstream_sections and not has_gate_question:
    findings.append(
      "artifact_flooding: CRUD-looking ambiguous input expanded into downstream events, commands, and aggregates without confirmation gate evidence"
    )

  if has_crud_noun_cluster and has_gate_question and has_downstream_sections:
    findings.append(
      "confirmation_gate_skipped: CRUD-looking boundary question is still open while events, commands, and aggregates are already expanded"
    )

  if has_crud_noun_cluster and has_gate_question and has_downstream_sections and has_read_model_section:
    findings.append(
      "full_draft_before_gate_confirmation: read models were expanded before upstream confirmation gates were resolved"
    )

  return findings


def main() -> int:
  parser = argparse.ArgumentParser()
  parser.add_argument("path", help="Markdown file or event-storming directory")
  parser.add_argument("--require-sections", action="store_true")
  args = parser.parse_args()

  text = read_text(Path(args.path))
  findings: list[str] = []

  for smell, patterns in SMELLS.items():
    for pattern in patterns:
      if re.search(pattern, text, re.IGNORECASE):
        findings.append(f"{smell}: matched {pattern}")

  findings.extend(find_confirmation_gate_violations(text))

  if args.require_sections:
    for section in REQUIRED_SECTIONS:
      if section not in text:
        findings.append(f"missing_section: {section}")

  if findings:
    print("DDD design guardrail findings:")
    for finding in findings:
      print(f"- {finding}")
    return 1

  print("DDD design guardrail checks passed.")
  return 0


if __name__ == "__main__":
  sys.exit(main())
