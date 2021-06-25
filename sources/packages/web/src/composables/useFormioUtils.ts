import { Utils } from "formiojs";

export function useFormioUtils() {
  const getComponent = (form: any, componentKey: string): any => {
    return Utils.getComponent(form.components, componentKey, true);
  };

  const getComponentValue = (form: any, componentKey: string): string => {
    return Utils.getValue(form.submission, componentKey);
  };

  return {
    getComponent,
    getComponentValue,
  };
}
