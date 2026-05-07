import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { ProgramLengthOptions } from "../../../models";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
  getFullTimeEligibilityData,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

import {
  createFakeStudentDependentEligibleForChildcareCost,
  DependentChildCareEligibility,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-sfa-international-eligibility-appeal.`, () => {
  const [programStartYear] = PROGRAM_YEAR.split("-");
  const appealScenarios = [
    {
      inputData: {
        // The following values make some of the SFA funding (BGPD, SBSD, BCAG2Year, BCSL, CSGF, CSGP, CSLF) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        studentDataHasDependents: YesNoOptions.No,
        // International private for-profit institutions are not eligible for any of the SFA funding and are eligible for the appeal.
        // The application does not have an approved SFA appeal, so no awards are eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAInternationalInstitutionsEligibilityAppealData: undefined,
      },
      expectedData: {
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,

        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,

        assessmentEligibilityBCAG: false,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,

        assessmentEligibilityBCAG2Year: true,
        awardEligibilityBCAG2Year: false,

        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: false,

        assessmentEligibilityCSGF: true,
        institutionEligibilityCSGF: false,
        awardEligibilityCSGF: false,

        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: false,
        awardEligibilityCSGD: false,

        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: false,
        awardEligibilityCSGP: false,

        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: false,
        awardEligibilityCSLF: false,
      },
    },
    {
      inputData: {
        // The following values make specific SFA funding (BGPD, SBSD, BCAG2Year, BCSL, CSGF, CSGP, CSLF) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        studentDataHasDependents: YesNoOptions.No,
        // International private for-profit institutions are not eligible for any of the SFA funding and are eligible for the appeal.
        // The application has an approved SFA appeal, so some funding (BGPD, SBSD, BCSL, CSGP, CSLF) is eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAInternationalInstitutionsEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: true,

        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: true,

        assessmentEligibilityBCAG: false,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,

        assessmentEligibilityBCAG2Year: true,
        awardEligibilityBCAG2Year: false,

        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: true,

        assessmentEligibilityCSGF: true,
        institutionEligibilityCSGF: false,
        awardEligibilityCSGF: false,

        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: false,
        awardEligibilityCSGD: false,

        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: false,
        awardEligibilityCSGP: true,

        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: false,
        awardEligibilityCSLF: true,
      },
    },
    {
      inputData: {
        // The following values make specific SFA funding (BCAG, BCSL, CSGD, CSLF) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.No,
        studentDataTaxReturnIncome: 30000,
        programLength: ProgramLengthOptions.FiftyThreeWeeksToFiftyNineWeeks,
        studentDataHasDependents: YesNoOptions.Yes,
        studentDataDependants: [
          createFakeStudentDependentEligibleForChildcareCost(
            DependentChildCareEligibility.Eligible0To11YearsOld,
            `${programStartYear}-08-01`,
          ),
        ],
        // International private for-profit institutions are not eligible for any of the SFA funding and are eligible for the appeal.
        // The application has an approved SFA appeal, so some funding (BCSL, CSGD, CSLF) is eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAInternationalInstitutionsEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentEligibilityBGPD: false,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,

        assessmentEligibilitySBSD: false,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,

        assessmentEligibilityBCAG: true,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,

        assessmentEligibilityBCAG2Year: false,
        awardEligibilityBCAG2Year: false,

        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: true,

        assessmentEligibilityCSGF: false,
        institutionEligibilityCSGF: false,
        awardEligibilityCSGF: false,

        assessmentEligibilityCSGD: true,
        institutionEligibilityCSGD: false,
        awardEligibilityCSGD: true,

        assessmentEligibilityCSGP: false,
        institutionEligibilityCSGP: false,
        awardEligibilityCSGP: false,

        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: false,
        awardEligibilityCSLF: true,
      },
    },
  ];
  for (const { inputData, expectedData } of appealScenarios) {
    it(
      `Should return expected award eligibility outcomes when assessment and institution eligibility rules are applied for a student ` +
        `${inputData.studentDataApplicationPDPPDStatus === YesNoOptions.Yes ? "with" : "without"} PD/PPD and` +
        ` ${inputData.studentDataHasDependents === YesNoOptions.Yes ? "with" : "without"} dependants and` +
        ` ${inputData.appealsFTSFAInternationalInstitutionsEligibilityAppealData ? "with" : "without"} an approved SFA international institutions eligibility appeal.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData = {
          ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
          ...inputData,
        };

        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        const eligibilityData = getFullTimeEligibilityData(
          calculatedAssessment.variables,
        );
        // Assert
        expect(eligibilityData).toEqual(expectedData);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
