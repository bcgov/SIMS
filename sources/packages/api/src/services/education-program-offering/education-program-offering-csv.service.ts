import { Injectable } from "@nestjs/common";
import { EducationProgram, OfferingTypes } from "../../database/entities";
import { parseCSVContent } from "../../utilities/csv/csv-utils";
import { InstitutionLocationService, EducationProgramService } from "..";
import {
  SaveOfferingModel,
  WILComponentOptions,
} from "./education-program-offering-validation.models";
import {
  CSVHeaders,
  OfferingCSVModel,
  OfferingCSVValidationResult,
  STUDY_BREAK_INDEX_PLACE_HOLDER,
  YesNoOptions,
} from "./education-program-offering-csv.models";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { flattenErrorMessages } from "../../utilities/class-validation";

const MAX_STUDY_BREAKS_ENTRIES = 5;
type InstitutionCodeToIdMap = Record<string, number>;
type ProgramCodeToProgramMap = Record<string, EducationProgram>;

@Injectable()
export class EducationProgramOfferingCSVService {
  constructor(
    private readonly institutionLocationService: InstitutionLocationService,
    private readonly educationProgramService: EducationProgramService,
  ) {}

  async generateSaveOfferingModelFromCSVModels(
    institutionId: number,
    csvModels: OfferingCSVModel[],
  ): Promise<SaveOfferingModel[]> {
    const [locationsMap, programsMap] = await Promise.all([
      this.getLocationsMaps(institutionId),
      this.getProgramsMaps(institutionId, csvModels),
    ]);

    return csvModels.map((csvModel) => {
      const offeringModel = {} as SaveOfferingModel;
      offeringModel.offeringName = csvModel.offeringName;
      offeringModel.yearOfStudy = csvModel.yearOfStudy;
      offeringModel.showYearOfStudy =
        csvModel.showYearOfStudy === YesNoOptions.Yes;
      offeringModel.offeringIntensity = csvModel.offeringIntensity;
      offeringModel.offeringDelivered = csvModel.offeringDelivered;
      offeringModel.hasOfferingWILComponent =
        csvModel.WILComponent === YesNoOptions.Yes
          ? WILComponentOptions.Yes
          : WILComponentOptions.No;
      offeringModel.offeringWILComponentType = csvModel.WILComponentType;
      offeringModel.studyStartDate = csvModel.studyStartDate;
      offeringModel.studyEndDate = csvModel.studyEndDate;
      offeringModel.lacksStudyBreaks =
        csvModel.hasStudyBreaks == YesNoOptions.No;
      offeringModel.studyBreaks = csvModel.studyBreaks;
      offeringModel.actualTuitionCosts = csvModel.actualTuitionCosts;
      offeringModel.programRelatedCosts = csvModel.programRelatedCosts;
      offeringModel.mandatoryFees = csvModel.mandatoryFees;
      offeringModel.exceptionalExpenses = csvModel.exceptionalExpenses;
      offeringModel.offeringType =
        csvModel.publicOffering === YesNoOptions.Yes
          ? OfferingTypes.Public
          : OfferingTypes.Private;
      offeringModel.offeringDeclaration = csvModel.consent === YesNoOptions.Yes;
      offeringModel.courseLoad = csvModel.courseLoad;
      offeringModel.locationId = locationsMap[csvModel.institutionLocationCode];
      offeringModel.programContext = programsMap[csvModel.sabcProgramCode];
      return offeringModel;
    });
  }

  private async getLocationsMaps(
    institutionId: number,
  ): Promise<InstitutionCodeToIdMap> {
    const locations = await this.institutionLocationService.getLocations(
      institutionId,
    );
    const institutionMap: InstitutionCodeToIdMap = {};
    locations.forEach((location) => {
      if (location.institutionCode) {
        institutionMap[location.institutionCode] = location.id;
      }
    });
    return institutionMap;
  }

  private async getProgramsMaps(
    institutionId: number,
    bulkInsertModels: OfferingCSVModel[],
  ): Promise<ProgramCodeToProgramMap> {
    const distinctProgramCodes = bulkInsertModels
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

  async readCSV(csvContent: string): Promise<OfferingCSVModel[]> {
    const offeringModels: OfferingCSVModel[] = [];
    const lines = await parseCSVContent(csvContent, { headers: true });
    lines.forEach((line) => {
      const offeringModel = {} as OfferingCSVModel;
      offeringModels.push(offeringModel);
      offeringModel.institutionLocationCode = line[CSVHeaders.LocationCode];
      offeringModel.sabcProgramCode = line[CSVHeaders.SABCProgramCode];
      offeringModel.offeringName = line[CSVHeaders.OfferingName];
      offeringModel.yearOfStudy = line[CSVHeaders.YearOfStudy];
      offeringModel.showYearOfStudy = line[CSVHeaders.ShowYearOfStudy];
      offeringModel.offeringIntensity = line[CSVHeaders.OfferingIntensity];
      offeringModel.courseLoad = line[CSVHeaders.CourseLoad];
      offeringModel.courseLoad = line[CSVHeaders.CourseLoad];
      offeringModel.offeringDelivered = line[CSVHeaders.DeliveredType];
      offeringModel.WILComponent = line[CSVHeaders.WILComponent];
      offeringModel.WILComponentType = line[CSVHeaders.WILComponentType];
      offeringModel.studyStartDate = line[CSVHeaders.StudyStartDate];
      offeringModel.studyEndDate = line[CSVHeaders.StudyEndDate];
      offeringModel.hasStudyBreaks = line[CSVHeaders.HasStudyBreaks];
      offeringModel.actualTuitionCosts = line[CSVHeaders.ActualTuitionCosts];
      offeringModel.programRelatedCosts = line[CSVHeaders.ProgramRelatedCosts];
      offeringModel.mandatoryFees = line[CSVHeaders.MandatoryFees];
      offeringModel.exceptionalExpenses = line[CSVHeaders.ExceptionalExpenses];
      offeringModel.publicOffering = line[CSVHeaders.PublicOffering];
      offeringModel.consent = line[CSVHeaders.Consent];
      offeringModel.studyBreaks = [];
      for (let i = 1; i <= MAX_STUDY_BREAKS_ENTRIES; i++) {
        const breakStartDateHeader = CSVHeaders.StudyBreakStartDate.replace(
          STUDY_BREAK_INDEX_PLACE_HOLDER,
          i.toString(),
        );
        const breakEndDateHeader = CSVHeaders.StudyBreakEndDate.replace(
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
}
