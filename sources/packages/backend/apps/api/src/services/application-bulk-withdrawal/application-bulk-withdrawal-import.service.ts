import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ApplicationBulkWithdrawalHeader,
  ApplicationWithdrawalTextValidationResult,
} from "./application-bulk-withdrawal-import-text.models";
import { DataSource, In, Repository } from "typeorm";
import { Application } from "@sims/sims-db";
import {
  ApplicationBulkWithdrawalImportBusinessValidationModel,
  ApplicationData,
} from "./application-bulk-withdrawal-import-business-validation.models";
import { InjectRepository } from "@nestjs/typeorm";

type ApplicationSINDataMap = Record<string, ApplicationData>;
/**
 * Handles the application withdrawal bulk insert preparation.
 */
@Injectable()
export class ApplicationBulkWithdrawalImportService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Generates the application bulk withdrawal business validation model.
   * @param textValidations text validation models to be converted to the business validation models.
   * @param textHeader text header model.
   * @param institutionId institution id.
   * @param allowedLocationIds set of allowed location ids for the given institution.
   * @returns application bulk withdrawal business models to be validated and persisted.
   */
  async generateApplicationBulkWithdrawalValidationModels(
    textValidations: ApplicationWithdrawalTextValidationResult[],
    textHeader: ApplicationBulkWithdrawalHeader,
    institutionId: number,
    allowedLocationIds: number[],
  ): Promise<ApplicationBulkWithdrawalImportBusinessValidationModel[]> {
    const applicationSINDataMap: ApplicationSINDataMap = {};
    const applicationNumbers = textValidations.map(
      (textValidation) => textValidation.textModel.applicationNumber,
    );
    const applicationSINData =
      await this.getApplicationBulkWithdrawalValidationDetails(
        applicationNumbers,
        institutionId,
      );
    applicationSINData.forEach((record) => {
      applicationSINDataMap[record.applicationNumber] = {
        applicationStatus: record.applicationStatus,
        isArchived: record.isArchived,
        sin: record.student.sinValidation.sin,
        locationId: record.location.id,
        locationCode: record.location.institutionCode,
        hasPreviouslyBeenWithdrawn: !!record.studentScholasticStandings.length,
      };
    });
    const businessValidationModels: ApplicationBulkWithdrawalImportBusinessValidationModel[] =
      [];
    textValidations.forEach((textValidation) => {
      const businessValidationModel =
        {} as ApplicationBulkWithdrawalImportBusinessValidationModel;
      const applicationData =
        applicationSINDataMap[textValidation.textModel.applicationNumber];
      if (applicationData) {
        businessValidationModel.applicationFound = true;
        businessValidationModel.applicationBelongsToInstitution =
          allowedLocationIds.includes(applicationData.locationId);
        businessValidationModel.studentSINMatch =
          textValidation.textModel.sin === applicationData.sin;
        businessValidationModel.hasCorrectInstitutionCode =
          textHeader.originator === applicationData.locationCode;
        businessValidationModel.isArchived = applicationData.isArchived;
        businessValidationModel.applicationStatus =
          applicationData.applicationStatus;
        businessValidationModel.hasPreviouslyBeenWithdrawn =
          applicationData.hasPreviouslyBeenWithdrawn;
        businessValidationModel.isRecordMatch =
          businessValidationModel.applicationBelongsToInstitution &&
          businessValidationModel.studentSINMatch;
      } else {
        businessValidationModel.applicationFound = false;
      }
      businessValidationModel.recordType = textValidation.textModel.recordType;
      businessValidationModel.sin = textValidation.textModel.sin;
      businessValidationModel.applicationNumber =
        textValidation.textModel.applicationNumber;
      businessValidationModel.withdrawalDate =
        textValidation.textModel.withdrawalDate;
      businessValidationModels.push(businessValidationModel);
    });
    return businessValidationModels;
  }

  /**
   * Get the SIN and location information for each of the provided applications.
   * @param applicationNumbers application numbers for which the SIN and location information needs to be retrieved.
   * @param institutionId institution id.
   * @returns applications containing the required information.
   */
  private async getApplicationBulkWithdrawalValidationDetails(
    applicationNumbers: string[],
    institutionId: number,
  ): Promise<Application[]> {
    return this.applicationRepo.find({
      select: {
        id: true,
        applicationNumber: true,
        isArchived: true,
        applicationStatus: true,
        location: { id: true, institutionCode: true },
        student: { id: true, sinValidation: { sin: true } },
        studentScholasticStandings: { id: true },
      },
      relations: {
        location: true,
        student: { sinValidation: true },
        studentScholasticStandings: true,
      },
      where: {
        applicationNumber: In(applicationNumbers),
        location: { institution: { id: institutionId } },
      },
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
