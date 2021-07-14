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
  const getComponentValue = (form: any, componentKey: string): any => {
    return Utils.getValue(form.submission, componentKey);
  };

  const getComponentsOfType = (form: any, type: string): any[] => {
    return Utils.searchComponents(form.components, { type });
  };

  const getAssociatedFiles = (form: any): string[] => {
    const fileComponents = getComponentsOfType(form, "file");
    const associatedFiles: string[] = [];
    fileComponents.forEach(fileComponent => {
      const fileComponentValue = getComponentValue(form, fileComponent.key);
      if (fileComponentValue) {
        fileComponentValue.forEach((file: any) => {
          associatedFiles.push(file.name);
        });
      }
    });
    return associatedFiles;
  };

  return {
    getComponent,
    getComponentValue,
    getComponentsOfType,
    getAssociatedFiles,
  };
}
