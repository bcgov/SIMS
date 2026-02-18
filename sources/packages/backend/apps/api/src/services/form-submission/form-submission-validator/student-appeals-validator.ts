import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { FormSubmissionConfig } from "../form-submission.models";
import { InjectRepository } from "@nestjs/typeorm";
import { FormCategory, FormSubmission } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { FormSubmissionValidatorBase } from ".";
import { APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL } from "apps/api/src/constants";
import { StudentAppealService } from "../../../services";

@Injectable()
export class StudentAppealsValidator implements FormSubmissionValidatorBase {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly studentAppealService: StudentAppealService,
  ) {}

  async validate(
    formSubmissionConfigs: FormSubmissionConfig[],
    studentId: number,
  ): Promise<void> {
    const [referencedConfig] = formSubmissionConfigs;
    if (referencedConfig.formCategory !== FormCategory.StudentAppeal) {
      // Form validator application only for appeals.
      return;
    }
    if (!referencedConfig.applicationId) {
      throw new CustomNamedError(
        "Application ID is required for student appeals.",
        APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
      );
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
