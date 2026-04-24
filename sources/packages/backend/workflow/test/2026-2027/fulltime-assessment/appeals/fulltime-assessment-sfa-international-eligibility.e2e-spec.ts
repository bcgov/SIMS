import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { ProgramLengthOptions } from "../../../models";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
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
        // The following values make some of the SFA awards (BGPD, SBSD, BCSL, CSGF, CSGP, CSLF) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // International private for-profit institutions are not eligible for any of the SFA awards and are eligible for the appeal.
        // The application does not have an approved SFA appeal, so no awards are eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAInternationalEligibilityAppealData: undefined,
      },
      expectedData: {
        assessmentBGPDEligibility: true,
        assessmentSBSDEligibility: true,
        assessmentBCAGEligibility: false,
        assessmentBCSLEligibility: true,
        assessmentCSGFEligibility: true,
        assessmentCSGDEligibility: false,
        assessmentCSGPEligibility: true,
        assessmentCSLFEligibility: true,
        bgpdEligibility: false,
        sbsdEligibility: false,
        bcagEligibility: false,
        bcslEligibility: false,
        csgfEligibility: false,
        csgdEligibility: false,
        csgpEligibility: false,
        cslfEligibility: false,
      },
    },
    {
      inputData: {
        // The following values make specific SFA awards (BGPD, SBSD, BCSL, CSGF, CSGP, CSLF) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // International private for-profit institutions are not eligible for any of the SFA awards and are eligible for the appeal.
        // The application has an approved SFA appeal, so some awards (BGPD, SBSD, BCSL, CSGP, CSLF) are eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAInternationalEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentBGPDEligibility: true,
        assessmentSBSDEligibility: true,
        assessmentBCAGEligibility: false,
        assessmentBCSLEligibility: true,
        assessmentCSGFEligibility: true,
        assessmentCSGDEligibility: false,
        assessmentCSGPEligibility: true,
        assessmentCSLFEligibility: true,
        bgpdEligibility: true,
        sbsdEligibility: true,
        bcagEligibility: false,
        bcslEligibility: true,
        csgfEligibility: false,
        csgdEligibility: false,
        csgpEligibility: true,
        cslfEligibility: true,
      },
    },
    {
      inputData: {
        // The following values make specific SFA awards (BCAG, BCSL, CSLF) eligible at assessment level.
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
        // International private for-profit institutions are not eligible for any of the SFA awards and are eligible for the appeal.
        // The application has an approved SFA appeal, so some awards (BCAG, BCSL, CSLF) are eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAInternationalEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentBGPDEligibility: false,
        assessmentSBSDEligibility: false,
        assessmentBCAGEligibility: true,
        assessmentBCSLEligibility: true,
        assessmentCSGFEligibility: false,
        assessmentCSGDEligibility: true,
        assessmentCSGPEligibility: false,
        assessmentCSLFEligibility: true,
        bgpdEligibility: false,
        sbsdEligibility: false,
        bcagEligibility: true,
        bcslEligibility: true,
        csgfEligibility: false,
        csgdEligibility: true,
        csgpEligibility: false,
        cslfEligibility: true,
      },
    },
  ];
  for (const { inputData, expectedData } of appealScenarios) {
    it(
      `Should evaluate the award eligibility as (${showEligibility("BGPD", expectedData.bgpdEligibility)}, ${showEligibility("SBSD", expectedData.sbsdEligibility)}, ${showEligibility("BCAG", expectedData.bcagEligibility)}, ${showEligibility("BCSL", expectedData.bcslEligibility)}, ${showEligibility("CSGF", expectedData.csgfEligibility)}, ${showEligibility("CSGD", expectedData.csgdEligibility)}, ${showEligibility("CSGP", expectedData.csgpEligibility)}, ${showEligibility("CSLF", expectedData.cslfEligibility)})` +
        ` when the assessment eligibility is (${showEligibility("BGPD", expectedData.assessmentBGPDEligibility)}, ${showEligibility("SBSD", expectedData.assessmentSBSDEligibility)}, ${showEligibility("BCAG", expectedData.assessmentBCAGEligibility)}, ${showEligibility("BCSL", expectedData.assessmentBCSLEligibility)}, ${showEligibility("CSGF", expectedData.assessmentCSGFEligibility)}, ${showEligibility("CSGD", expectedData.assessmentCSGDEligibility)}, ${showEligibility("CSGP", expectedData.assessmentCSGPEligibility)}, ${showEligibility("CSLF", expectedData.assessmentCSLFEligibility)})` +
        " and the institution eligibility is false" +
        ` ${inputData.appealsFTSFAInternationalEligibilityAppealData ? "with" : "without"} an approved SFA international institutions eligibility appeal.`,
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

        // Assert
        // International institutions are not eligible for any funding.
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleBGPD,
        ).toBe(false);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleSBSD,
        ).toBe(false);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleBCAG,
        ).toBe(false);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleBCSL,
        ).toBe(false);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleCSGF,
        ).toBe(false);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleCSGD,
        ).toBe(false);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleCSGP,
        ).toBe(false);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleCSLF,
        ).toBe(false);

        expect(calculatedAssessment.variables.assessmentEligibilityBGPD).toBe(
          expectedData.assessmentBGPDEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
          expectedData.assessmentSBSDEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilityBCAG).toBe(
          expectedData.assessmentBCAGEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilityBCSL).toBe(
          expectedData.assessmentBCSLEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilityCSGF).toBe(
          expectedData.assessmentCSGFEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilityCSGD).toBe(
          expectedData.assessmentCSGDEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilityCSGP).toBe(
          expectedData.assessmentCSGPEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilityCSLF).toBe(
          expectedData.assessmentCSLFEligibility,
        );

        expect(calculatedAssessment.variables.awardEligibilityBGPD).toBe(
          expectedData.bgpdEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(
          expectedData.sbsdEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(
          expectedData.bcagEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilityBCSL).toBe(
          expectedData.bcslEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(
          expectedData.csgfEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(
          expectedData.csgdEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilityCSGP).toBe(
          expectedData.csgpEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilityCSLF).toBe(
          expectedData.cslfEligibility,
        );
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});

function showEligibility(award: string, eligibility: boolean) {
  return `${award}: ${eligibility ? "eligible" : "not eligible"}`;
}
