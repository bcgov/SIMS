import { faker } from "@faker-js/faker";
import { ProgramIntensity, FormYesNoOptions } from "@sims/sims-db";
import { OTHER_REGULATORY_BODY } from "../../../../services/education-program/constants";
import {
  ProgramDeliveryTypeValues,
  ProgramCourseLoadCalculationTypes,
  ProgramESLPercentage,
} from "../../../../services/education-program/education-program.service.models";
import { CreateEducationProgramAPIInDTO } from "../../models/education-program.dto";

/**
 * Returns a payload with the passed sabcCode.
 * @param options options to customize the payload
 * - `sabcCode` SABC code.
 */
export function getCreationPayload(
  programConfigurationId: number,
  options?: {
    appendedProgramData?: { [key: string]: unknown };
  },
): CreateEducationProgramAPIInDTO {
  return {
    programConfigurationId,
    programData: getProgramDataPayload(options),
  };
}

export function getProgramDataPayload(options?: {
  appendedProgramData?: { [key: string]: unknown };
}): {
  [key: string]: unknown;
} {
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
      "minHighSchool",
      "hasMinimumAge",
      "requirementsByInstitution",
      "requirementsByBCITA",
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
