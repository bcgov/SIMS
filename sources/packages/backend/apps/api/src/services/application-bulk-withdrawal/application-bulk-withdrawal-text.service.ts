import { Injectable } from "@nestjs/common";
import { EducationProgramService, InstitutionLocationService } from "..";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { flattenErrorMessages } from "../../utilities/class-validation";
import { removeUTF8BOM } from "../../utilities";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ApplicationWithdrawalTextModel,
  ApplicationWithdrawalTextValidationResult,
  TextHeaders,
} from "./application-bulk-withdrawal-text.models";

/**
 * Handles the offering bulk insert preparation using a CSV content.
 */
@Injectable()
export class ApplicationWithdrawalImportTextService {
  constructor(
    private readonly institutionLocationService: InstitutionLocationService,
    private readonly educationProgramService: EducationProgramService,
  ) {}

  /**
   * Reads a text content and generate a text object model for each line.
   * @param textContent text content to generate the models.
   * @returns text object models.
   */
  readText(textContent: string): ApplicationWithdrawalTextModel[] {
    const applicationWithdrawalModels: ApplicationWithdrawalTextModel[] = [];
    // Remove BOM(Byte order mark), if present.
    textContent = removeUTF8BOM(textContent);
    const fileLines = textContent.split("\n");

    fileLines.shift();
    fileLines.pop();
    // Read the first line to check if the header code is the expected one.
    /*const header = new ApplicationBulkWithdrawalHeader(parsedResult.data.shift); // Read and remove header.
    if (
      header.recordType !== ApplicationBulkWithdrawalHeaderRecordType.Header
    ) {
      this.logger.error(
        `The application withdrawal text file has an invalid transaction code on header: ${header.recordType}`,
      );
      // If the header is not the expected one, throw an error.
      throw new Error(
        "Invalid file header.",
        APPLICATION_WITHDRAWAL_INVALID_HEADER_RECORD_TYPE,
      );
    }
    //Read the last line to check if the footer record type is the expected one and verify the total records.
    const footer = new ApplicationBulkWithdrawalFooter(parsedResult.data.pop);
    if (
      footer.recordType !== ApplicationBulkWithdrawalFooterRecordType.Footer
    ) {
      this.logger.error(
        `The application withdrawal text file has an invalid transaction code on footer: ${footer.recordType}`,
      );
      // If the footer is not the expected one.
      throw new CustomNamedError(
        "Invalid file footer.",
        APPLICATION_WITHDRAWAL_INVALID_FOOTER_RECORD_TYPE,
      );
    }*/
    fileLines.forEach((line) => {
      const applicationWithdrawalTextModel =
        {} as ApplicationWithdrawalTextModel;
      applicationWithdrawalModels.push(applicationWithdrawalTextModel);
      applicationWithdrawalTextModel.sin = line[TextHeaders.sin];
      applicationWithdrawalTextModel.applicationNumber =
        line[TextHeaders.applicationNumber];
      applicationWithdrawalTextModel.withdrawalDate =
        line[TextHeaders.withdrawalDate];
    });
    return applicationWithdrawalModels;
  }

  /**
   * Performs the text object model validation and return a result for each model.
   * @param textModels text model to be validate.
   * @returns validation result for each model.
   */
  validateTextModels(
    textModels: ApplicationWithdrawalTextModel[],
  ): ApplicationWithdrawalTextValidationResult[] {
    return textModels.map((textModel, index) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const applicationWithdrawalTextModel = plainToClass(
        ApplicationWithdrawalTextModel,
        textModel,
        {
          enableImplicitConversion: true,
        },
      );
      const errors = validateSync(applicationWithdrawalTextModel);
      const flattenedErrors = flattenErrorMessages(errors);
      return {
        index,
        textModel: applicationWithdrawalTextModel,
        errors: flattenedErrors,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
