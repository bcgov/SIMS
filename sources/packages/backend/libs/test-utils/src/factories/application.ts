import {
  Application,
  ApplicationData,
  ApplicationException,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  DisbursementValueType,
  EducationProgram,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
  MSFAANumber,
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
  createFakeInstitutionLocation,
  createFakeStudentAssessment,
  createFakeUser,
} from "..";
import { createFakeProgramYear } from "./program-year";
import { createFakeStudent } from "./student";

export function createFakeApplication(
  relations?: {
    student?: Student;
    programYear?: ProgramYear;
    currentStudentAssessment?: StudentAssessment;
    applicationException?: ApplicationException;
    location?: InstitutionLocation;
  },
  options?: { initialValue?: Partial<Application> },
): Application {
  const application = new Application();
  application.data = options?.initialValue.data ?? ({} as ApplicationData);
  application.programYear = relations?.programYear ?? createFakeProgramYear();
  // TODO get programYear from relations instead of setting the id here.
  application.programYear.id = 2;
  application.student = relations?.student ?? createFakeStudent();
  application.applicationStatusUpdatedOn =
    options?.initialValue?.applicationStatusUpdatedOn ?? new Date();
  application.applicationStatus =
    options?.initialValue?.applicationStatus ?? ApplicationStatus.Submitted;
  application.relationshipStatus =
    options?.initialValue?.relationshipStatus ?? RelationshipStatus.Single;
  application.currentAssessment = relations?.currentStudentAssessment;
  // Application numbers are expected to be a string of number
  // with fixed length of 10 characters.
  application.applicationNumber =
    options?.initialValue?.applicationNumber ??
    faker.random.number({ max: 9999999999, min: 1000000000 }).toString();
  application.applicationException = relations?.applicationException;
  application.location = relations?.location ?? createFakeInstitutionLocation();
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
 * - `msfaaNumber` related MSFAA number.
 * - `program` related education program.
 * @param options additional options:
 * - `applicationStatus` if provided sets the application status of the application or else defaults to Assessment status.
 * - `offeringIntensity` if provided sets the offering intensity for the created fakeApplication.
 * - `createSecondDisbursement` if provided and true creates a second disbursement,
 * otherwise only one disbursement will be created.
 * - `firstDisbursementInitialValues` if provided sets the disbursement schedule status for the first disbursement otherwise sets to pending status by default.
 * - `secondDisbursementInitialValues` if provided sets the disbursement schedule status for the second disbursement otherwise sets to pending status by default.
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
    msfaaNumber?: MSFAANumber;
    program?: EducationProgram;
  },
  options?: {
    applicationStatus?: ApplicationStatus;
    offeringIntensity?: OfferingIntensity;
    createSecondDisbursement?: boolean;
    firstDisbursementInitialValues?: Partial<DisbursementSchedule>;
    secondDisbursementInitialValues?: Partial<DisbursementSchedule>;
  },
): Promise<Application> {
  const applicationRepo = dataSource.getRepository(Application);
  const studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
  const savedApplication = await saveFakeApplication(
    dataSource,
    relations,
    options,
  );
  // Using Assessment as a default status since it the first status when
  // the application has the disbursement already generated.
  savedApplication.applicationStatus =
    options?.applicationStatus ?? ApplicationStatus.Assessment;
  await applicationRepo.save(savedApplication);
  const disbursementSchedules: DisbursementSchedule[] = [];
  // Original assessment - first disbursement.
  const firstSchedule = createFakeDisbursementSchedule({
    auditUser: savedApplication.student.user,
    disbursementValues: relations?.disbursementValues ?? [
      createFakeDisbursementValue(DisbursementValueType.CanadaLoan, "CSLF", 1),
    ],
  });
  firstSchedule.coeStatus =
    savedApplication.applicationStatus === ApplicationStatus.Completed
      ? COEStatus.completed
      : COEStatus.required;
  firstSchedule.disbursementScheduleStatus =
    options?.firstDisbursementInitialValues?.disbursementScheduleStatus ??
    DisbursementScheduleStatus.Pending;
  firstSchedule.msfaaNumber = relations?.msfaaNumber;
  firstSchedule.studentAssessment = savedApplication.currentAssessment;
  disbursementSchedules.push(firstSchedule);
  if (options?.createSecondDisbursement) {
    // Original assessment - second disbursement.
    const secondSchedule = createFakeDisbursementSchedule({
      auditUser: savedApplication.student.user,
      disbursementValues: relations?.disbursementValues ?? [
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 1),
      ],
    });
    secondSchedule.coeStatus = COEStatus.required;
    secondSchedule.disbursementScheduleStatus =
      options?.secondDisbursementInitialValues?.disbursementScheduleStatus ??
      DisbursementScheduleStatus.Pending;
    // First schedule is created with the current date as default.
    // Adding 60 days to create some time between the first and second schedules.
    secondSchedule.disbursementDate = getISODateOnlyString(addDays(60));
    secondSchedule.msfaaNumber = relations?.msfaaNumber;
    secondSchedule.studentAssessment = savedApplication.currentAssessment;
    disbursementSchedules.push(secondSchedule);
  }
  savedApplication.currentAssessment.disbursementSchedules =
    disbursementSchedules;
  savedApplication.currentAssessment = await studentAssessmentRepo.save(
    savedApplication.currentAssessment,
  );
  return applicationRepo.save(savedApplication);
}

/**
 * Create and save to the database an application with all the dependencies.
 * @param dataSource manages the repositories to save the data.
 * @param relations dependencies.
 * - `institution` related institution.
 * - `institutionLocation` related location.
 * - `student` related student.
 * - `program` related education program.
 * @param options additional options:
 * - `applicationStatus` application status for the application.
 * - `offeringIntensity` if provided sets the offering intensity for the created fakeApplication, otherwise sets it to fulltime by default.
 * @returns the created application.
 */
export async function saveFakeApplication(
  dataSource: DataSource,
  relations?: {
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
    student?: Student;
    program?: EducationProgram;
  },
  options?: {
    applicationStatus?: ApplicationStatus;
    offeringIntensity?: OfferingIntensity;
  },
): Promise<Application> {
  const userRepo = dataSource.getRepository(User);
  const studentRepo = dataSource.getRepository(Student);
  const applicationRepo = dataSource.getRepository(Application);
  const studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
  const offeringRepo = dataSource.getRepository(EducationProgramOffering);
  const applicationStatus =
    options?.applicationStatus ?? ApplicationStatus.Submitted;
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
  const fakeApplication = createFakeApplication({
    student: savedStudent,
    location: relations?.institutionLocation,
  });
  fakeApplication.applicationStatus = applicationStatus;
  const savedApplication = await applicationRepo.save(fakeApplication);
  // Offering.
  const fakeOffering = createFakeEducationProgramOffering({
    institution: relations?.institution,
    institutionLocation: relations?.institutionLocation,
    program: relations?.program,
    auditUser: savedUser,
  });
  fakeOffering.offeringIntensity =
    options?.offeringIntensity ?? OfferingIntensity.fullTime;
  const savedOffering = await offeringRepo.save(fakeOffering);

  if (savedApplication.applicationStatus !== ApplicationStatus.Draft) {
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      application: savedApplication,
      offering: savedOffering,
      auditUser: savedUser,
    });
    const savedOriginalAssessment = await studentAssessmentRepo.save(
      fakeOriginalAssessment,
    );
    savedApplication.currentAssessment = savedOriginalAssessment;
  } else {
    savedApplication.location = null;
  }

  return applicationRepo.save(savedApplication);
}
