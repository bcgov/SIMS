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
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import {
  IER12Disbursement,
  IER12TestInputData,
} from "./models/ier12-integration.scheduler.models";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

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
): Promise<Application> {
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
    testInputData.assessment.disbursements.length === 2;
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
  application.applicationStatus = testInputApplication.status;
  application.applicationStatusUpdatedOn = testInputApplication.statusDate;
  application.programYear = await db.programYear.findOneBy({
    programYear: testInputApplication.programYear,
  });
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
      testInputAssessment.disbursements[index],
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
  const testInputOffering = testInputData.educationProgram.offering;
  const offeringUpdate = {
    yearOfStudy: testInputOffering.yearOfStudy,
    studyStartDate: getISODateOnlyString(testInputOffering.studyStartDate),
    studyEndDate: getISODateOnlyString(testInputOffering.studyEndDate),
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
