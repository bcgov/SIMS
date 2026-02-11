import ApiClient from "@/services/http/ApiClient";
import { DynamicFormConfigurationAPIOutDTO } from "@/services/http/dto";
import { DynamicFormType, OfferingIntensity } from "@/types";

export class DynamicFormConfigurationService {
  // Share Instance
  private static instance: DynamicFormConfigurationService;

  static get shared(): DynamicFormConfigurationService {
    return this.instance || (this.instance = new this());
  }

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
    return ApiClient.DynamicFormConfigurationApi.getDynamicFormConfiguration(
      formType,
      options,
    );
  }
}
