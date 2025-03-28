import {
  Application,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  EducationProgram,
  EducationProgramOffering,
  FullTimeAssessment,
  InstitutionLocation,
  ProgramYear,
  Student,
  StudentAssessment,
  WorkflowData,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeUser,
  ensureProgramYearExists,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import {
  IER12Application,
  IER12Assessment,
  IER12Disbursement,
  IER12Offering,
  IER12Program,
  IER12Student,
  IER12TestInputData,
} from "./models/data-inputs";
import { addDays, dateDifference, getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Save all IER12 related records providing all data that
 * will be part of the IER12 file generation.
 * @param db data source helper.
 * @param testInputData IER12 test input data.
 * @param relations IER12 relations:
 * - `institutionLocation` related IER12 location.
 * @param options method options:
 * - `programYearPrefix` program year prefix to create or find the program year to
 * be associated. Default 2000, would will create the program year 2000-2001.
 * - `submittedDate` date that the application was submitted.
 * @returns a saved application with all related data needed for an IER12 record creation.
 */
export async function saveIER12TestInputData(
  db: E2EDataSources,
  testInputData: IER12TestInputData,
  relations: {
    institutionLocation: InstitutionLocation;
  },
  options?: {
    programYearPrefix?: number;
    submittedDate?: Date;
  },
): Promise<Application> {
  // If a program year prefix is not provided, create one with the year 2000 as default.
  const programYear = await ensureProgramYearExists(
    db,
    options?.programYearPrefix ?? 2000,
  );
  // Submission date to be used as base date to non-program-year related dates.
  const referenceSubmission = options?.submittedDate ?? new Date();
  // Supporting shared variables.
  const createSecondDisbursement =
    testInputData.assessment.disbursementSchedules.length === 2;
  // Set the number of weeks to some number beyond 17 if there are two disbursements
  // since two disbursements are supposed to be create to offerings longer than 17 weeks.
  const offeringEndDateWeeks = createSecondDisbursement ? 18 : 10;
  // Set offering start date to few days after the program year start date.
  const studyStartDate =
    testInputData.offering.studyStartDate ??
    getISODateOnlyString(addDays(15, programYear.startDate));
  // Set the offering end date to few weeks after the program year start date.
  const studyEndDate =
    testInputData.offering.studyEndDate ??
    getISODateOnlyString(
      addDays(7 * offeringEndDateWeeks, programYear.startDate),
    );
  // User, Student, and SIN validation.
  const student = await saveIER12StudentFromTestInput(
    db,
    testInputData.student,
  );
  // Check if a program already exists for the institution to reuse it.
  // SABC codes are unique inside for the same institution.
  const program = await db.educationProgram.findOneBy({
    institution: { id: relations.institutionLocation.institution.id },
    sabcCode: testInputData.educationProgram.sabcCode,
  });
  // Application
  const application = await saveIER12ApplicationFromTestInput(
    db,
    testInputData.application,
    student,
    relations.institutionLocation,
    programYear,
    createSecondDisbursement,
    referenceSubmission,
    program,
  );
  // Assessment and its awards.
  const assessment = await saveIER12AssessmentFromTestInput(
    db,
    testInputData.assessment,
    application.currentAssessment,
    studyStartDate,
    studyEndDate,
    referenceSubmission,
  );
  // Program
  await updateIER12ProgramFromTestInput(
    db,
    assessment.offering.educationProgram.id,
    testInputData.educationProgram,
  );

  // Parent offering, if needed.
  const parentOffering = testInputData.parentOfferingAvailable
    ? await db.educationProgramOffering.save(
        createFakeEducationProgramOffering({
          institutionLocation: assessment.offering.institutionLocation,
          auditUser: assessment.offering.educationProgram.submittedBy,
          program: assessment.offering.educationProgram,
        }),
      )
    : undefined;

  // Offering
  await updateIER12OfferingFromTestInput(
    db,
    assessment.offering.id,
    testInputData.offering,
    studyStartDate,
    studyEndDate,
    {
      parentOffering,
    },
  );
  return application;
}

/**
 * Creates and saves the students populated from the test input data.
 * @param db data source helper.
 * @param testInputStudent data to create the student, its user, and
 * associated SIN validation.
 * @returns saved student.
 */
async function saveIER12StudentFromTestInput(
  db: E2EDataSources,
  testInputStudent: IER12Student,
): Promise<Student> {
  // User
  const fakeUser = createFakeUser();
  fakeUser.firstName = testInputStudent.firstName;
  fakeUser.lastName = testInputStudent.lastName;
  // Student
  const fakeStudent = createFakeStudent(fakeUser);
  fakeStudent.birthDate = getISODateOnlyString(testInputStudent.birthDate);
  fakeStudent.contactInfo = {
    address: {
      ...testInputStudent.addressInfo,
      // The country and the selectedCountry variables are not part of IER12, hence keeping as constants.
      country: "canada",
      selectedCountry: "Canada",
    },
    phone: faker.phone.phoneNumber(),
  };
  fakeStudent.disabilityStatus = testInputStudent.disabilityStatus;
  // SIN validation
  const sinValidation = createFakeSINValidation({ student: fakeStudent });
  sinValidation.sin = testInputStudent.sin;
  // Student
  return saveFakeStudent(db.dataSource, {
    student: fakeStudent,
    sinValidation,
  });
}

/**
 * Creates and saves the application populated from the test input data
 * alongside with its disbursements.
 * @param db data source helper.
 * @param testInputApplication data to create the application and its dependencies.
 * @param student previously saved student.
 * @param institutionLocation previously created institution location.
 * @param programYear previously saved program year.
 * @param createSecondDisbursement indicates if a second disbursement should be created.
 * @param referenceSubmission date when the application was submitted.
 * @param program education program that will have the offering created.
 * @returns the saved applications and its dependencies.
 */
async function saveIER12ApplicationFromTestInput(
  db: E2EDataSources,
  testInputApplication: IER12Application,
  student: Student,
  institutionLocation: InstitutionLocation,
  programYear: ProgramYear,
  createSecondDisbursement: boolean,
  referenceSubmission: Date,
  program?: EducationProgram,
): Promise<Application> {
  const application = await saveFakeApplicationDisbursements(
    db.dataSource,
    { student, institutionLocation, program, disbursementValues: [] },
    { createSecondDisbursement },
  );
  application.applicationNumber = testInputApplication.applicationNumber;
  application.studentNumber = testInputApplication.studentNumber;
  application.relationshipStatus = testInputApplication.relationshipStatus;
  application.submittedDate =
    testInputApplication.submittedDate ?? referenceSubmission;
  application.applicationStatus = testInputApplication.applicationStatus;
  application.applicationStatusUpdatedOn =
    testInputApplication.applicationStatusUpdatedOn ?? referenceSubmission;
  application.programYear = programYear;
  return db.application.save(application);
}

/**
 * Populates the assessments and its awards from the test input data
 * and saves them all.
 * @param db data source helper.
 * @param testInputAssessment assessment and awards test input data.
 * @param assessment previously saved assessment to be updated.
 * @param studyStartDate offering start date.
 * @param studyEndDate offering end date.
 * @param referenceSubmission used for reference to the assessment date
 * and possible auditing for the awards.
 * @returns the saved assessment and its dependencies.
 */
async function saveIER12AssessmentFromTestInput(
  db: E2EDataSources,
  testInputAssessment: IER12Assessment,
  assessment: StudentAssessment,
  studyStartDate: string,
  studyEndDate: string,
  referenceSubmission: Date,
): Promise<StudentAssessment> {
  assessment.triggerType = testInputAssessment.triggerType;
  // Simulates that the assessment date was produced one day after the reference date
  // in case the assessmentDate was not provided. It helps creating different dates
  // which allows a better data assertion.
  assessment.assessmentDate =
    testInputAssessment.assessmentDate ?? addDays(1, referenceSubmission);
  assessment.assessmentData =
    testInputAssessment.assessmentData as FullTimeAssessment;
  assessment.workflowData = testInputAssessment.workflowData as WorkflowData;
  // Schedules and awards mapping.
  const [firstDisbursement, secondDisbursement] =
    assessment.disbursementSchedules;
  const [firstDisbursementTestInput, secondDisbursementTestInput] =
    testInputAssessment.disbursementSchedules;
  mapTestInputToDisbursementAndAwards(
    firstDisbursement,
    firstDisbursementTestInput,
    studyStartDate,
    referenceSubmission,
  );
  if (secondDisbursement) {
    // Calculate the middle date between offering start/end dates.
    const midOfferingDateDays =
      dateDifference(studyEndDate, studyStartDate) / 2;
    const midOfferingDate = addDays(midOfferingDateDays, studyStartDate);
    mapTestInputToDisbursementAndAwards(
      secondDisbursement,
      secondDisbursementTestInput,
      getISODateOnlyString(midOfferingDate),
      referenceSubmission,
    );
  }
  return db.studentAssessment.save(assessment);
}

/**
 * Maps the test input values to the disbursements and its awards.
 * @param disbursement disbursement being populated.
 * @param testInputDisbursement test input to populate the disbursement and its awards.
 * @param disbursementDate disbursement date.
 * @param referenceSubmission optionally used for auditing dates as a fallback.
 */
function mapTestInputToDisbursementAndAwards(
  disbursement: DisbursementSchedule,
  testInputDisbursement: IER12Disbursement,
  disbursementDate: string,
  referenceSubmission: Date,
): void {
  disbursement.coeStatus = testInputDisbursement.coeStatus;
  disbursement.disbursementScheduleStatus =
    testInputDisbursement.disbursementScheduleStatus;
  disbursement.disbursementDate = disbursementDate;

  if (
    disbursement.disbursementScheduleStatus === DisbursementScheduleStatus.Sent
  ) {
    const fallbackSentDate = new Date(disbursementDate);
    disbursement.updatedAt =
      testInputDisbursement.updatedAt ?? fallbackSentDate;
    // Disbursements can be sent few days before its date.
    disbursement.dateSent =
      testInputDisbursement.dateSent ?? addDays(-1, fallbackSentDate);
  } else {
    disbursement.updatedAt =
      testInputDisbursement.updatedAt ?? referenceSubmission;
    disbursement.dateSent = testInputDisbursement.dateSent;
  }
  disbursement.disbursementValues =
    testInputDisbursement.disbursementValues.map(
      (value) => value as DisbursementValue,
    );
}

/**
 * Updates a previously saved program with the data from the test input.
 * @param db data source helper.
 * @param programId program id to be updated.
 * @param testInputProgram program test input data.
 */
async function updateIER12ProgramFromTestInput(
  db: E2EDataSources,
  programId: number,
  testInputProgram: IER12Program,
): Promise<void> {
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
  await db.educationProgram.update(programId, programUpdate);
}

/**
 * Updates a previously saved offering with the data from the test input.
 * @param db data source helper.
 * @param offeringId offering id to be updated.
 * @param testInputOffering offering test input data.
 * @param studyStartDate offering start date.
 * @param studyEndDate offering end date.
 * @param relations, relations,
 * -  `parentOffering` parent offering.
 */
async function updateIER12OfferingFromTestInput(
  db: E2EDataSources,
  offeringId: number,
  testInputOffering: IER12Offering,
  studyStartDate: string,
  studyEndDate: string,
  relations?: {
    parentOffering: EducationProgramOffering;
  },
): Promise<void> {
  const offeringUpdate = {
    yearOfStudy: testInputOffering.yearOfStudy,
    studyStartDate,
    studyEndDate,
    actualTuitionCosts: testInputOffering.actualTuitionCosts,
    programRelatedCosts: testInputOffering.programRelatedCosts,
    mandatoryFees: testInputOffering.mandatoryFees,
    exceptionalExpenses: testInputOffering.exceptionalExpenses,
    offeringIntensity: testInputOffering.offeringIntensity,
    parentOffering: relations?.parentOffering,
  };
  await db.educationProgramOffering.update(offeringId, offeringUpdate);
}
