import { Injectable } from "@nestjs/common";
import {
  ApplicationBulkWithdrawalHeader,
  ApplicationWithdrawalTextValidationResult,
} from "./application-bulk-withdrawal-import-text.models";
import { In, Repository } from "typeorm";
import { Application } from "@sims/sims-db";
import {
  ApplicationBulkWithdrawalValidationModel,
  ApplicationData,
} from "./application-bulk-withdrawal-validation.models";
import { InjectRepository } from "@nestjs/typeorm";

type ApplicationDataMap = Record<string, ApplicationData>;

/**
 * Handles the application withdrawal bulk insert preparation.
 */
@Injectable()
export class ApplicationBulkWithdrawalImportService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Generates the application bulk withdrawal validation model.
   * @param textValidations text validation models to be converted to the validation models.
   * @param textHeader text header model.
   * @param institutionId institution id.
   * @param allowedLocationIds set of allowed location ids for the given institution.
   * @returns application bulk withdrawal models to be validated and persisted.
   */
  async generateApplicationBulkWithdrawalValidationModels(
    textValidations: ApplicationWithdrawalTextValidationResult[],
    textHeader: ApplicationBulkWithdrawalHeader,
    institutionId: number,
    allowedLocationIds: number[],
  ): Promise<ApplicationBulkWithdrawalValidationModel[]> {
    const applicationDataMap: ApplicationDataMap = {};
    const applicationNumbers = textValidations.map(
      (textValidation) => textValidation.textModel.applicationNumber,
    );
    const applicationData = await this.getApplicationValidationData(
      applicationNumbers,
      institutionId,
    );
    applicationData.forEach((record) => {
      applicationDataMap[record.applicationNumber] = {
        applicationStatus: record.applicationStatus,
        isArchived: record.isArchived,
        sin: record.student.sinValidation.sin,
        locationId: record.location.id,
        locationCode: record.location.institutionCode,
        hasPreviouslyBeenWithdrawn: !!record.studentScholasticStandings.length,
      };
    });
    const validationModels = textValidations.map((textValidation) => {
      const validationModel = {} as ApplicationBulkWithdrawalValidationModel;
      const applicationData =
        applicationDataMap[textValidation.textModel.applicationNumber];
      if (applicationData) {
        validationModel.applicationFound = true;
        validationModel.applicationBelongsToInstitution =
          allowedLocationIds.includes(applicationData.locationId);
        validationModel.studentSINMatch =
          textValidation.textModel.sin === applicationData.sin;
        validationModel.hasCorrectInstitutionCode =
          textHeader.originator === applicationData.locationCode;
        validationModel.isArchived = applicationData.isArchived;
        validationModel.applicationStatus = applicationData.applicationStatus;
        validationModel.hasPreviouslyBeenWithdrawn =
          applicationData.hasPreviouslyBeenWithdrawn;
        validationModel.isRecordMatch =
          validationModel.applicationBelongsToInstitution &&
          validationModel.studentSINMatch;
      } else {
        validationModel.applicationFound = false;
      }
      validationModel.sin = textValidation.textModel.sin;
      validationModel.applicationNumber =
        textValidation.textModel.applicationNumber;
      validationModel.withdrawalDate = textValidation.textModel.withdrawalDate;
      return validationModel;
    });
    return validationModels;
  }

  /**
   * Get the SIN and location information for each of the provided applications.
   * @param applicationNumbers application numbers for which the SIN and location information needs to be retrieved.
   * @param institutionId institution id.
   * @returns applications containing the required information.
   */
  private async getApplicationValidationData(
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
}
