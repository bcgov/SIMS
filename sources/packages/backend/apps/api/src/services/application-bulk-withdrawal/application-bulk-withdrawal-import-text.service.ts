import { Injectable } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { flattenErrorMessages } from "../../utilities/class-validation";
import { LoggerService } from "@sims/utilities/logger";
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
import {
  ApplicationBulkWithdrawalValidationModel,
  ApplicationData,
  BulkWithdrawalFileData,
} from "./application-bulk-withdrawal-validation.models";
import {
  Application,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

type ApplicationDataMap = Record<string, ApplicationData>;

/**
 * Handles the application withdrawal bulk insert preparation.
 */
@Injectable()
export class ApplicationWithdrawalImportTextService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Reads a text content and generate a text object model for each line.
   * @param textContent text content to generate the models.
   * @returns text object models.
   */
  readText(textContent: string): BulkWithdrawalFileData {
    const applicationWithdrawalModels: ApplicationWithdrawalImportTextModel[] =
      [];
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
    return { header, records: applicationWithdrawalModels };
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

  /**
   * Generates the application bulk withdrawal validation model.
   * @param textValidations text validation models to be converted to the validation models.
   * @param institutionCode institution code that is sent in the file.
   * @param institutionId institution id.
   * @returns application bulk withdrawal models to be validated and persisted.
   */
  async generateValidationModels(
    textValidations: ApplicationWithdrawalTextValidationResult[],
    institutionCode: string,
    institutionId: number,
  ): Promise<ApplicationBulkWithdrawalValidationModel[]> {
    const applicationDataMap: ApplicationDataMap = {};
    const applicationNumbers = textValidations.map(
      (textValidation) => textValidation.textModel.applicationNumber,
    );
    const applicationValidationData = await this.getApplicationValidationData(
      applicationNumbers,
      institutionId,
      institutionCode,
    );
    applicationValidationData.forEach((record) => {
      applicationDataMap[record.applicationNumber] = {
        applicationStatus: record.applicationStatus,
        isArchived: record.isArchived,
        sin: record.student.sinValidation.sin,
        locationId: record.location.id,
        locationCode: record.location.institutionCode,
        hasPreviouslyBeenWithdrawn: record.studentScholasticStandings?.some(
          (scholasticStanding) =>
            scholasticStanding.changeType ===
            StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
        ),
      };
    });
    return textValidations.map((textValidation) => {
      const validationModel = {} as ApplicationBulkWithdrawalValidationModel;
      const applicationData =
        applicationDataMap[textValidation.textModel.applicationNumber];
      validationModel.sin = textValidation.textModel.sin;
      validationModel.applicationNumber =
        textValidation.textModel.applicationNumber;
      validationModel.withdrawalDate = textValidation.textModel.withdrawalDate;
      validationModel.applicationFound = false;
      if (
        applicationData &&
        textValidation.textModel.sin === applicationData.sin
      ) {
        validationModel.applicationFound = true;
        validationModel.isArchived = applicationData.isArchived;
        validationModel.applicationStatus = applicationData.applicationStatus;
        validationModel.hasPreviouslyBeenWithdrawn =
          applicationData.hasPreviouslyBeenWithdrawn;
      }
      return validationModel;
    });
  }

  /**
   * Get the application validation details for all the applications.
   * @param applicationNumbers application numbers for which the application details need to be retrieved.
   * @param institutionId institution id.
   * @param institutionCode institution code that is sent in the file.
   * @returns applications containing the required information.
   */
  private async getApplicationValidationData(
    applicationNumbers: string[],
    institutionId: number,
    institutionCode: string,
  ): Promise<Application[]> {
    return this.applicationRepo.find({
      select: {
        id: true,
        applicationNumber: true,
        isArchived: true,
        applicationStatus: true,
        location: { id: true, institutionCode: true },
        student: { id: true, sinValidation: { sin: true } },
        studentScholasticStandings: {
          changeType: true,
        },
      },
      relations: {
        location: true,
        student: { sinValidation: true },
        studentScholasticStandings: true,
      },
      where: {
        applicationNumber: In(applicationNumbers),
        location: {
          institutionCode,
          institution: { id: institutionId },
        },
      },
    });
  }
}
