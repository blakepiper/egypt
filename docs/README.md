# Project documentation

Status: current documentation map

Updated: 2026-08-31

The documentation tree is split by whether a file describes the current release
or records work that has already been replaced:

- `live/` is maintained documentation for the shipped application.
- `obe/` means obsolete: it preserves completed plans, investigations, and
  superseded specifications for context, but it is not a current task list.

## Current references

- [Implementation status](live/IMPLEMENTATION_STATUS.md) — release inventory,
  safeguards, known warnings, and verification results.
- [Design system](live/DESIGN_SYSTEM.md) — visual principles, components,
  accessibility rules, motion, and static architecture.
- [Reference assets](live/REFERENCE_ASSETS.md) — inspiration provenance and the
  boundary for publishable media.

## Archived records

- [Application implementation plan](obe/APPLICATION_IMPLEMENTATION_PLAN.md) —
  original full-application plan and release criteria.
- [Wiki scope expansion plan](obe/WIKI_SCOPE_EXPANSION_PLAN.md) — the completed
  editorial expansion and provenance plan.
- [Knowledge graph upgrade spec](obe/KNOWLEDGE_GRAPH_UPGRADE_SPEC.md) — the
  completed graph investigation and implementation phases.
- [Search page improvement plan](obe/SEARCH_PAGE_IMPROVEMENT_PLAN.md) — the
  completed search ranking, filtering, excerpt, and navigation work.

For application usage and development commands, start with the [repository
README](../README.md). The root [`llm-wiki.md`](../llm-wiki.md) is a separate,
intentionally abstract description of the persistent-wiki pattern; the
project-specific source of truth remains `llm-wiki/`.

## Maintenance

After a release, update the current status counts and checks from the generated
build. Move a plan to `obe/` when its work is complete or superseded, add the
archive note at the top, and update this index. Keep generated files and the
immutable `raw/` source collection out of documentation edits.
