import { Utils } from "formiojs";

/**
 * Form.IO helper methods.
 */
export function useFormioUtils() {
  // Get a component in a form definition once it is loaded.
  const getComponent = (form: any, componentKey: string): any => {
    return Utils.getComponent(form.components, componentKey, true);
  };

  // Forces a component to execute a redraw.
  const redrawComponent = (form: any, componentKey: string): any => {
    return getComponent(form, componentKey).redraw();
  };

  // Get the value from a component in a form definition once it is loaded.
  const getComponentValueByKey = (form: any, componentKey: string): any => {
    return Utils.getValue(form.submission, componentKey);
  };

  /**
   * find the formio component  and set the value
   * @param form form.
   * @param componentKey component api/id from formio.
   * @param value value that need to be set to the field
   */
  const setComponentValue = (form: any, componentKey: string, value: any) => {
    const componentObj = getComponent(form, componentKey);
    componentObj.setValue(value);
  };

  /**
   * Iterates recursively in all components checking for
   * a matchCondition provided as a parameter.
   * @param components components to iterate through.
   * @param matchedComponents cumulative results being
   * stored along the recursive iterations.
   * @param matchCondition match condition to include
   * a component in the results.
   */
  const internalRecursiveSearch = (
    components: any[],
    matchedComponents: any[],
    matchCondition: (component: any) => boolean,
  ) => {
    components.forEach((component: any) => {
      if (component.components) {
        internalRecursiveSearch(
          component.components,
          matchedComponents,
          matchCondition,
        );
      }
      if (matchCondition(component)) {
        matchedComponents.push(component);
      }
    });
  };

  /**
   * Iterates recursively in all components checking for
   * a matchCondition provided as a parameter.
   * @param components components to iterate through.
   * @param matchedComponents cumulative results being
   * stored along the recursive iterations.
   * @param matchCondition match condition to include
   * a component in the results.
   * @returns all the components that matches the
   * matchCondition function.
   */
  const recursiveSearch = (
    form: any,
    matchCondition: (component: any) => boolean,
  ): any[] => {
    const matchedComponents: any[] = [];
    internalRecursiveSearch(form.components, matchedComponents, matchCondition);
    return matchedComponents;
  };

  // Search for components of a specifi type.
  const getComponentsOfType = (form: any, type: string): any[] => {
    return recursiveSearch(form, component => component.type === type);
  };

  // Get all unique file names from all file components.
  const getAssociatedFiles = (form: any): string[] => {
    const fileComponents = getComponentsOfType(form, "file");
    const associatedFiles: string[] = [];
    fileComponents.forEach(fileComponent => {
      const fileComponentValue = fileComponent.getValue();
      if (fileComponentValue) {
        fileComponentValue.forEach((file: any) => {
          associatedFiles.push(file.name);
        });
      }
    });
    return associatedFiles;
  };

  const setButtonSettings = (
    form: any,
    settings?: {
      showPrevious: boolean;
      showCancel: boolean;
      showSubmit: boolean;
      showNext: boolean;
    },
  ): void => {
    form.options.buttonSettings = settings;
  };

  const disableWizardButtons = (form: any): void => {
    setButtonSettings(form, {
      showPrevious: false,
      showCancel: false,
      showSubmit: false,
      showNext: false,
    });
  };

  const setRadioOptions = (form: any, componentKey: string, options: any) => {
    const componentObj = getComponent(form, componentKey);
    componentObj.component.values = options;
    componentObj.redraw();
  };

  return {
    getComponent,
    redrawComponent,
    getComponentValueByKey,
    getComponentsOfType,
    getAssociatedFiles,
    recursiveSearch,
    setButtonSettings,
    disableWizardButtons,
    setComponentValue,
    setRadioOptions,
  };
}
