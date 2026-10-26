import { faker } from "@faker-js/faker";
import { ProgramIntensity, FormYesNoOptions } from "@sims/sims-db";
import { OTHER_REGULATORY_BODY } from "../../../../services/education-program/constants";
import {
  EducationProgramDynamicData,
  EntranceRequirementValues,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
} from "../../../../services";
import {
  CreateEducationProgramAPIInDTO,
  UpdateEducationProgramAPIInDTO,
} from "../../models/education-program.dto";

/**
 * Get the payload for updating an education program.
 * @param options Options to customize the update payload.
 * - `appendedProgramData` Additional program data to append to the payload.
 * @returns The update payload for the education program.
 */
export function getPayload(options?: {
  appendedProgramData?: { [key: string]: unknown };
}): UpdateEducationProgramAPIInDTO & {
  programData: EducationProgramDynamicData;
} {
  return {
    programData: getProgramDataPayload(options),
  };
}

/**
 * Dynamic data required to create an education program.
 * @param programConfigurationId ID of the program configuration for which the education program is being created.
 * @param options Options to customize the creation payload.
 * - `appendedProgramData` Additional program data to append to the payload.
 * @returns The creation payload for the education program.
 */
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

/**
 * Get the dynamic program data payload for creating or updating an education program.
 * @param options Options to customize the program data payload.
 * - `appendedProgramData` Additional program data to append to the payload.
 * @returns The dynamic program data payload for the education program.
 */
function getProgramDataPayload(options?: {
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
