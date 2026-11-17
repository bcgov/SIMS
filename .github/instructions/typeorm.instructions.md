---
applyTo: "sources/packages/backend/**/*.ts"
---

## GitHub Copilot PR Review: TypeORM Checks

When reviewing TypeORM changes, apply these checks and raise comments with specific file/line references and a short fix suggestion.

### Queries

- Prefer `ANY` over `IN` for lists of values in where clauses: `Any(ids)` in find options or `= ANY(:ids)` in query builders, instead of `In(ids)` or `IN (:...ids)`. `ANY` sends the list as a single array parameter, so the SQL stays the same regardless of the list size and large lists do not hit the PostgreSQL parameter limit.

  ```typescript
  // Find options.
  repository.find({ where: { id: Any(ids) } });
  // Query builder.
  queryBuilder.where("student.id = ANY(:ids)", { ids });
  ```

### What to Flag

- New or changed where clauses using `In(...)` or `IN (:...param)` for lists of values.
