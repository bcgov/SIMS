import { watch } from "vue";
import type { ComputedRef } from "vue";

/**
 * JSONForms' visibility "rule" only affects rendering - it never touches
 * the underlying data, so a control hidden by a rule keeps whatever value
 * it had before. This clears that value once the control becomes hidden,
 * so a stale answer doesn't get submitted (or fail a schema constraint
 * that assumes the field is absent while hidden, e.g. an "else" branch's
 * `{ not: {} }`).
 *
 * Renderer-specific concerns (e.g. seeding defaults while visible) stay in
 * the renderer itself; this only owns the "on hide, clear" half.
 */
export function useClearDataWhenHidden(
  visible: ComputedRef<boolean>,
  path: ComputedRef<string>,
  handleChange: (path: string, value: unknown) => void,
) {
  watch(
    visible,
    (isVisible) => {
      if (!isVisible) {
        handleChange(path.value, undefined);
      }
    },
    { immediate: true },
  );
}
