import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import { FormCategory } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { FormSubmissionValidatorBase } from ".";
import { APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL } from "../../../constants";
import { StudentAppealService } from "../..";

/**
 * Executes validations for application-related appeals that are associated with
 * a Student Application and were determined to be eligible for such application.
 */
@Injectable()
export class ApplicationEligibleAppealsValidator implements FormSubmissionValidatorBase {
  constructor(private readonly studentAppealService: StudentAppealService) {}

  /**
   * Executes the validation of application appeals form submission,
   * @param formSubmissionConfigs form submission configurations.
   * @param studentId student id.
   * @throws error if the validation fails.
   */
  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number,
  ): Promise<void> {
    // All forms in the submission share the same context, so we can use the first one as reference for the validation.
    const [referencedConfig] = formSubmissionConfigs;
    if (
      referencedConfig.formCategory !== FormCategory.StudentAppeal ||
      !referencedConfig.applicationId
    ) {
      // Form validator application only for appeals with a valid application ID.
      return;
    }
    // Ensures the appeals are validated based on the eligibility criteria used for fetching the
    // eligible applications for appeal using getEligibleApplicationsForAppeal endpoint.
    const [eligibleApplication] =
      await this.studentAppealService.getEligibleApplicationsForAppeal(
        studentId,
        { applicationId: referencedConfig.applicationId },
      );
    if (!eligibleApplication) {
      throw new CustomNamedError(
        "The application is not eligible to submit an appeal.",
        APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
      );
    }
    // Validate if all the submitted forms are eligible appeals for the application.
    const formNames = formSubmissionConfigs.map(
      (config) => config.formDefinitionName,
    );
    const eligibleAppealForms = new Set(
      eligibleApplication.currentAssessment.eligibleApplicationAppeals,
    );
    const ineligibleFormNames = formNames.filter(
      (formName) => !eligibleAppealForms.has(formName),
    );
    if (ineligibleFormNames.length) {
      throw new UnprocessableEntityException(
        `The submitted appeal form(s) ${ineligibleFormNames.join(", ")} is/are not eligible for the application.`,
      );
    }
  }
}
