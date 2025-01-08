import { FormIOComponent, FormIOForm } from "@/types";
import { ClassConstructor, plainToClass } from "class-transformer";
import { Utils } from "@formio/js";

/**
 * Form.IO helper methods.
 */
export function useFormioUtils() {
  // Get a component in a form definition once it is loaded.
  const getComponent = (form: any, componentKey: string): FormIOComponent => {
    return Utils.getComponent(form.components, componentKey, true);
  };

  /**
   * Recursively find a component by its key and returns the first one found.
   * @param form form.io form.
   * @param componentKey form.io API key name.
   * @returns first component found.
   */
  const getFirstComponent = (
    form: FormIOForm,
    componentKey: string,
  ): FormIOComponent => {
    const [firstComponentFound] = recursiveSearch(
      form,
      (component) => component.component.key === componentKey,
      { stopOnFirstMatch: true },
    );
    return firstComponentFound;
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
   * @param options related options.
   * - `stopOnFirstMatch` stop the recursive search as soon as the first match is found.
   */
  const internalRecursiveSearch = (
    components: any[],
    matchedComponents: any[],
    matchCondition: (component: any) => boolean,
    options?: {
      stopOnFirstMatch: boolean;
    },
  ) => {
    const stopOnFirstMatch = options?.stopOnFirstMatch ?? false;
    components.forEach((component: any) => {
      // console.log(component.key);
      // console.log(component.component.key);
      if (stopOnFirstMatch && matchedComponents.length) {
        // If only the first match is needed, and one was found, stop searching.
        return;
      }
      if (component.components) {
        internalRecursiveSearch(
          component.components,
          matchedComponents,
          matchCondition,
          options,
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
   * @param form form to iterate through.
   * @param matchCondition match condition to include
   * a component in the results.
   * @param options related options.
   * - `stopOnFirstMatch` stop the recursive search as soon as the first match is found.
   * @returns all the components that matches the
   * matchCondition function.
   */
  const recursiveSearch = (
    form: any,
    matchCondition: (component: any) => boolean,
    options?: {
      stopOnFirstMatch: boolean;
    },
  ): any[] => {
    const matchedComponents: any[] = [];
    internalRecursiveSearch(
      form.components,
      matchedComponents,
      matchCondition,
      options,
    );
    return matchedComponents;
  };

  const searchByKey = (
    components: FormIOComponent[],
    componentKey: string,
    options?: {
      stopOnFirstMatch: boolean;
    },
  ): FormIOComponent[] => {
    const defaultOptions = { stopOnFirstMatch: true };
    const matchedComponents: any[] = [];
    internalRecursiveSearch(
      components,
      matchedComponents,
      (component) => component.key === componentKey,
      options ?? defaultOptions,
    );
    return matchedComponents;
  };

  // Search for components of a specific type.
  const getComponentsOfType = (form: any, type: string): any[] => {
    return recursiveSearch(form, (component) => component.type === type);
  };

  // Get all unique file names from all file components.
  const getAssociatedFiles = (form: any): string[] => {
    const fileComponents = getComponentsOfType(form, "file");
    const associatedFiles: string[] = [];
    fileComponents.forEach((fileComponent) => {
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

  /**
   * Reset the checkboxes/select boxes to its initial
   * or default value.
   * @param form form.
   * @param componentName checkbox or select box component name.
   * @param defaultValue default/ initial value of the checkbox.
   */
  const resetCheckBox = async (
    form: any,
    componentName: string,
    defaultValue: any,
  ) => {
    // Find the checkbox component.
    const checkbox = getComponent(form, componentName);
    checkbox.setValue(defaultValue);
    checkbox.redraw();
  };

  /**
   * Check the validity of all forms returning false if any form is not valid
   * and changing the visual of the invalid components on the UI.
   * @param forms forms to have the validation executed.
   * @returns false if any form is not valid.
   */
  const checkFormioValidity = async (forms: any[] | FormIOForm[]) => {
    const promises = forms.map(async (form: any) => {
      try {
        await form.submit();
        return true;
      } catch {
        return false;
      }
    });
    return !(await Promise.all(promises)).some((eachForm) => !eachForm);
  };

  /**
   * Indicates if extraneous properties should be excluded from object.
   * @param type class type to be used to identify the extraneous properties.
   * @param plainObject object to be checked and have extraneous properties removed.
   * @returns the plain object provided converted to the class type with no
   * extraneous properties.
   */
  const excludeExtraneousValues = <T, V>(
    type: ClassConstructor<T>,
    plainObject: V,
  ): T => {
    return plainToClass(type, plainObject, { excludeExtraneousValues: true });
  };

  return {
    getComponent,
    getFirstComponent,
    redrawComponent,
    getComponentValueByKey,
    getComponentsOfType,
    getAssociatedFiles,
    recursiveSearch,
    setButtonSettings,
    disableWizardButtons,
    setComponentValue,
    setRadioOptions,
    resetCheckBox,
    checkFormioValidity,
    excludeExtraneousValues,
    searchByKey,
  };
}
