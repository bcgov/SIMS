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
  IsBCPublicInstitution,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import {
  APPLICATION_NOT_FOUND,
  ASSESSMENT_ALREADY_IN_PROGRESS,
  ApplicationWithdrawalImportTextService,
  ApplicationBulkWithdrawalImportService,
  ApplicationBulkWithdrawalImportValidationService,
  FormService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  StudentScholasticStandingsService,
} from "../../services";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { CustomNamedError } from "@sims/utilities";
import BaseController from "../BaseController";
import { FormNames } from "../../services/form/constants";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
  APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR,
} from "../../constants";
import {
  ApplicationBulkWithdrawalValidationResultAPIOutDTO,
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
import {
  ApplicationBulkWithdrawalHeader,
  ApplicationWithdrawalImportTextModel,
  ApplicationWithdrawalTextValidationResult,
} from "../../services/application-bulk-withdrawal/application-bulk-withdrawal-import-text.models";
import { FileData } from "../../services/application-bulk-withdrawal/application-bulk-withdrawal-import-business-validation.models";

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
    private readonly scholasticStandingControllerService: ScholasticStandingControllerService,
    private readonly applicationWithdrawalImportTextService: ApplicationWithdrawalImportTextService,
    private readonly applicationWithdrawalImportService: ApplicationBulkWithdrawalImportService,
    private readonly applicationWithdrawalImportValidationService: ApplicationBulkWithdrawalImportValidationService,
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
      await this.studentScholasticStandingsService.processScholasticStanding(
        locationId,
        applicationId,
        userToken.userId,
        submissionResult.data.data,
      );
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
   * Process a text file with applications to be withdrawn.
   * @param file text file content with all information needed to withdraw applications.
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
  @IsBCPublicInstitution()
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
    @UploadedFile() file: Express.Multer.File,
    @Query("validation-only", new DefaultValuePipe(false), ParseBoolPipe)
    validationOnly: boolean,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO[]> {
    // Read the entire file content.
    const fileContent = file.buffer.toString();
    // Get the file data.
    let fileData: FileData;
    try {
      fileData =
        this.applicationWithdrawalImportTextService.readText(fileContent);
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR
      ) {
        // When there is an error in header and footer record, we are transforming it in the validationResult format.
        // This can contain either header or footer error, one at a time.
        const validationResult: ApplicationBulkWithdrawalValidationResultAPIOutDTO =
          {
            errors: [error.message],
            infos: [],
            warnings: [],
          };
        throw new BadRequestException(
          new ApiProcessError(
            error.message,
            APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
            [validationResult],
          ),
        );
      }
      throw error;
    }
    // Validate the text models.
    const textValidations =
      this.applicationWithdrawalImportTextService.validateTextModels(
        fileData.applicationWithdrawalModels,
      );
    // Assert successful validation.
    this.assertTextValidationsAreValid(textValidations);
    const validationModels =
      await this.applicationWithdrawalImportService.generateApplicationBulkWithdrawalValidationModels(
        textValidations,
        fileData.header,
        userToken.authorizations.institutionId,
        userToken.authorizations.adminLocationsIds,
      );
    // Validate all the application bulk withdrawal models.
    const applicationBulkWithdrawalValidations =
      this.applicationWithdrawalImportValidationService.validateApplicationBulkWithdrawalModels(
        validationModels,
        true,
      );
    this.applicationWithdrawalImportValidationService.assertValidationsAreValid(
      applicationBulkWithdrawalValidations,
    );
    if (validationOnly) {
      // If the endpoint is called only to perform the validation and no error was found
      // return an empty array because no record will be created.
      return [];
    }

    // TODO create a block to do database updates for Application withdrawal.
    return [];
  }

  /**
   * Verify if all text file validations were performed with success and throw
   * a BadRequestException in case of some failure.
   * @param textValidations validations to be verified.
   */
  private assertTextValidationsAreValid(
    textValidations: ApplicationWithdrawalTextValidationResult[],
  ) {
    const textValidationsErrors = textValidations.filter(
      (textValidation) => textValidation.errors.length,
    );
    if (textValidationsErrors.length) {
      // At least one error was detected and the text must be fixed.
      const validationResults: ApplicationBulkWithdrawalValidationResultAPIOutDTO[] =
        textValidationsErrors.map((validation) => ({
          recordIndex: validation.index,
          applicationNumber: validation.textModel.applicationNumber,
          withdrawalDate: validation.textModel.withdrawalDate,
          errors: validation.errors,
          infos: [],
          warnings: [],
        }));
      throw new BadRequestException(
        new ApiProcessError(
          "One or more text data fields received are not in the correct format.",
          APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR,
          validationResults,
        ),
      );
    }
  }
}
