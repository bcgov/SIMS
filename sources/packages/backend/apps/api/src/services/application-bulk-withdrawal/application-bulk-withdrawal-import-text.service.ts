import { Injectable } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { flattenErrorMessages } from "../../utilities/class-validation";
import { removeUTF8BOM } from "../../utilities";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ApplicationBulkWithdrawalData,
  ApplicationBulkWithdrawalFooter,
  ApplicationBulkWithdrawalHeader,
  ApplicationWithdrawalImportTextModel,
  ApplicationWithdrawalTextValidationResult,
  RecordType,
} from "./application-bulk-withdrawal-import-text.models";
import { APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR } from "../../constants";
import { CustomNamedError } from "@sims/utilities";
import { FileData } from "./application-bulk-withdrawal-import-business-validation.models";

/**
 * Handles the application withdrawal bulk insert preparation.
 */
@Injectable()
export class ApplicationWithdrawalImportTextService {
  /**
   * Reads a text content and generate a text object model for each line.
   * @param textContent text content to generate the models.
   * @returns text object models.
   */
  readText(textContent: string): FileData {
    const applicationWithdrawalModels: ApplicationWithdrawalImportTextModel[] =
      [];
    // Remove BOM(Byte order mark), if present.
    textContent = removeUTF8BOM(textContent);
    const fileLines = textContent.split("\n");
    // Read the first line to check if the header code is the expected one.
    const header = ApplicationBulkWithdrawalHeader.createFromLine(
      fileLines.shift(),
    ); // Read and remove header.
    if (
      header.recordType !== RecordType.ApplicationBulkWithdrawalHeaderRecordType
    ) {
      this.logger.error(
        `The application withdrawal text file has an invalid transaction code on header: ${header.recordType}`,
      );
      // If the header is not the expected one, throw an error.
      throw new CustomNamedError(
        "Invalid file header record type.",
        APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
      );
    }
    // Read the last line to check if the footer record type is the expected one and verify the total records.
    const footer = ApplicationBulkWithdrawalFooter.createFromLine(
      fileLines.pop(),
    );
    if (
      footer.recordType !== RecordType.ApplicationBulkWithdrawalFooterRecordType
    ) {
      this.logger.error(
        `The application withdrawal text file has an invalid transaction code on footer: ${footer.recordType}`,
      );
      // If the footer is not the expected one.
      throw new CustomNamedError(
        "Invalid file footer record type.",
        APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
      );
    }
    if (footer.noOfRecords !== fileLines.length) {
      this.logger.error(
        "The number of records in the footer does not match the no of data records",
      );
      // If the footer is not the expected one.
      throw new CustomNamedError(
        "No of records in the footer does not match number of data records.",
        APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
      );
    }
    fileLines.forEach((dataLine) => {
      const applicationWithdrawalImportTextModel =
        {} as ApplicationWithdrawalImportTextModel;
      const data = ApplicationBulkWithdrawalData.createFromLine(dataLine);
      applicationWithdrawalModels.push(applicationWithdrawalImportTextModel);
      applicationWithdrawalImportTextModel.recordType = data.recordType;
      applicationWithdrawalImportTextModel.sin = data.sin;
      applicationWithdrawalImportTextModel.applicationNumber =
        data.applicationNumber;
      applicationWithdrawalImportTextModel.withdrawalDate = data.withdrawalDate;
    });
    return { header, applicationWithdrawalModels };
  }

  /**
   * Performs the text object model validation and return a result for each model.
   * @param textModels text model to be validate.
   * @returns validation result for each model.
   */
  validateTextModels(
    textModels: ApplicationWithdrawalImportTextModel[],
  ): ApplicationWithdrawalTextValidationResult[] {
    return textModels.map((textModel, index) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const applicationWithdrawalImportTextModel = plainToClass(
        ApplicationWithdrawalImportTextModel,
        textModel,
        {
          enableImplicitConversion: true,
        },
      );
      const errors = validateSync(applicationWithdrawalImportTextModel);
      const flattenedErrors = flattenErrorMessages(errors);
      return {
        index,
        textModel: applicationWithdrawalImportTextModel,
        errors: flattenedErrors,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
