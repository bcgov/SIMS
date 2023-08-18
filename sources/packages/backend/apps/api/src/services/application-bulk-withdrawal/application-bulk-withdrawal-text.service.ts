import { Injectable } from "@nestjs/common";
import { EducationProgramService, InstitutionLocationService } from "..";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { flattenErrorMessages } from "../../utilities/class-validation";
import { removeUTF8BOM } from "../../utilities";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ApplicationBulkWithdrawalData,
  ApplicationBulkWithdrawalFooter,
  ApplicationBulkWithdrawalHeader,
  ApplicationWithdrawalTextModel,
  ApplicationWithdrawalTextValidationResult,
  RecordType,
} from "./application-bulk-withdrawal-text.models";
import {
  APPLICATION_WITHDRAWAL_INVALID_FOOTER_RECORD_TYPE,
  APPLICATION_WITHDRAWAL_INVALID_HEADER_RECORD_TYPE,
} from "../../constants";
import { CustomNamedError } from "@sims/utilities";

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
        "Invalid file header.",
        APPLICATION_WITHDRAWAL_INVALID_HEADER_RECORD_TYPE,
      );
    }
    //Read the last line to check if the footer record type is the expected one and verify the total records.
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
        "Invalid file footer.",
        APPLICATION_WITHDRAWAL_INVALID_FOOTER_RECORD_TYPE,
      );
    }
    fileLines.forEach((dataLine) => {
      const applicationWithdrawalTextModel =
        {} as ApplicationWithdrawalTextModel;
      const data = ApplicationBulkWithdrawalData.createFromLine(dataLine);
      applicationWithdrawalModels.push(applicationWithdrawalTextModel);
      applicationWithdrawalTextModel.recordType = data.recordType;
      applicationWithdrawalTextModel.sin = data.sin;
      applicationWithdrawalTextModel.applicationNumber = data.applicationNumber;
      applicationWithdrawalTextModel.withdrawalDate = data.withdrawalDate;
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
