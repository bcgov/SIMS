import { Injectable } from "@nestjs/common";
import { ApplicationWithdrawalTextValidationResult } from "./application-bulk-withdrawal-import-text.models";
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
   * @param originator institution that sent the file.
   * @param institutionId institution id.
   * @returns application bulk withdrawal models to be validated and persisted.
   */
  async generateApplicationBulkWithdrawalValidationModels(
    textValidations: ApplicationWithdrawalTextValidationResult[],
    originator: string,
    institutionId: number,
  ): Promise<ApplicationBulkWithdrawalValidationModel[]> {
    const applicationDataMap: ApplicationDataMap = {};
    const applicationNumbers = textValidations.map(
      (textValidation) => textValidation.textModel.applicationNumber,
    );
    const applicationValidationData = await this.getApplicationValidationData(
      applicationNumbers,
      institutionId,
    );
    applicationValidationData.forEach((record) => {
      applicationDataMap[record.applicationNumber] = {
        applicationStatus: record.applicationStatus,
        isArchived: record.isArchived,
        sin: record.student.sinValidation.sin,
        locationId: record.location.id,
        locationCode: record.location.institutionCode,
        hasPreviouslyBeenWithdrawn: !!record.studentScholasticStandings.length,
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
      if (applicationData) {
        validationModel.applicationFound = true;
        validationModel.studentSINMatch =
          textValidation.textModel.sin === applicationData.sin;
        validationModel.hasCorrectInstitutionCode =
          originator === applicationData.locationCode;
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
