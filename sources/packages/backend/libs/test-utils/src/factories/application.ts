import {
  Application,
  ApplicationData,
  ApplicationException,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
  EducationProgram,
  EducationProgramOffering,
  FormYesNoOptions,
  Institution,
  InstitutionLocation,
  MSFAANumber,
  OfferingIntensity,
  ProgramInfoStatus,
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
  application.programYear.id = relations?.programYear?.id ?? 2;
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
    faker.datatype.number({ max: 9999999999, min: 1000000000 }).toString();
  application.applicationException = relations?.applicationException;
  application.location = relations?.location ?? createFakeInstitutionLocation();
  application.pirStatus = options?.initialValue?.pirStatus;
  return application;
}

/**
 * Create and save to the database an application with disbursement record(s) with all the dependencies.
 * @param dataSource manages the repositories to save the data.
 * @param relations dependencies.
 * - `institution` related institution.
 * - `institutionLocation` related location.
 * - `disbursementValues` shared disbursement values used for first and/or second disbursements.
 * - `firstDisbursementValues` first disbursement values. This will take precedence over the disbursementValues parameter.
 * - `secondDisbursementValues` second disbursement values. This will take precedence over the disbursementValues parameter.
 * - `student` related student.
 * - `msfaaNumber` related MSFAA number.
 * - `program` related education program.
 * - `programYear` related program year.
 * @param options additional options:
 * - `applicationStatus` if provided sets the application status of the application or else defaults to Assessment status.
 * - `applicationData` application related data.
 * - `pirStatus` program info status.
 * - `offeringIntensity` if provided sets the offering intensity for the created fakeApplication.
 * - `createSecondDisbursement` if provided and true creates a second disbursement,
 * - `currentAssessmentInitialValues` if provided set the current application initial values.
 * otherwise only one disbursement will be created.
 * - `firstDisbursementInitialValues` if provided sets the disbursement schedule status for the first disbursement otherwise sets to pending status by default.
 * - `secondDisbursementInitialValues` if provided sets the disbursement schedule status for the second disbursement otherwise sets to pending status by default.
 * - `offeringInitialValues` initial values related to the offering for the original assessment.
 * @returns the created application and its dependencies including the disbursement
 * with the confirmation of enrollment data.
 */
export async function saveFakeApplicationDisbursements(
  dataSource: DataSource,
  relations?: {
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
    disbursementValues?: DisbursementValue[];
    firstDisbursementValues?: DisbursementValue[];
    secondDisbursementValues?: DisbursementValue[];
    student?: Student;
    msfaaNumber?: MSFAANumber;
    program?: EducationProgram;
    programYear?: ProgramYear;
  },
  options?: {
    applicationStatus?: ApplicationStatus;
    applicationData?: ApplicationData;
    pirStatus?: ProgramInfoStatus;
    offeringIntensity?: OfferingIntensity;
    createSecondDisbursement?: boolean;
    currentAssessmentInitialValues?: Partial<StudentAssessment>;
    firstDisbursementInitialValues?: Partial<DisbursementSchedule>;
    secondDisbursementInitialValues?: Partial<DisbursementSchedule>;
    offeringInitialValues?: Partial<EducationProgramOffering>;
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
  const firstSchedule = createFakeDisbursementSchedule(
    {
      disbursementValues: relations?.firstDisbursementValues ??
        relations?.disbursementValues ?? [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            options?.offeringIntensity === OfferingIntensity.partTime
              ? "CSLP"
              : "CSLF",
            1,
          ),
        ],
    },
    { initialValues: options?.firstDisbursementInitialValues },
  );
  if (!options?.firstDisbursementInitialValues?.coeStatus) {
    // Only sets the COE status if not already set.
    firstSchedule.coeStatus =
      savedApplication.applicationStatus === ApplicationStatus.Completed
        ? COEStatus.completed
        : COEStatus.required;
  }
  firstSchedule.msfaaNumber = relations?.msfaaNumber;
  firstSchedule.studentAssessment = savedApplication.currentAssessment;
  disbursementSchedules.push(firstSchedule);
  if (options?.createSecondDisbursement) {
    // Original assessment - second disbursement.
    const secondSchedule = createFakeDisbursementSchedule(
      {
        disbursementValues: relations?.secondDisbursementValues ??
          relations?.disbursementValues ?? [
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              1,
            ),
          ],
      },
      { initialValues: options?.secondDisbursementInitialValues },
    );
    // First schedule is created with the current date as default.
    // Adding 60 days to create some time between the first and second schedules.
    secondSchedule.disbursementDate =
      options?.secondDisbursementInitialValues?.disbursementDate ??
      getISODateOnlyString(addDays(60));
    secondSchedule.msfaaNumber = relations?.msfaaNumber;
    secondSchedule.studentAssessment = savedApplication.currentAssessment;
    disbursementSchedules.push(secondSchedule);
  }
  savedApplication.currentAssessment.workflowData = options
    ?.currentAssessmentInitialValues?.workflowData ?? {
    studentData: {
      dependantStatus: "dependant",
      relationshipStatus: RelationshipStatus.Single,
      livingWithParents: FormYesNoOptions.Yes,
      numberOfParents: 2,
    },
    calculatedData: {
      familySize: 2,
      studentMSOLAllowance: 7777,
      totalNonEducationalCost: 22,
      studentMaritalStatusCode: "SI",
      pdppdStatus: false,
    },
    // Defining lifetimeMaximumCSLP as 10000 as default makes the student to have a minimum student loan balance for ecert generation.
    // Without a value to this will make the disbursement to be blocked.
    dmnValues:
      options?.offeringIntensity === OfferingIntensity.partTime
        ? { lifetimeMaximumCSLP: 10000 }
        : undefined,
  };
  savedApplication.currentAssessment.disbursementSchedules =
    disbursementSchedules;
  savedApplication.currentAssessment.assessmentData =
    options?.currentAssessmentInitialValues?.assessmentData ??
    savedApplication.currentAssessment.assessmentData;
  savedApplication.currentAssessment.assessmentDate =
    options?.currentAssessmentInitialValues?.assessmentDate ??
    savedApplication.currentAssessment.assessmentDate;
  savedApplication.currentAssessment.assessmentWorkflowId =
    options?.currentAssessmentInitialValues?.assessmentWorkflowId ??
    savedApplication.currentAssessment.assessmentWorkflowId;
  savedApplication.currentAssessment.studentAssessmentStatus =
    options?.currentAssessmentInitialValues?.studentAssessmentStatus ??
    savedApplication.currentAssessment.studentAssessmentStatus;
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
 * - `offering` related education program offering.
 * - `programYear` related program year.
 * @param options additional options:
 * - `applicationStatus` application status for the application.
 * - `offeringIntensity` if provided sets the offering intensity for the created fakeApplication, otherwise sets it to fulltime by default.
 * - `applicationData` related application data.
 * - `pirStatus` program info status.
 * - `currentAssessmentInitialValues` initial values related to the current assessment.
 * - `offeringInitialValues` initial values related to the offering for the original assessment.
 * @returns the created application.
 */
export async function saveFakeApplication(
  dataSource: DataSource,
  relations?: {
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
    student?: Student;
    program?: EducationProgram;
    offering?: EducationProgramOffering;
    programYear?: ProgramYear;
  },
  options?: {
    applicationStatus?: ApplicationStatus;
    offeringIntensity?: OfferingIntensity;
    applicationData?: ApplicationData;
    pirStatus?: ProgramInfoStatus;
    currentAssessmentInitialValues?: Partial<StudentAssessment>;
    offeringInitialValues?: Partial<EducationProgramOffering>;
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
  const fakeApplication = createFakeApplication(
    {
      student: savedStudent,
      location: relations?.institutionLocation,
      programYear: relations?.programYear,
    },
    {
      initialValue: {
        data: options?.applicationData,
        pirStatus: options?.pirStatus,
      },
    },
  );
  fakeApplication.applicationStatus = applicationStatus;
  const savedApplication = await applicationRepo.save(fakeApplication);
  // Offering.
  let savedOffering = relations?.offering;
  if (!savedOffering) {
    const fakeOffering = createFakeEducationProgramOffering(
      {
        institution: relations?.institution,
        institutionLocation: relations?.institutionLocation,
        program: relations?.program,
        auditUser: savedUser,
      },
      { initialValues: options?.offeringInitialValues },
    );
    fakeOffering.offeringIntensity =
      options?.offeringIntensity ?? OfferingIntensity.fullTime;
    fakeOffering.parentOffering = fakeOffering;
    savedOffering = await offeringRepo.save(fakeOffering);
  }
  if (savedApplication.applicationStatus !== ApplicationStatus.Draft) {
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment(
      {
        application: savedApplication,
        offering: savedOffering,
        auditUser: savedUser,
      },
      {
        initialValue: {
          assessmentData:
            options?.currentAssessmentInitialValues?.assessmentData,
        },
      },
    );
    const savedOriginalAssessment = await studentAssessmentRepo.save(
      fakeOriginalAssessment,
    );
    savedApplication.currentAssessment = savedOriginalAssessment;
  } else {
    savedApplication.location = null;
  }

  return applicationRepo.save(savedApplication);
}
