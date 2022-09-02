import { Injectable } from "@nestjs/common";
import { EducationProgram, OfferingTypes } from "../../database/entities";
import { parseCSVContent } from "../../utilities/csv/csv-utils";
import { InstitutionLocationService, EducationProgramService } from "..";
import { SaveOfferingModel } from "./education-program-offering-validation.models";

const MAX_STUDY_BREAKS_ENTRIES = 5;
type InstitutionCodeToIdMap = Record<string, number>;
type ProgramCodeToProgramMap = Record<string, EducationProgram>;
type OfferingBulkInsertModel = Omit<
  SaveOfferingModel,
  "locationId" | "programContext"
> & {
  institutionLocationCode: string;
  sabcProgramCode: string;
};

@Injectable()
export class EducationProgramOfferingBulkInsertService {
  constructor(
    private readonly institutionLocationService: InstitutionLocationService,
    private readonly educationProgramService: EducationProgramService,
  ) {}

  async generateSaveOfferingModelFromCSV(
    institutionId: number,
    csvContent: string,
  ): Promise<SaveOfferingModel[]> {
    const bulkInsertModels = await this.readCSV(csvContent);

    const [locationsMap, programsMap] = await Promise.all([
      this.getLocationsMaps(institutionId),
      this.getProgramsMaps(institutionId, bulkInsertModels),
    ]);

    return bulkInsertModels.map((bulkInsertModel) => {
      const offeringModel = {} as SaveOfferingModel;
      offeringModel.offeringName = bulkInsertModel.offeringName;
      offeringModel.yearOfStudy = bulkInsertModel.yearOfStudy;
      offeringModel.showYearOfStudy = bulkInsertModel.showYearOfStudy;
      offeringModel.offeringIntensity = bulkInsertModel.offeringIntensity;
      offeringModel.offeringDelivered = bulkInsertModel.offeringDelivered;
      offeringModel.hasOfferingWILComponent =
        bulkInsertModel.hasOfferingWILComponent;
      offeringModel.offeringWILComponentType =
        bulkInsertModel.offeringWILComponentType;
      offeringModel.studyStartDate = bulkInsertModel.studyStartDate;
      offeringModel.studyEndDate = bulkInsertModel.studyEndDate;
      offeringModel.lacksStudyBreaks = bulkInsertModel.lacksStudyBreaks;
      offeringModel.studyBreaks = bulkInsertModel.studyBreaks;
      offeringModel.actualTuitionCosts = bulkInsertModel.actualTuitionCosts;
      offeringModel.programRelatedCosts = bulkInsertModel.programRelatedCosts;
      offeringModel.mandatoryFees = bulkInsertModel.mandatoryFees;
      offeringModel.exceptionalExpenses = bulkInsertModel.exceptionalExpenses;
      offeringModel.programDeliveryTypes = bulkInsertModel.programDeliveryTypes;
      offeringModel.offeringType = bulkInsertModel.offeringType;
      offeringModel.offeringDeclaration = bulkInsertModel.offeringDeclaration;
      offeringModel.courseLoad = bulkInsertModel.courseLoad;
      offeringModel.locationId =
        locationsMap[bulkInsertModel.institutionLocationCode];
      offeringModel.programContext =
        programsMap[bulkInsertModel.sabcProgramCode];
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
    bulkInsertModels: OfferingBulkInsertModel[],
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

  private async readCSV(
    csvContent: string,
  ): Promise<OfferingBulkInsertModel[]> {
    const offeringModels: OfferingBulkInsertModel[] = [];
    const lines = await parseCSVContent(csvContent, { headers: true });
    lines.forEach((line) => {
      const offeringModel = {} as OfferingBulkInsertModel;
      offeringModels.push(offeringModel);
      offeringModel.institutionLocationCode = line["Institution Location Code"];
      offeringModel.sabcProgramCode = line["SABC Program Code"];
      offeringModel.offeringName = line["Name"];
      offeringModel.yearOfStudy = line["Year of Study"];
      offeringModel.showYearOfStudy = this.convertYesNoToBool(
        line["Show Year of Study"],
      );
      offeringModel.offeringIntensity = line["Offering Intensity"];
      offeringModel.courseLoad = line["Course Load"];
      offeringModel.offeringDelivered = line["Delivered Type"];
      offeringModel.hasOfferingWILComponent = line["WIL Component"];
      offeringModel.offeringWILComponentType = line["WIL Component Type"];
      offeringModel.studyStartDate = line["Start Date"];
      offeringModel.studyEndDate = line["End Date"];
      offeringModel.lacksStudyBreaks = !this.convertYesNoToBool(
        line["Has Study Breaks"],
      );
      offeringModel.actualTuitionCosts = line["Actual Tuition"];
      offeringModel.programRelatedCosts = line["Program Related Costs"];
      offeringModel.mandatoryFees = line["Mandatory Fees"];
      offeringModel.exceptionalExpenses = line["Exceptional Expenses"];
      offeringModel.offeringType = this.convertYesNoToBool(
        line["Public Offering"],
      )
        ? OfferingTypes.Public
        : OfferingTypes.Private;
      offeringModel.offeringDeclaration = this.convertYesNoToBool(
        line["Consent"],
      );
      offeringModel.studyBreaks = [];
      for (let i = 1; i <= MAX_STUDY_BREAKS_ENTRIES; i++) {
        const breakStartDate = line[`Study Break ${i} - Start Date`];
        const breakEndDate = line[`Study Break ${i} - End Date`];
        if (!!breakStartDate && !!breakEndDate) {
          offeringModel.studyBreaks.push({ breakStartDate, breakEndDate });
        }
      }
    });
    return offeringModels;
  }

  private convertYesNoToBool(yesNoString: string): boolean {
    return yesNoString?.trim().toLowerCase() === "yes";
  }
}
