import { DynamicFormType, OfferingIntensity } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { DynamicFormConfigurationAPIOutDTO } from "@/services/http/dto";

export class DynamicFormConfigurationApi extends HttpBaseClient {
  /**
   * Get dynamic form configuration.
   * @param formType form type.
   * @param options dynamic form options
   * - `programYearId` program year id.
   * - `offeringIntensity` offering intensity.
   * @returns dynamic form configuration.
   */
  async getDynamicFormConfiguration(
    formType: DynamicFormType,
    options?: { programYearId?: number; offeringIntensity?: OfferingIntensity },
  ): Promise<DynamicFormConfigurationAPIOutDTO> {
    // Base URL.
    let url = `dynamic-form-configuration/form-type/${formType}`;
    const parameters: string[] = [];
    // Build query parameters.
    if (options?.programYearId) {
      parameters.push(`programYearId=${options.programYearId}`);
    }
    if (options?.offeringIntensity) {
      parameters.push(`offeringIntensity=${options.offeringIntensity}`);
    }
    if (parameters.length) {
      url += `?${parameters.join("&")}`;
    }
    return this.getCall<DynamicFormConfigurationAPIOutDTO>(
      this.addClientRoot(url),
    );
  }
}
