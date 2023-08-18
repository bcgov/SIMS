import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import {
  APPLICATION_NOT_FOUND,
  ASSESSMENT_ALREADY_IN_PROGRESS,
  ApplicationWithdrawalImportTextService,
  FormService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  StudentAssessmentService,
  StudentScholasticStandingsService,
} from "../../services";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { CustomNamedError } from "@sims/utilities";
import BaseController from "../BaseController";
import { FormNames } from "../../services/form/constants";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
} from "../../constants";
import {
  ScholasticStandingAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "./models/student-scholastic-standings.dto";
import { ScholasticStandingControllerService } from "./student-scholastic-standings.controller.service";
import { ScholasticStanding } from "../../services/student-scholastic-standings/student-scholastic-standings.model";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  APPLICATION_BULK_WITHDRAWAL_MAX_UPLOAD_PARTS,
  APPLICATION_BULK_WITHDRAWAL_UPLOAD_MAX_FILE_SIZE,
  MAX_UPLOAD_FILES,
  textFileFilter,
  uploadLimits,
} from "../../utilities";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { ApplicationWithdrawalTextModel } from "../../services/application-bulk-withdrawal/application-bulk-withdrawal-text.models";

/**
 * Scholastic standing controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("scholastic-standing")
@ApiTags(`${ClientTypeBaseRoute.Institution}-scholastic-standing`)
export class ScholasticStandingInstitutionsController extends BaseController {
  constructor(
    private readonly formService: FormService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly scholasticStandingControllerService: ScholasticStandingControllerService,
    private readonly applicationWithdrawalImportTextService: ApplicationWithdrawalImportTextService,
  ) {
    super();
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param locationId location id to check whether the requested user and the requested application has the permission to this location.
   * @param applicationId application id.
   * @UserToken institution user token
   * @param payload Scholastic Standing payload.
   */
  @ApiBadRequestResponse({ description: "Invalid form data." })
  @ApiUnprocessableEntityResponse({
    description:
      "Application not found or invalid application or invalid" +
      " application status or another assessment already in progress.",
  })
  @HasLocationAccess("locationId")
  @Post("location/:locationId/application/:applicationId")
  async saveScholasticStanding(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: ScholasticStandingAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    try {
      const submissionResult =
        await this.formService.dryRunSubmission<ScholasticStanding>(
          FormNames.ReportScholasticStandingChange,
          payload.data,
        );

      if (!submissionResult.valid) {
        throw new BadRequestException("Invalid submission.");
      }
      const scholasticStanding =
        await this.studentScholasticStandingsService.processScholasticStanding(
          locationId,
          applicationId,
          userToken.userId,
          submissionResult.data.data,
        );

      // Start assessment.
      if (scholasticStanding.studentAssessment) {
        await this.studentAssessmentService.startAssessment(
          scholasticStanding.studentAssessment.id,
        );
      }
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case ASSESSMENT_ALREADY_IN_PROGRESS:
          case APPLICATION_CHANGE_NOT_ELIGIBLE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }

  /**
   * Get Scholastic Standing submitted details.
   * @UserToken institution user token
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */
  @Get(":scholasticStandingId")
  @ApiNotFoundResponse({
    description: "Scholastic Standing not found.",
  })
  async getScholasticStanding(
    @Param("scholasticStandingId", ParseIntPipe) scholasticStandingId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    return this.scholasticStandingControllerService.getScholasticStanding(
      scholasticStandingId,
      userToken.authorizations.getLocationsIds(),
    );
  }
  /**
   * Process a text file with application to be withdrawn.
   * @param file file content with all information needed to create offerings.
   * @param validationOnly if true, will execute all validations and return the
   * errors and warnings. These validations are the same executed during the
   * final creation process. If not present or false, the file will be processed
   * and the records will be inserted.
   * @returns when successfully executed, the list of all withdrawn application ids.
   * When an error happen it will return all the records (with the error) and
   * also a user friendly description of the errors to be fixed.
   */
  @ApiBadRequestResponse({
    description:
      "Error while parsing text file or " +
      "one or more text data fields received are not in the correct format or " +
      "there are no records to be imported.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Application withdrawal has invalid data or " +
      "some error happen with one or more application withdrawal and the entire process was aborted.",
  })
  @IsInstitutionAdmin()
  @Post("application-bulk-withdrawal")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: uploadLimits(
        MAX_UPLOAD_FILES,
        APPLICATION_BULK_WITHDRAWAL_MAX_UPLOAD_PARTS,
        APPLICATION_BULK_WITHDRAWAL_UPLOAD_MAX_FILE_SIZE,
      ),
      fileFilter: textFileFilter,
    }),
  )
  async bulkWithdrawal(
    @UserToken() userToken: IInstitutionUserToken,
    @UploadedFile() file: Express.Multer.File,
    @Query("validation-only", new DefaultValuePipe(false), ParseBoolPipe)
    validationOnly: boolean,
  ): Promise<PrimaryIdentifierAPIOutDTO[]> {
    // Read the entire file content.
    const fileContent = file.buffer.toString();
    // Convert the file raw content into text models.
    let textModels: ApplicationWithdrawalTextModel[];
    try {
      textModels =
        this.applicationWithdrawalImportTextService.readText(fileContent);
    } catch (error: unknown) {
      let errorMessage = "Error while parsing text file.";
      if (
        error instanceof CustomNamedError &&
        error.name === APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR
      ) {
        errorMessage = error.message;
      }
      throw new BadRequestException(
        new ApiProcessError(
          errorMessage,
          APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
        ),
      );
    }
    // Validate the text models.
    const textValidations =
      this.applicationWithdrawalImportTextService.validateTextModels(
        textModels,
      );
    // Assert successful validation.
    this.scholasticStandingControllerService.assertTextValidationsAreValid(
      textValidations,
    );

    if (validationOnly) {
      // If the endpoint is called only to perform the validation and no error was found
      // return an empty array because no record will be created.
      return [];
    }

    // TODO create a block to do database updates for Application withdrawal.
  }
}
