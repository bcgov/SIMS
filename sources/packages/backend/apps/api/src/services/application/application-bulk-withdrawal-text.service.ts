import { Injectable } from "@nestjs/common";
import { EducationProgramService, InstitutionLocationService } from "..";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { flattenErrorMessages } from "../../utilities/class-validation";
import { parse } from "papaparse";
import { removeUTF8BOM } from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import { APPLICATION_WITHDRAWAL_TEXT_PARSE_ERROR } from "../../constants";
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
    const parsedResult = parse(textContent, {
      header: true,
      skipEmptyLines: "greedy",
    });
    if (parsedResult.errors.length) {
      this.logger.error(
        `The application withdrawal text parse resulted in some errors. ${JSON.stringify(
          parsedResult.errors,
        )}`,
      );
      throw new CustomNamedError(
        "The application withdrawal text parse resulted in some errors. Please check the text content.",
        APPLICATION_WITHDRAWAL_TEXT_PARSE_ERROR,
      );
    }
    if (!parsedResult.data.length) {
      throw new CustomNamedError(
        "No records were found to be parsed. Please check the CSV content.",
        APPLICATION_WITHDRAWAL_TEXT_PARSE_ERROR,
      );
    }
    parsedResult.data.forEach((line) => {
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
