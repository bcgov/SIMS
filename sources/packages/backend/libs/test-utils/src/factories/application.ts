import {
  Application,
  ApplicationData,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  DisbursementValueType,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  ProgramYear,
  RelationshipStatus,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";
import { DataSource } from "typeorm";
import {
  createFakeDisbursementSchedule,
  createFakeDisbursementValue,
  createFakeEducationProgramOffering,
  createFakeStudentAssessment,
  createFakeUser,
} from "..";
import { createFakeProgramYear } from "./program-year";
import { createFakeStudent } from "./student";

export function createFakeApplication(relations?: {
  student?: Student;
  programYear?: ProgramYear;
  currentStudentAssessment?: StudentAssessment;
}): Application {
  const application = new Application();
  application.data = {} as ApplicationData;
  application.programYear = relations?.programYear ?? createFakeProgramYear();
  // TODO get programYear from relations instead of setting the id here.
  application.programYear.id = 2;
  application.student = relations?.student ?? createFakeStudent();
  application.applicationStatusUpdatedOn = new Date();
  application.applicationStatus = ApplicationStatus.Submitted;
  application.relationshipStatus = RelationshipStatus.Single;
  application.currentAssessment = relations?.currentStudentAssessment;
  application.applicationNumber = faker.random.alphaNumeric(10);
  return application;
}

/**
 * Create and save to the database an application with disbursement record(s) with all the dependencies.
 * @param dataSource manages the repositories to save the data.
 * @param relations dependencies.
 * - `institution` related institution.
 * - `institutionLocation` related location.
 * - `disbursementValues` related disbursement schedules.
 * - `student` related student.
 * @param options additional options:
 * - `createSecondDisbursement` if provided and true creates a second disbursement,
 * otherwise only one disbursement will be created.
 * @returns the created application and its dependencies including the disbursement
 * with the confirmation of enrollment data.
 */
export async function saveFakeApplicationDisbursements(
  dataSource: DataSource,
  relations?: {
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
    disbursementValues?: DisbursementValue[];
    student?: Student;
  },
  options?: {
    applicationStatus?: ApplicationStatus;
    createSecondDisbursement?: boolean;
    isReassessment?: boolean;
  },
): Promise<Application> {
  const userRepo = dataSource.getRepository(User);
  const studentRepo = dataSource.getRepository(Student);
  const applicationRepo = dataSource.getRepository(Application);
  const studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
  const offeringRepo = dataSource.getRepository(EducationProgramOffering);
  // Using Assessment as a default status since it the first status when
  // the application has the disbursement already generated.
  const applicationStatus =
    options?.applicationStatus ?? ApplicationStatus.Assessment;
  // Ensure student/user creation.
  let savedUser: User;
  let savedStudent: Student;
  if (relations?.student) {
    savedUser = relations.student.user;
    savedStudent = relations.student;
  } else {
    savedUser = await userRepo.save(createFakeUser());
    savedStudent = await studentRepo.save(createFakeStudent(savedUser));
  }
  // Create and save application.
  const fakeApplication = createFakeApplication({ student: savedStudent });
  fakeApplication.applicationStatus = applicationStatus;
  const savedApplication = await applicationRepo.save(fakeApplication);
  // Original assessment.
  const fakeOriginalAssessment = createFakeStudentAssessment({
    auditUser: savedUser,
  });
  fakeOriginalAssessment.application = savedApplication;
  const disbursementSchedules: DisbursementSchedule[] = [];
  // Original assessment - first disbursement.
  const firstSchedule = createFakeDisbursementSchedule({
    auditUser: savedUser,
    disbursementValues: relations?.disbursementValues ?? [
      createFakeDisbursementValue(DisbursementValueType.CanadaLoan, "CSLF", 1),
    ],
  });
  // COE status is 'Completed' for a completed application with original assessment
  // otherwise it will be 'Required'.
  firstSchedule.coeStatus =
    applicationStatus === ApplicationStatus.Completed &&
    !options?.isReassessment
      ? COEStatus.completed
      : COEStatus.required;
  firstSchedule.disbursementScheduleStatus = DisbursementScheduleStatus.Pending;
  disbursementSchedules.push(firstSchedule);
  if (options?.createSecondDisbursement) {
    // Original assessment - second disbursement.
    const secondSchedule = createFakeDisbursementSchedule({
      auditUser: savedUser,
      disbursementValues: relations?.disbursementValues ?? [
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 1),
      ],
    });
    secondSchedule.coeStatus = COEStatus.required;
    secondSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Pending;
    // First schedule is created with the current date as default.
    // Adding 60 days to create some time between the first and second schedules.
    secondSchedule.disbursementDate = getISODateOnlyString(addDays(60));
    disbursementSchedules.push(secondSchedule);
  }
  fakeOriginalAssessment.disbursementSchedules = disbursementSchedules;
  // Offering.
  const fakeOffering = createFakeEducationProgramOffering({
    institution: relations?.institution,
    institutionLocation: relations?.institutionLocation,
    auditUser: savedUser,
  });
  fakeOffering.offeringIntensity = OfferingIntensity.fullTime;
  const savedOffering = await offeringRepo.save(fakeOffering);
  fakeOriginalAssessment.offering = savedOffering;
  const savedOriginalAssessment = await studentAssessmentRepo.save(
    fakeOriginalAssessment,
  );
  savedApplication.currentAssessment = savedOriginalAssessment;
  return applicationRepo.save(savedApplication);
}
