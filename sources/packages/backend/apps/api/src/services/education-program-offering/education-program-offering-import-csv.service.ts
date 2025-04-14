import { Injectable } from "@nestjs/common";
import { EducationProgram, OfferingTypes } from "@sims/sims-db";
import { EducationProgramService, InstitutionLocationService } from "..";
import {
  OfferingValidationModel,
  OfferingYesNoOptions,
} from "./education-program-offering-validation.models";
import {
  CSVHeaders,
  OfferingCSVModel,
  OfferingCSVValidationResult,
  STUDY_BREAK_INDEX_PLACE_HOLDER,
  YesNoOptions,
} from "./education-program-offering-import-csv.models";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { flattenErrorMessages } from "../../utilities/class-validation";
import { parse } from "papaparse";
import { CustomNamedError } from "@sims/utilities";
import { OFFERING_VALIDATION_CSV_PARSE_ERROR } from "../../constants";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";

interface LocationDetails {
  id: number;
  name: string;
  operatingName: string;
  legalOperatingName: string;
  primaryEmail: string;
}
const MAX_STUDY_BREAKS_ENTRIES = 5;
type InstitutionCodeToIdMap = Record<string, LocationDetails>;
type ProgramCodeToProgramMap = Record<string, EducationProgram>;

/**
 * Handles the offering bulk insert preparation using a CSV content.
 */
@Injectable()
export class EducationProgramOfferingImportCSVService {
  constructor(
    private readonly institutionLocationService: InstitutionLocationService,
    private readonly educationProgramService: EducationProgramService,
  ) {}

  /**
   * Generates the offering save model from the CSV content, including
   * any additional information like the program information and location
   * information needed to execute the complete offering validation.
   * @param institutionId institution id that will receive the offerings.
   * @param csvModels CSV models to be converted to the offering models.
   * @returns offering models to be validated and persisted.
   */
  async generateOfferingValidationModelFromCSVModels(
    institutionId: number,
    csvModels: OfferingCSVModel[],
  ): Promise<OfferingValidationModel[]> {
    // Locations and programs information to be associated with the offering models.
    const [locationsMap, programsMap] = await Promise.all([
      this.getLocationsMaps(institutionId),
      this.getProgramsMaps(institutionId, csvModels),
    ]);
    return csvModels.map((csvModel) => ({
      offeringName: csvModel.offeringName,
      yearOfStudy: csvModel.yearOfStudy,
      offeringIntensity: csvModel.offeringIntensity,
      offeringDelivered: csvModel.offeringDelivered,
      hasOfferingWILComponent:
        csvModel.WILComponent === YesNoOptions.Yes
          ? OfferingYesNoOptions.Yes
          : OfferingYesNoOptions.No,
      offeringWILComponentType: csvModel.WILComponentType,
      studyStartDate: csvModel.studyStartDate,
      studyEndDate: csvModel.studyEndDate,
      lacksStudyBreaks: csvModel.hasStudyBreaks === YesNoOptions.No,
      studyBreaks:
        csvModel.hasStudyBreaks === YesNoOptions.Yes
          ? csvModel.studyBreaks
          : null,
      actualTuitionCosts: csvModel.actualTuitionCosts,
      programRelatedCosts: csvModel.programRelatedCosts,
      mandatoryFees: csvModel.mandatoryFees,
      exceptionalExpenses: csvModel.exceptionalExpenses,
      offeringType:
        csvModel.publicOffering === YesNoOptions.Yes
          ? OfferingTypes.Public
          : OfferingTypes.Private,
      offeringDeclaration: csvModel.consent === YesNoOptions.Yes,
      courseLoad: csvModel.courseLoad,
      locationId: locationsMap[csvModel.institutionLocationCode]?.id,
      locationName: locationsMap[csvModel.institutionLocationCode]?.name,
      operatingName:
        locationsMap[csvModel.institutionLocationCode]?.operatingName,
      legalOperatingName:
        locationsMap[csvModel.institutionLocationCode]?.legalOperatingName,
      primaryEmail:
        locationsMap[csvModel.institutionLocationCode]?.primaryEmail,
      programContext: programsMap[csvModel.sabcProgramCode],
    }));
  }

  /**
   * Get a list of all institution locations indexed by the institution code.
   * @param institutionId institution to have all the locations retrieved.
   * @returns list of all institution locations indexed by the institution code.
   */
  private async getLocationsMaps(
    institutionId: number,
  ): Promise<InstitutionCodeToIdMap> {
    const locations = await this.institutionLocationService.getLocationDetails(
      institutionId,
    );
    const institutionMap: InstitutionCodeToIdMap = {};
    locations.forEach((location) => {
      if (location.institutionCode) {
        institutionMap[location.institutionCode] = {
          id: location.id,
          name: location.name,
          operatingName: location.institution.operatingName,
          legalOperatingName: location.institution.legalOperatingName,
          primaryEmail: location.institution.primaryEmail,
        };
      }
    });
    return institutionMap;
  }

  /**
   * Get a list of all the education programs presents in the CSV content
   * indexed by the SABC code.
   * @param institutionId institution to have all the programs retrieved.
   * @param csvModels list to extract the SABC codes.
   * @returns list of all the education programs presents in the CSV content
   * indexed by the SABC code.
   */
  private async getProgramsMaps(
    institutionId: number,
    csvModels: OfferingCSVModel[],
  ): Promise<ProgramCodeToProgramMap> {
    const distinctProgramCodes = csvModels
      .filter((model) => !!model.sabcProgramCode) // Remove empty items.
      .map((model) => model.sabcProgramCode) // Select the program codes.
      .filter((value, index, codes) => codes.indexOf(value) === index); // Remove duplicated values.
    const programs = await this.educationProgramService.getProgramsBySABCCodes(
      institutionId,
      distinctProgramCodes,
    );
    const programMap: ProgramCodeToProgramMap = {};
    programs.forEach((program) => {
      if (program.sabcCode) {
        programMap[program.sabcCode] = program;
      }
    });
    return programMap;
  }

  /**
   * Reads a CSV content and generate a CSV object model for each line.
   * @param csvContent CSV content to generate the models.
   * @returns CSV object models.
   */
  readCSV(csvContent: string): OfferingCSVModel[] {
    const offeringModels: OfferingCSVModel[] = [];
    const parsedResult = parse(csvContent, {
      header: true,
      skipEmptyLines: "greedy",
    });
    if (parsedResult.errors.length) {
      this.logger.error(
        `The offering CSV parse resulted in some errors. ${JSON.stringify(
          parsedResult.errors,
        )}`,
      );
      throw new CustomNamedError(
        "The offering CSV parse resulted in some errors. Please check the CSV content.",
        OFFERING_VALIDATION_CSV_PARSE_ERROR,
      );
    }
    if (!parsedResult.data.length) {
      throw new CustomNamedError(
        "No records were found to be parsed. Please check the CSV content.",
        OFFERING_VALIDATION_CSV_PARSE_ERROR,
      );
    }
    parsedResult.data.forEach((line) => {
      const offeringModel = {} as OfferingCSVModel;
      offeringModels.push(offeringModel);
      offeringModel.institutionLocationCode = line[CSVHeaders.locationCode];
      offeringModel.sabcProgramCode = line[CSVHeaders.sabcProgramCode];
      offeringModel.offeringName = line[CSVHeaders.offeringName]?.trim();
      offeringModel.yearOfStudy = line[CSVHeaders.yearOfStudy];
      offeringModel.showYearOfStudy = line[CSVHeaders.showYearOfStudy];
      offeringModel.offeringIntensity = line[CSVHeaders.offeringIntensity];
      offeringModel.courseLoad = line[CSVHeaders.courseLoad];
      offeringModel.courseLoad = line[CSVHeaders.courseLoad];
      offeringModel.offeringDelivered = line[CSVHeaders.deliveredType];
      offeringModel.WILComponent = line[CSVHeaders.wilComponent];
      offeringModel.WILComponentType =
        line[CSVHeaders.wilComponentType]?.trim();
      offeringModel.studyStartDate = line[CSVHeaders.studyStartDate];
      offeringModel.studyEndDate = line[CSVHeaders.studyEndDate];
      offeringModel.hasStudyBreaks = line[CSVHeaders.hasStudyBreaks];
      offeringModel.actualTuitionCosts = line[CSVHeaders.actualTuitionCosts];
      offeringModel.programRelatedCosts = line[CSVHeaders.programRelatedCosts];
      offeringModel.mandatoryFees = line[CSVHeaders.mandatoryFees];
      offeringModel.exceptionalExpenses = line[CSVHeaders.exceptionalExpenses];
      offeringModel.publicOffering = line[CSVHeaders.publicOffering];
      offeringModel.consent = line[CSVHeaders.consent];
      offeringModel.studyBreaks = [];
      for (let i = 1; i <= MAX_STUDY_BREAKS_ENTRIES; i++) {
        const breakStartDateHeader = CSVHeaders.studyBreakStartDate.replace(
          STUDY_BREAK_INDEX_PLACE_HOLDER,
          i.toString(),
        );
        const breakEndDateHeader = CSVHeaders.studyBreakEndDate.replace(
          STUDY_BREAK_INDEX_PLACE_HOLDER,
          i.toString(),
        );
        const breakStartDate = line[breakStartDateHeader];
        const breakEndDate = line[breakEndDateHeader];
        if (!!breakStartDate && !!breakEndDate) {
          offeringModel.studyBreaks.push({ breakStartDate, breakEndDate });
        }
      }
    });
    return offeringModels;
  }

  /**
   * Performs the CSV object model validation and return a result for each model.
   * @param csvModels CSV model to be validate.
   * @returns validation result for each model.
   */
  validateCSVModels(
    csvModels: OfferingCSVModel[],
  ): OfferingCSVValidationResult[] {
    return csvModels.map((csvModel, index) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const offeringCSVModel = plainToClass(OfferingCSVModel, csvModel, {
        enableImplicitConversion: true,
      });
      const errors = validateSync(offeringCSVModel);
      const flattenedErrors = flattenErrorMessages(errors);
      return {
        index,
        csvModel: offeringCSVModel,
        errors: flattenedErrors,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
