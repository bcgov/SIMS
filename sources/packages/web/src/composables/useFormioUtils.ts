import { Utils } from "formiojs";

/**
 * Form.IO helper methods.
 */
export function useFormioUtils() {
  // Get a component in a form definition once it is loaded.
  const getComponent = (form: any, componentKey: string): any => {
    return Utils.getComponent(form.components, componentKey, true);
  };

  // Get the value from a component in a form definition once it is loaded.
  const getComponentValue = (form: any, componentKey: string): string => {
    return Utils.getValue(form.submission, componentKey);
  };

  return {
    getComponent,
    getComponentValue,
  };
}
