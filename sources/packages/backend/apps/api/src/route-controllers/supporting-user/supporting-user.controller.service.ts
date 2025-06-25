import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { DynamicFormConfigurationService, FormService } from "../../services";
import { SupportingUserType } from "@sims/sims-db";
import { getSupportingUserFormType } from "../../utilities";
import { DryRunSubmissionResult } from "apps/api/src/types";

@Injectable()
export class SupportingUserControllerService {
  constructor(
    private readonly formService: FormService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {}

  /**
   * Validate dry run submission for supporting user data.
   * @param programYearId program year id
   * @param supportingUserType supporting user type.
   * @param isAbleToReport is supporting user able to report.
   * @param submissionData supporting user data.
   * @returns validated supporting user data.
   */
  async validateDryRunSubmission<T>(
    programYearId: number,
    supportingUserType: SupportingUserType,
    submissionData: T & { isAbleToReport: boolean },
  ): Promise<T> {
    const formType = getSupportingUserFormType(supportingUserType);
    const formName = this.dynamicFormConfigurationService.getDynamicFormName(
      formType,
      { programYearId },
    );
    if (!formName) {
      throw new UnprocessableEntityException(
        `Dynamic form configuration for ${formType} not found.`,
      );
    }
    const submissionResult: DryRunSubmissionResult<T> =
      await this.formService.dryRunSubmission(formName, submissionData);
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update supporting user data due to an invalid request.",
      );
    }
    return submissionResult.data.data;
  }
}
