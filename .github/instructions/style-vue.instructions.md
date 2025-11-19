---
applyTo: "sources/packages/web/src/**/*.vue"
---

## Copilot PR Review: Vue Component Style Checks

When reviewing Vue SFCs, ensure comment and doc quality and basic readability patterns.

### Comment Quality

- Sentences: Begin with a capital letter and end with a period.
- Prefer comments that explain user-facing behavior or business context.

### Script Block Guidelines

- Use the Composition API with `script setup` per project standards.
- Use `async/await` and prefer early returns where they simplify logic.
- Prefer `const` for values not reassigned; use `let` only when needed.

### What to Flag

- Inline comments or JSDoc-like blocks missing terminal periods or not starting with a capital letter.
- Non-`script setup` usage unless there is a clear reason.
- Unclear component intent where a brief comment would help future readers.
