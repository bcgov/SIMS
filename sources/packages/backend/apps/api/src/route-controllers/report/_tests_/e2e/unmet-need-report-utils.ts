import {
  FullTimeAssessment,
  DisbursementValueType,
  ApplicationData,
  Assessment,
  OfferingIntensity,
  WorkflowData,
  Institution,
  InstitutionLocation,
  ProgramYear,
  Application,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import {
  saveFakeStudent,
  saveFakeApplicationDisbursements,
  createFakeDisbursementValue,
  E2EDataSources,
} from "@sims/test-utils";
import { sumAwardAmounts } from "@sims/test-utils/utils";

/**
 * Creates a basic data setup with full-time and part-time applications
 * with disbursements for testing the Unmet Need Report for Ministry
 * and Institutions.
 * @param db data sources.
 * @param options setup options.
 * - `institution`: institution to associate with the applications.
 * - `institutionLocation`: institution location to associate with the applications.
 * - `programYear`: program year to associate with the applications.
 * - `referenceNowDate`: date to use as reference for "now" date in the setup, if not provided
 * current date will be used. Useful when date filtering is required in the tests.
 * @returns created applications.
 */
export async function createApplicationsDataSetup(
  db: E2EDataSources,
  options?: {
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
    programYear?: ProgramYear;
    referenceNowDate?: Date;
  },
): Promise<{
  fullTimeApplication: Application;
  partTimeApplication: Application;
}> {
  const now = options?.referenceNowDate ?? new Date();
  const student = await saveFakeStudent(db.dataSource);
  const fullTimeApplication = await saveFakeApplicationDisbursements(
    db.dataSource,
    {
      student,
      institution: options?.institution,
      institutionLocation: options?.institutionLocation,
      programYear: options?.programYear,
      firstDisbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          10,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          11,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          12,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGF",
          13,
        ),
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 14),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 15),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BGPD", 16),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 17),
        // BCSG should be ignored since it represents the SUM of disbursements.
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          18,
        ),
      ],
    },
    {
      offeringIntensity: OfferingIntensity.fullTime,
      currentAssessmentInitialValues: {
        workflowData: {
          calculatedData: {
            totalEligibleDependents: 2,
            pdppdStatus: false,
          },
        } as WorkflowData,
        assessmentDate: now,
        assessmentData: {
          totalFederalAssessedResources: 10,
          federalAssessmentNeed: 3,
          totalProvincialAssessedResources: 5,
          provincialAssessmentNeed: 11,
          totalAssessedCost: 50,
        } as Assessment,
      },
      applicationData: {
        indigenousStatus: "no",
        citizenship: "canadianCitizen",
        youthInCare: "no",
        dependantstatus: "independant",
      } as ApplicationData,
      offeringInitialValues: {
        studyStartDate: getISODateOnlyString(now),
        studyEndDate: getISODateOnlyString(addDays(30, now)),
      },
    },
  );
  const partTimeApplication = await saveFakeApplicationDisbursements(
    db.dataSource,
    {
      student,
      institution: options?.institution,
      institutionLocation: options?.institutionLocation,
      programYear: options?.programYear,
      firstDisbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          100,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          200,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSPT",
          300,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          400,
        ),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 500),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 600),
        // BCSG should be ignored since it represents the SUM of disbursements.
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          700,
        ),
      ],
      secondDisbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          101,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          201,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSPT",
          301,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          401,
        ),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 501),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 601),
        // BCSG should be ignored since it represents the SUM of disbursements.
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          701,
        ),
      ],
    },
    {
      offeringIntensity: OfferingIntensity.partTime,
      createSecondDisbursement: true,
      currentAssessmentInitialValues: {
        workflowData: {
          calculatedData: {
            totalEligibleDependents: 1,
            pdppdStatus: true,
          },
        } as WorkflowData,
        assessmentDate: new Date(),
        assessmentData: {
          totalFederalAssessedResources: 12,
          federalAssessmentNeed: 34,
          totalProvincialAssessedResources: 56,
          provincialAssessmentNeed: 78,
          totalAssessmentNeed: 910,
        } as Assessment,
      },
      applicationData: {
        indigenousStatus: "yes",
        citizenship: "canadianCitizen",
        youthInCare: "no",
        dependantstatus: "independant",
      } as ApplicationData,
      offeringInitialValues: {
        studyStartDate: getISODateOnlyString(now),
        studyEndDate: getISODateOnlyString(addDays(30, now)),
      },
    },
  );
  return {
    fullTimeApplication,
    partTimeApplication,
  };
}

/**
 * Build Unmet Need Report report data.
 * @param application application to generate the expected report record.
 * @returns report data.
 */
export function buildUnmetNeedReportData(
  application: Application,
): Record<string, string | number> {
  const assessmentData = application.currentAssessment
    .assessmentData as FullTimeAssessment;
  const applicationData = application.currentAssessment.application.data;
  const savedOffering = application.currentAssessment.offering;
  const savedEducationProgram = savedOffering.educationProgram;
  const savedLocation = application.location;
  const savedStudent = application.student;
  const savedUser = savedStudent.user;
  const disbursementValues =
    application.currentAssessment.disbursementSchedules.flatMap(
      (ds) => ds.disbursementValues,
    );
  const unmetNeedReportData = {
    "Student First Name": savedUser.firstName,
    "Student Last Name": savedUser.lastName,
    SIN: savedStudent.sinValidation.sin,
    "Student Number": "",
    "Student Email Address": savedUser.email,
    "Student Phone Number": savedStudent.contactInfo.phone,
    "Institution Location Code": savedLocation.institutionCode,
    "Institution Location Name": savedLocation.name,
    "Application Number": application.applicationNumber,
    "Assessment Date": getISODateOnlyString(
      application.currentAssessment.assessmentDate,
    ),
    "Study Intensity (PT or FT)": savedOffering.offeringIntensity,
    "Profile Disability Status": savedStudent.disabilityStatus,
    "Application Disability Status": application.currentAssessment.workflowData
      .calculatedData.pdppdStatus
      ? "yes"
      : "no",
    "Study Start Date": savedOffering.studyStartDate,
    "Study End Date": savedOffering.studyEndDate,
    "Program Name": savedEducationProgram.name,
    "Program Credential Type": savedEducationProgram.credentialType,
    "CIP Code": savedEducationProgram.cipCode,
    "Program Length": savedEducationProgram.completionYears,
    "SABC Program Code": "",
    "Offering Name": savedOffering.name,
    "Year of Study": savedOffering.yearOfStudy.toString(),
    "Indigenous person status": applicationData.indigenousStatus,
    "Citizenship Status": applicationData.citizenship,
    "Youth in Care Flag": applicationData.youthInCare,
    "Youth in Care beyond age 19": "",
    "Marital Status":
      application.currentAssessment.application.relationshipStatus,
    "Independant/Dependant": applicationData.dependantstatus,
    "Number of Eligible Dependants Total":
      application.currentAssessment.workflowData.calculatedData.totalEligibleDependents.toString(),
    "Federal/Provincial Assessed Costs": (
      assessmentData.totalAssessedCost ?? assessmentData.totalAssessmentNeed
    ).toString(),
    "Federal Assessed Resources":
      assessmentData.totalFederalAssessedResources.toString(),
    "Federal assessed need": assessmentData.federalAssessmentNeed.toString(),
    "Provincial Assessed Resources":
      assessmentData.totalProvincialAssessedResources.toString(),
    "Provincial assessed need":
      assessmentData.provincialAssessmentNeed.toString(),
    "Total assistance": sumAwardAmounts(disbursementValues).toFixed(2),
  };
  const expectedValueCodes = [
    "CSLF",
    "CSGP",
    "CSPT",
    "CSGD",
    "BCAG",
    "SBSD",
    "CSLP",
    "BCSL",
    "CSGF",
    "BGPD",
  ];
  // Ensure all expected value codes are present in the report data, even if the sum is zero.
  for (const valueCode of expectedValueCodes) {
    const key = `Estimated ${valueCode}`;
    const total = sumAwardAmounts(disbursementValues, valueCode);
    unmetNeedReportData[key] = total ? total.toFixed(2) : "";
  }
  return unmetNeedReportData;
}
