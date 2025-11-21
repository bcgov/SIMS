---
applyTo: "sources/packages/**/*.ts"
---

## GitHub Copilot PR Review: TypeScript Style Checks

When reviewing TypeScript changes, apply these checks and raise comments with specific file/line references and a short fix suggestion.

### Comment and JSDoc Quality

- Sentences: Start with a capital letter and end with a period.
- JSDoc presence: Public classes, exported functions, and public methods must have a JSDoc block that describes the business context, not only what the code does.
- JSDoc punctuation: The first sentence of the JSDoc description ends with a period. Each `@param` description is a proper sentence ending with a period. `@returns` is documented when applicable.
- Avoid noise: Prefer comments that clarify intent and business rules over restating code.

### Readability and Patterns (light checks)

- Prefer early returns to reduce nesting where practical.
- Use `async/await` instead of `.then()`/`.catch()`.
- Use `const` unless a variable is reassigned; use `let` only when needed.
- Avoid one-letter variable names, except for conventional counters or indexes.

### Suggested Comment Template

Use this format for missing/insufficient JSDoc on exported/public APIs:

```
/**
 * [Business-context sentence ending with a period.]
 * @param foo Brief, grammatically correct description ending with a period.
 * @returns Brief description of return value ending with a period.
 */
```

### What to Flag

- JSDoc descriptions or inline comments missing terminal periods or not starting with a capital letter.
- Public/exported symbols without JSDoc when non-trivial.
- Overly technical comments that could be improved with business context.
