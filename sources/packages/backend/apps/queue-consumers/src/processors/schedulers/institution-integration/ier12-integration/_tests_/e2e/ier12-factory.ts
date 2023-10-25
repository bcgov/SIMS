import {
  Application,
  DisbursementSchedule,
  DisbursementValue,
  FullTimeAssessment,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createFakeStudent,
  createFakeUser,
  ensureProgramYearExists,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import { IER12Disbursement, IER12TestInputData } from "./models/data-inputs";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";
import dayjs from "dayjs";

/**
 * Save all IER12 related records providing all data that
 * will be part of the IER12 file generation.
 * @param db data source helper.
 * @param testInputData msfaa test input data.
 * @returns a saved MSFAA record that uses the input test
 * data to be created.
 */
export async function saveIER12TestInputData(
  db: E2EDataSources,
  testInputData: IER12TestInputData,
  options?: {
    programYearPrefix?: number;
  },
): Promise<Application> {
  // If a program year prefix is not provided, create one with the year 2000 as default.
  const programYear = await ensureProgramYearExists(
    db,
    options?.programYearPrefix ?? 2000,
  );

  // User
  const fakeUser = createFakeUser();
  fakeUser.firstName = testInputData.student.firstName;
  fakeUser.lastName = testInputData.student.lastName;
  // Student
  const fakeStudent = createFakeStudent(fakeUser);
  fakeStudent.birthDate = getISODateOnlyString(testInputData.student.birthDate);
  fakeStudent.contactInfo = {
    address: {
      ...testInputData.student.addressInfo,
      country: "canada",
      selectedCountry: "Canada",
    },
    phone: faker.phone.phoneNumber(),
  };
  // SIN validation
  const sinValidation = createFakeSINValidation({ student: fakeStudent });
  sinValidation.sin = testInputData.student.sin;
  // Student
  const student = await saveFakeStudent(db.dataSource, {
    student: fakeStudent,
    sinValidation,
  });
  // Application
  const createSecondDisbursement =
    testInputData.assessment.disbursementSchedules.length === 2;
  const testInputApplication = testInputData.application;
  const application = await saveFakeApplicationDisbursements(
    db.dataSource,
    { student, disbursementValues: [] },
    { createSecondDisbursement },
  );
  application.applicationNumber = testInputApplication.applicationNumber;
  application.studentNumber = testInputApplication.studentNumber;
  application.relationshipStatus = testInputApplication.relationshipStatus;
  application.submittedDate = testInputApplication.submittedDate;
  application.applicationStatus = testInputApplication.applicationStatus;
  application.applicationStatusUpdatedOn =
    testInputApplication.applicationStatusUpdatedOn;
  application.programYear = programYear;
  await db.application.save(application);
  // Assessment.
  const testInputAssessment = testInputData.assessment;
  const assessment = application.currentAssessment;
  assessment.triggerType = testInputAssessment.triggerType;
  assessment.assessmentDate = testInputAssessment.assessmentDate;
  assessment.assessmentData =
    testInputAssessment.assessmentData as FullTimeAssessment;
  assessment.workflowData = testInputAssessment.workflowData;
  // Schedules and awards mapping.
  assessment.disbursementSchedules.forEach((disbursement, index) => {
    mapTestInputToDisbursementAndAwards(
      disbursement,
      testInputAssessment.disbursementSchedules[index],
    );
  });
  await db.studentAssessment.save(assessment);
  // Program
  const testInputProgram = testInputData.educationProgram;
  const programUpdate = {
    name: testInputProgram.name,
    description: testInputProgram.description,
    credentialType: testInputProgram.credentialType,
    fieldOfStudyCode: testInputProgram.fieldOfStudyCode,
    cipCode: testInputProgram.cipCode,
    nocCode: testInputProgram.nocCode,
    sabcCode: testInputProgram.sabcCode,
    institutionProgramCode: testInputProgram.institutionProgramCode,
    completionYears: testInputProgram.completionYears,
  };
  await db.educationProgram.update(
    assessment.offering.educationProgram.id,
    programUpdate,
  );
  // Offering
  // Set the number of weeks to some number beyond 17 if there are two disbursements
  // since two disbursements are supposed to be create to offerings longer than 17 weeks.
  const offeringEndDateWeeks = createSecondDisbursement ? 18 : 10;
  const testInputOffering = testInputData.offering;
  const offeringUpdate = {
    yearOfStudy: testInputOffering.yearOfStudy,
    studyStartDate:
      testInputOffering.studyStartDate ?? addDays(15, programYear.startDate),
    studyEndDate:
      testInputOffering.studyEndDate ??
      addDays(7 * offeringEndDateWeeks, programYear.startDate),
    actualTuitionCosts: testInputOffering.actualTuitionCosts,
    programRelatedCosts: testInputOffering.programRelatedCosts,
    mandatoryFees: testInputOffering.mandatoryFees,
    exceptionalExpenses: testInputOffering.exceptionalExpenses,
    offeringIntensity: testInputOffering.offeringIntensity,
  };
  await db.educationProgramOffering.update(
    assessment.offering.id,
    offeringUpdate,
  );
  // Location
  const locationUpdate = { hasIntegration: true };
  await db.institutionLocation.update(
    assessment.offering.institutionLocation.id,
    locationUpdate,
  );

  return application;
}

function mapTestInputToDisbursementAndAwards(
  disbursement: DisbursementSchedule,
  testInputDisbursement: IER12Disbursement,
): void {
  disbursement.coeStatus = testInputDisbursement.coeStatus;
  disbursement.disbursementScheduleStatus =
    testInputDisbursement.disbursementScheduleStatus;
  disbursement.disbursementDate = testInputDisbursement.disbursementDate;
  disbursement.updatedAt = testInputDisbursement.updatedAt;
  disbursement.dateSent = testInputDisbursement.dateSent;
  disbursement.disbursementValues =
    testInputDisbursement.disbursementValues.map(
      (value) => value as DisbursementValue,
    );
}

/**
 * Saves a list of MSFAA test records.
 * @param db data source helper.
 * @param msfaaDataInputs input data for the MSFAA records to be created.
 * @returns all MSFAA records created. The result order may differ
 * from the array input order.
 */
// export async function saveMSFAATestInputsData(
//   db: E2EDataSources,
//   msfaaDataInputs: MSFAATestInputData[],
// ): Promise<MSFAANumber[]> {
//   const saveMSFAAPromises = msfaaDataInputs.map((msfaa) =>
//     saveMSFAATestInputData(db, msfaa),
//   );
//   return Promise.all(saveMSFAAPromises);
// }
