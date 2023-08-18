import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import { ApplicationBaseAPIOutDTO } from "./models/application.dto";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { ApplicationControllerService } from "./application.controller.service";
import { AuthorizedParties, IInstitutionUserToken } from "../../auth";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  APPLICATION_BULK_WITHDRAWAL_MAX_UPLOAD_PARTS,
  APPLICATION_BULK_WITHDRAWAL_UPLOAD_MAX_FILE_SIZE,
  MAX_UPLOAD_FILES,
  textFileFilter,
  uploadLimits,
} from "../../utilities";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { ApplicationWithdrawalTextModel } from "../../services/application/application-bulk-withdrawal-text.models";
import { ApplicationWithdrawalImportTextService } from "../../services/application/application-bulk-withdrawal-text.service";
import { CustomNamedError } from "@sims/utilities";
import { APPLICATION_WITHDRAWAL_TEXT_PARSE_ERROR } from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.Institution}-application`)
export class ApplicationInstitutionsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationControllerService: ApplicationControllerService,
    private readonly applicationWithdrawalImportTextService: ApplicationWithdrawalImportTextService,
  ) {
    super();
  }

  /**
   * API to fetch application details by applicationId.
   * This API will be used by institution users.
   * @param applicationId for the application.
   * @param studentId for the student.
   * @returns Application details.
   */
  @HasStudentDataAccess("studentId")
  @Get("student/:studentId/application/:applicationId")
  async getApplication(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      {
        loadDynamicData: true,
        studentId: studentId,
        institutionId: userToken.authorizations.institutionId,
      },
    );
    application.data =
      await this.applicationControllerService.generateApplicationFormData(
        application.data,
      );
    return this.applicationControllerService.transformToApplicationDTO(
      application,
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
  @Post("bulk-withdrawal")
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
        error.name === APPLICATION_WITHDRAWAL_TEXT_PARSE_ERROR
      ) {
        errorMessage = error.message;
      }
      throw new BadRequestException(
        new ApiProcessError(
          errorMessage,
          APPLICATION_WITHDRAWAL_TEXT_PARSE_ERROR,
        ),
      );
    }
    // Validate the text models.
    const textValidations =
      this.applicationWithdrawalImportTextService.validateTextModels(
        textModels,
      );
    // Assert successful validation.
    this.applicationControllerService.assertTextValidationsAreValid(
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
