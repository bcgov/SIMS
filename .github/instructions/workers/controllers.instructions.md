---
applyTo: "sources/packages/backend/apps/workers/src/controllers/**/*.controller.ts"
---

## GitHub Copilot Instructions: Camunda Workers Controller Patterns

This guide defines the review checklist and implementation patterns for Camunda (Zeebe) worker controllers inside `apps/workers`. Use it during PR reviews to ensure consistency, idempotency, observability, and safe workflow interactions.

### Scope & Location
Workers live under:
```
sources/packages/backend/apps/workers/src/controllers/[feature]/[feature].controller.ts
sources/packages/backend/apps/workers/src/controllers/[feature]/[feature].dto.ts
```
Each feature folder should also contain a `_tests_` directory with worker-related tests.

### File Naming
- Controller: `[feature].controller.ts`.
- DTOs: `[feature].dto.ts` containing all In/Out/Header DTOs for that feature.
- Keep names aligned with `Workers` enum constants to ease traceability.

### Decorators & Signatures
- Class must have `@Controller()`.
- Worker methods must use `@ZeebeWorker(Workers.<TaskName>, { fetchVariable: [...], maxJobsToActivate: MaxJobsToActivate.<Level> })`.
- Method signature pattern:
	```typescript
	async someWorker(
		job: Readonly<ZeebeJob<InDTO, HeaderDTO | ICustomHeaders, OutDTO>>,
	): Promise<MustReturnJobActionAcknowledgement>
	```
- Use explicit generics in the order: `Variables(InDTO), Headers(HeaderDTO|ICustomHeaders), OutputVariables(OutDTO|IOutputVariables)`.

### Idempotency & Retry Principles
Workers MUST be idempotent and safely "retryable", which means running it once yields the same result as running it N times.
- Guard: Early check for existing state (e.g. exception already created, status already updated); if already processed call `job.complete()` immediately.
- Updates must be conditional (e.g. `updateResult.affected` check) and return early if not applied.
- Handle race conditions by catching domain-specific `CustomNamedError` (e.g. `APPLICATION_EXCEPTION_ALREADY_ASSOCIATED`) and returning the resultant state instead of failing.
- Use transactions (`dataSource.transaction`) when multiple writes must succeed/fail atomically to support safe retries.

### Error Handling Patterns
- Wrap logic with `try/catch` per worker method.
- Expected domain errors: `if (error instanceof CustomNamedError) { switch(error.name) { ... } }`.
	- Return `job.error(error.name, error.message)` for business/validation failures that BPMN boundary events should react to.
	- Return `job.complete()` for idempotent duplicates (e.g. already associated) without signalling failure.
- Unknown errors: delegate to `createUnexpectedJobFail(error, job, { logger })` to standardize logging and Zeebe job failure.
- Never throw raw errors after catch; always translate to `job.error`, `job.complete`, or `createUnexpectedJobFail`.
- Ensure error codes come from constants (`@sims/services/constants` or local `../../constants`) to keep BPMN bindings stable.

### Logging
- Instantiate a per-method logger: `const jobLogger = new Logger(job.type);`.
- Messages should include relevant identifiers (applicationId, assessmentId) to aid traceability.

### DTO Usage
- All Zeebe variable contracts defined as classes in `[feature].dto.ts`.
- Input DTOs: represent `job.variables`; Output DTOs: represent structured safe data exposed to workflow; Header DTOs: represent `job.customHeaders`.
- Keep output DTOs minimal – no full entity objects, only required primitive/data snapshot fields.

### Variable Management
- `fetchVariable` array must list ONLY needed workflow variables; remove unused items to reduce payload.
- Output variables: pass explicit object to `job.complete(output)` – avoid leaking PII (Personally Identifiable Information).
- Dynamic output naming must be deterministic and camelCase (e.g. `programYearTotalFullTimeBCAG`).

### Transactions & Concurrency
- Use `dataSource.transaction` for multi-step writes that define single logical outcome (e.g. create exception + notification, assessment wrap-up).
- Use `Promise.all` for independent operations when safe (e.g. create exception + save notification) to reduce latency.

### Idempotency Review Signals
Check for:
- Condition checks before writes (`if (existing) return job.complete();`).
- State refresh after race condition errors to return accurate current status.
- Defensive double-update prevention (e.g. verifying `updateResult.affected`).

### Common Anti-Patterns (Flag These)
- Missing `try/catch` or direct `throw` inside worker method.
- Returning raw entities in output variables.
- Not checking write result (`updateResult.affected`) for status transitions.
- Hard-coded strings for error codes instead of constants.
- Over-fetching variables in `fetchVariable` not used in method body.
- Lack of idempotent guard.
- Logging sensitive data or entire dynamic JSON payloads.

### Template Snippets
Expected error handling skeleton:
```typescript
@ZeebeWorker(Workers.SomeTask, { fetchVariable: [SOME_ID], maxJobsToActivate: MaxJobsToActivate.Normal })
async someTask(
	job: Readonly<ZeebeJob<SomeInDTO, ICustomHeaders, SomeOutDTO>>,
): Promise<MustReturnJobActionAcknowledgement> {
	const jobLogger = new Logger(job.type);
	try {
		// Idempotency guard.
		if (alreadyProcessed) {
			jobLogger.log("Already processed.");
			return job.complete(existingOutcome);
		}
		// Core logic...
		return job.complete(result);
	} catch (error: unknown) {
		if (error instanceof CustomNamedError) {
			switch (error.name) {
				case DOMAIN_EXPECTED_DUPLICATE:
					jobLogger.log(error.message);
					return job.complete();
				case DOMAIN_VALIDATION_ERROR:
					jobLogger.error(error.message);
					return job.error(error.name, error.message);
			}
		}
		return createUnexpectedJobFail(error, job, { logger: jobLogger });
	}
}
```

### Copilot PR Review Checklist (Use These Bullets)
1. File naming matches `[feature].controller.ts` and DTO file present.
2. Every worker method has `@ZeebeWorker` with correct `Workers` constant and appropriate `maxJobsToActivate`.
3. Generics order in `ZeebeJob<In, Headers, Out>` correct; return type is `Promise<MustReturnJobActionAcknowledgement>`.
4. Logger instantiated per method (`new Logger(job.type)`).
5. Idempotency guard present before mutating state; duplicate runs return `job.complete()` early.
6. Transaction used where multiple writes must be atomic; completion returned inside transaction block.
7. Expected domain errors mapped via `job.error(code, message)`; duplicate/benign conditions complete instead of error.
8. All unknown errors routed to `createUnexpectedJobFail` (no silent swallow, no raw throw).
9. `fetchVariable` lists only the variables used; no extras.
10. Output variables minimal and free of raw entities/PII; dynamic variable names deterministic.
11. No full dynamic application data leaked unless filtered (check for `filterObjectProperties` usage if large DTO).
12. Status/association updates check `affected` or pre-existence to guarantee idempotency.
13. Domain constants used for error codes (no magic strings).
14. Concurrency/race condition errors (e.g. already associated) handled and logged with safe completion.
15. JSDoc descriptions follow style: capitalized first letter, ending period, business context present.
16. No blocking sequential awaits when `Promise.all` could be safely used.

---
Ensure new workers adhere to all above. Raise comments referencing file & line with concise fix suggestions.