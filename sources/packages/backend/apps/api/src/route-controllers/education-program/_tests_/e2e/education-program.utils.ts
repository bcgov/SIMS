import { faker } from "@faker-js/faker";
import { ProgramIntensity, FormYesNoOptions } from "@sims/sims-db";
import { OTHER_REGULATORY_BODY } from "../../../../services/education-program/constants";
import { EducationProgramDynamicData } from "../../../../services/education-program/education-program-save.models";
import {
  ProgramDeliveryTypeValues,
  ProgramCourseLoadCalculationTypes,
  ProgramESLPercentage,
  EntranceRequirementValues,
} from "../../../../services/education-program/education-program.service.models";
import {
  CreateEducationProgramAPIInDTO,
  UpdateEducationProgramAPIInDTO,
} from "../../models/education-program.dto";

export function getPayload(options?: {
  appendedProgramData?: { [key: string]: unknown };
}): UpdateEducationProgramAPIInDTO & {
  programData: EducationProgramDynamicData;
} {
  return {
    programData: getProgramDataPayload(options),
  };
}

export function getCreationPayload(
  programConfigurationId: number,
  options?: {
    appendedProgramData?: { [key: string]: unknown };
  },
): CreateEducationProgramAPIInDTO & {
  programData: EducationProgramDynamicData;
} {
  return {
    programConfigurationId,
    programData: getProgramDataPayload(options),
  };
}

export function getProgramDataPayload(options?: {
  appendedProgramData?: { [key: string]: unknown };
}): EducationProgramDynamicData {
  return {
    programName: faker.lorem.words(5),
    programDescription: faker.lorem.words(5),
    credentialType: "undergraduateCertificate",
    cipCode: "11.1111",
    nocCode: "21740",
    fieldOfStudyCode: 15,
    sabcCode: `${faker.string.alpha({ length: 3, casing: "upper" })}1`,
    institutionProgramCode: faker.string.alpha({
      length: 3,
      casing: "upper",
    }),
    programIntensity: ProgramIntensity.fullTimePartTime,
    programDeliveryTypes: [ProgramDeliveryTypeValues.Onsite],
    completionYears: "12WeeksTo52Weeks",
    courseLoadCalculation: ProgramCourseLoadCalculationTypes.Credit,
    regulatoryBody: OTHER_REGULATORY_BODY,
    otherRegulatoryBody: "Other RB test",
    entranceRequirements: [
      EntranceRequirementValues.MinHighSchool,
      EntranceRequirementValues.HasMinimumAge,
      EntranceRequirementValues.RequirementsByInstitution,
      EntranceRequirementValues.RequirementsByBCITA,
    ],
    isAviationProgram: FormYesNoOptions.No,
    eslEligibility: ProgramESLPercentage.LessThan20,
    hasJointInstitution: FormYesNoOptions.No,
    hasWILComponent: FormYesNoOptions.No,
    hasTravel: FormYesNoOptions.No,
    hasIntlExchange: FormYesNoOptions.No,
    programDeclaration: true,
    ...options?.appendedProgramData,
  };
}
