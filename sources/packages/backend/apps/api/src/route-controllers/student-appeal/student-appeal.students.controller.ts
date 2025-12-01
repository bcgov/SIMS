import {
  Controller,
  Param,
  Post,
  Body,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  Get,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApplicationService,
  FormNames,
  FormService,
  StudentAppealService,
} from "../../services";
import {
  EligibleApplicationsForAppealAPIOutDTO,
  StudentApplicationAppealAPIInDTO,
  StudentAppealAPIOutDTO,
  StudentAppealRequestAPIOutDTO,
  StudentAppealAPIInDTO,
  StudentAppealSummaryAPIOutDTO,
  AppealSummaryAPIOutDTO,
} from "./models/student-appeal.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { StudentUserToken } from "../../auth/userToken.interface";
import {
  ApiTags,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  ClientTypeBaseRoute,
  ApiProcessError,
  DryRunSubmissionResult,
} from "../../types";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_HAS_PENDING_APPEAL,
  APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
  STUDENT_HAS_PENDING_APPEAL,
} from "../../constants";
import { StudentAppealRequestModel } from "../../services/student-appeal/student-appeal.model";
import { StudentAppealControllerService } from "./student-appeal.controller.service";
import {
  allowApplicationChangeRequest,
  getSupportingUserParents,
} from "../../utilities";
import { StudentAppealStatus } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.Student}-appeal`)
export class StudentAppealStudentsController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly studentAppealControllerService: StudentAppealControllerService,
  ) {
    super();
  }

  /**
   * Get the summary of all the appeals submitted by the student.
   * @returns summary of student appeals.
   */
  @Get()
  async getStudentAppealSummary(
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentAppealSummaryAPIOutDTO> {
    const studentAppeals =
      await this.studentAppealService.getAppealsByStudentId(
        userToken.studentId,
      );
    const appeals = studentAppeals.map<AppealSummaryAPIOutDTO>((appeal) => {
      // Using the first appeal request to get the assessed details of the appeal.
      const [firstAppealRequest] = appeal.appealRequests;
      return {
        id: appeal.id,
        appealStatus: this.studentAppealControllerService.getAppealStatus(
          appeal.appealRequests,
        ),
        appealRequests: appeal.appealRequests.map((appealRequest) => ({
          submittedFormName: appealRequest.submittedFormName,
          appealStatus: appealRequest.appealStatus,
        })),
        applicationId: appeal.application?.id,
        applicationNumber: appeal.application?.applicationNumber,
        assessedDate: firstAppealRequest.assessedDate,
        submittedDate: appeal.submittedDate,
      };
    });
    return { appeals };
  }

  /**
   * Submit a student appeal associated with an application.
   * @param applicationId application for which the appeal is submitted.
   * @param payload student appeal with appeal requests.
   */
  @ApiNotFoundResponse({
    description:
      "Application either not found or not eligible to submit change request/appeal.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Only one change request/appeal can be submitted at a time for each application. " +
      "When your current request is approved or denied by StudentAid BC, you will be able to submit a new one or " +
      "one or more forms submitted are not valid for appeal submission or " +
      "the application is not eligible to submit an appeal or " +
      "the application is no longer eligible to submit change request/appeal.",
  })
  @ApiBadRequestResponse({
    description:
      "Not able to submit change request/appeal due to invalid request.",
  })
  @Post("application/:applicationId")
  async submitApplicationAppeal(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: StudentApplicationAppealAPIInDTO,
    @UserToken() userToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const application =
      await this.applicationService.getApplicationToRequestAppeal(
        applicationId,
        userToken.userId,
      );
    if (!application) {
      throw new NotFoundException(
        "Given application either does not exist or is not complete to submit change request or appeal.",
      );
    }

    // Check if the submission is for new appeal process(appeal process is for submissions from 2025-26 program year).
    const isProgramYearForNewProcess = allowApplicationChangeRequest(
      application.programYear,
    );
    // If the submission is for new appeal process, then set the operation name as appeal.
    // Otherwise, set it to change request.
    const operation = isProgramYearForNewProcess ? "appeal" : "change request";

    if (application.isArchived) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          `This application is no longer eligible to submit ${operation}.`,
          APPLICATION_CHANGE_NOT_ELIGIBLE,
        ),
      );
    }

    if (operation === "appeal") {
      // Ensures the appeals are validated based on the eligibility criteria used for fetching the
      // eligible applications for appeal using getEligibleApplicationsForAppeal endpoint.
      const eligibleApplicationsForAppeal =
        await this.studentAppealService.getEligibleApplicationsForAppeal(
          userToken.studentId,
          { applicationId },
        );
      if (!eligibleApplicationsForAppeal.length) {
        throw new UnprocessableEntityException(
          new ApiProcessError(
            "The application is not eligible to submit an appeal.",
            APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
          ),
        );
      }
    }

    // Validate the submitted form names for the operation.
    this.studentAppealControllerService.validateSubmittedFormNames(
      operation,
      payload.studentAppealRequests.map((request) => request.formName),
    );

    const existingApplicationAppeal = await this.studentAppealService.hasAppeal(
      userToken.studentId,
      {
        applicationId,
        appealStatus: StudentAppealStatus.Pending,
      },
    );
    if (existingApplicationAppeal) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          `Only one ${operation} can be submitted at a time for each application. When your current request is approved or denied by StudentAid BC, you will be able to submit a new one.`,
          APPLICATION_HAS_PENDING_APPEAL,
        ),
      );
    }
    let dryRunSubmissionResults: DryRunSubmissionResult[] = [];
    const parents = getSupportingUserParents(application.supportingUsers);
    const hasStepParentWaiverAppealSubmission =
      payload.studentAppealRequests.some(
        (appealRequest) =>
          appealRequest.formName === FormNames.StepParentWaiverAppeal,
      );
    // Validate the number of parents for step parent waiver appeal.
    if (hasStepParentWaiverAppealSubmission && parents.length < 2) {
      throw new UnprocessableEntityException(
        "Step parent waiver appeal can only be submitted for applications reported with both parents.",
      );
    }
    try {
      const dryRunPromise: Promise<DryRunSubmissionResult>[] =
        payload.studentAppealRequests.map((appeal) => {
          // Check if the form has any inputs which is required to be populated at the server side
          // during the dry run submission.
          if (appeal.formData.programYear) {
            appeal.formData.programYear = application.programYear.programYear;
          }
          if (appeal.formData.parents) {
            appeal.formData.parents = parents;
          }
          return this.formService.dryRunSubmission(
            appeal.formName,
            appeal.formData,
          );
        });
      dryRunSubmissionResults = await Promise.all(dryRunPromise);
    } catch (error: unknown) {
      throw new Error("Dry run submission failed due to unknown reason.", {
        cause: error,
      });
    }
    const invalidRequest = dryRunSubmissionResults.some(
      (result) => !result.valid,
    );
    if (invalidRequest) {
      throw new BadRequestException(
        `Not able to submit ${operation} due to invalid request.`,
      );
    }

    // Generate the data to be persisted based on the result of the dry run submission.
    const appealRequests = dryRunSubmissionResults.map(
      (result) =>
        ({
          formName: result.formName,
          formData: result.data.data,
          files: payload.studentAppealRequests.find(
            (studentAppeal) => studentAppeal.formName === result.formName,
          ).files,
        }) as StudentAppealRequestModel,
    );

    const studentAppeal = await this.studentAppealService.saveStudentAppeals(
      userToken.studentId,
      appealRequests,
      userToken.userId,
      applicationId,
    );

    return {
      id: studentAppeal.id,
    };
  }

  /**
   * Submit a student appeal, not associated with an application.
   * Only one type of appeal is allowed to be submitted.
   * @param payload student appeal request.
   * @return primary identifier of the submitted student appeal.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Only one appeal of the same type can be submitted at a time. When your current" +
      " request is approved or denied by StudentAid BC, you will be able to submit a new one.",
  })
  @ApiBadRequestResponse({
    description:
      "Not able to submit the student appeal due to an invalid request.",
  })
  @Post()
  async submitStudentAppeal(
    @Body() payload: StudentAppealAPIInDTO,
    @UserToken() userToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const hasPendingAppeal = await this.studentAppealService.hasAppeal(
      userToken.studentId,
      {
        appealFormName: payload.formName,
        appealStatus: StudentAppealStatus.Pending,
        isStudentOnlyAppeal: true,
      },
    );
    if (hasPendingAppeal) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Only one student appeal of the same type can be submitted at a time. When your current request is approved or denied by StudentAid BC, you will be able to submit a new one.",
          STUDENT_HAS_PENDING_APPEAL,
        ),
      );
    }
    // Dry run submission to validate the form data.
    const submissionResult = await this.formService.dryRunSubmission(
      payload.formName,
      payload.formData,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to submit the student appeal due to an invalid request.",
      );
    }
    // Generate the data to be persisted based on the result of the dry run submission.
    const appealRequest: StudentAppealRequestModel = {
      formName: payload.formName,
      formData: submissionResult.data.data,
      files: payload.files,
    };
    // Save the student appeal.
    const studentAppeal = await this.studentAppealService.saveStudentAppeals(
      userToken.studentId,
      [appealRequest],
      userToken.userId,
    );
    return {
      id: studentAppeal.id,
    };
  }

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal id to be retrieved.
   * @returns the student appeal and its requests.
   */
  @Get(":appealId/requests")
  @ApiNotFoundResponse({
    description: "Not able to find the student appeal.",
  })
  async getStudentAppealWithRequests(
    @Param("appealId", ParseIntPipe) appealId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentAppealAPIOutDTO<StudentAppealRequestAPIOutDTO>> {
    return this.studentAppealControllerService.getStudentAppealWithRequests<StudentAppealRequestAPIOutDTO>(
      appealId,
      { studentId: userToken.studentId },
    );
  }

  /**
   * Get applications that are eligible to have an appeal submitted.
   * @returns applications that are eligible to have an appeal submitted.
   */
  @Get("eligible-applications")
  async getEligibleApplicationsForAppeal(
    @UserToken() userToken: StudentUserToken,
  ): Promise<EligibleApplicationsForAppealAPIOutDTO> {
    const eligibleApplications =
      await this.studentAppealService.getEligibleApplicationsForAppeal(
        userToken.studentId,
      );
    return {
      applications: eligibleApplications.map((application) => ({
        id: application.id,
        applicationNumber: application.applicationNumber,
      })),
    };
  }
}
