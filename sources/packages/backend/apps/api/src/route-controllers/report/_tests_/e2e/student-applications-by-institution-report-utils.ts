import {
  Institution,
  Application,
  ApplicationStatus,
  DisbursementScheduleStatus,
  Student,
  DisbursementSchedule,
} from "@sims/sims-db";
import {
  addDays,
  getISODateOnlyString,
  getPSTPDTDateTime,
} from "@sims/utilities";
import {
  E2EDataSources,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import { sumAwardAmounts } from "@sims/test-utils/utils";

/**
 * Creates application data setup for testing Ministry_Student_Applications_By_Institution_Report.
 * An application is created with a previous version to ensure that the report filters out applications
 * based on the submission of the first ever submitted application.
 * @param db E2E data sources.
 * @param options method options.
 * - `student` student to be used in the application.
 * - `institution` institution to be used in the applications.
 * - `originalSubmissionDate` original submission date to be used in the application.
 * - `currentOfferingEndDateOffSet` current offering end date offset to be used in the application.
 * useful when the offering end date must be set in the past.
 * - `parentApplicationFirstDisbursementInitialValues` initial values to be used in the parent application first disbursement.
 * @returns the created application.
 */
export async function createVersionedApplicationsDataSetup(
  db: E2EDataSources,
  options: {
    student: Student;
    institution: Institution;
    originalSubmissionDate?: Date;
    currentOfferingEndDateOffSet?: number;
    parentApplicationFirstDisbursementInitialValues?: Partial<DisbursementSchedule>;
  },
): Promise<Application> {
  const originalSubmissionDate = options?.originalSubmissionDate ?? new Date();
  // Set the original submission date to be in the past application to allow the search
  // criteria to find the application based on the first ever submitted application.
  const previousApplicationSubmissionDate = originalSubmissionDate;
  // Set the current application submission date to be in the future to ensure that the report filters out applications
  // based on the submission of the first ever submitted application.
  const currentApplicationSubmissionDate = addDays(15, originalSubmissionDate);
  const studyStartDate = getISODateOnlyString(
    addDays(30, originalSubmissionDate),
  );
  const studyEndDate = getISODateOnlyString(
    addDays(60, originalSubmissionDate),
  );
  const previousApplication = await saveFakeApplicationDisbursements(
    db.dataSource,
    { student: options.student, institution: options.institution },
    {
      applicationInitialValues: {
        submittedDate: previousApplicationSubmissionDate,
        applicationStatus: ApplicationStatus.Edited,
      },
      offeringInitialValues: {
        studyStartDate,
        studyEndDate,
      },
      currentAssessmentInitialValues: {
        assessmentDate: addDays(1, originalSubmissionDate),
      },
      firstDisbursementInitialValues:
        options.parentApplicationFirstDisbursementInitialValues,
    },
  );
  let currentApplicationStartDate = studyStartDate;
  let currentApplicationStudyEndDate = studyEndDate;
  if (options?.currentOfferingEndDateOffSet) {
    currentApplicationStudyEndDate = getISODateOnlyString(
      addDays(options.currentOfferingEndDateOffSet, new Date()),
    );
    // Set start date to be before the end date (just to be consistent with the data).
    // Only the end date is relevant for the report, as it is used to determine if the application is archived or not.
    currentApplicationStartDate = getISODateOnlyString(
      addDays(-30, new Date(currentApplicationStudyEndDate)),
    );
  }
  const currentApplication = await saveFakeApplicationDisbursements(
    db.dataSource,
    {
      student: options.student,
      institution: options.institution,
      parentApplication: previousApplication,
      precedingApplication: previousApplication,
    },
    {
      applicationInitialValues: {
        applicationStatus: ApplicationStatus.Completed,
        submittedDate: currentApplicationSubmissionDate,
        applicationNumber: previousApplication.applicationNumber,
      },
      offeringInitialValues: {
        studyStartDate: currentApplicationStartDate,
        studyEndDate: currentApplicationStudyEndDate,
      },
      currentAssessmentInitialValues: {
        assessmentDate: addDays(2, originalSubmissionDate),
      },
    },
  );
  return currentApplication;
}

/**
 * Create a single application to test the Ministry_Student_Applications_By_Institution_Report.
 * @param db E2E data sources.
 * @param options method options.
 * @returns the created application.
 */
export async function createSingleApplicationDataSetup(
  db: E2EDataSources,
  options: {
    student: Student;
    institution: Institution;
    applicationStatus: ApplicationStatus;
    submissionDate: Date;
    firstDisbursementInitialValues?: Partial<DisbursementSchedule>;
  },
): Promise<Application> {
  const currentApplication = await saveFakeApplicationDisbursements(
    db.dataSource,
    {
      student: options.student,
      institution: options.institution,
    },
    {
      applicationInitialValues: {
        applicationStatus: options.applicationStatus,
        submittedDate: options.submissionDate,
      },
      currentAssessmentInitialValues: {
        assessmentDate: addDays(2, options.submissionDate),
      },
    },
  );
  return currentApplication;
}

/**
 * Build the records expected to be generated in the Ministry_Student_Applications_By_Institution_Report.
 * Load the application with all the necessary relations to build the expected report record.
 * Note: objects created by the standard factories do not contain all the necessary relationships
 * required to build the expected report record.
 * @param application application to generate the expected report record.
 * @returns report data.
 */
export async function buildApplicationsByInstitutionData(
  db: E2EDataSources,
  applicationId: number,
): Promise<Record<string, string | number>> {
  const application = await db.application.findOneOrFail({
    select: {
      id: true,
      applicationNumber: true,
      submittedDate: true,
      studentNumber: true,
      applicationStatus: true,
      offeringIntensity: true,
      location: {
        id: true,
        name: true,
        institution: {
          id: true,
          operatingName: true,
          country: true,
          province: true,
          classification: true,
          organizationStatus: true,
        },
      },
      student: {
        id: true,
        sinValidation: {
          id: true,
          sin: true,
        },
        user: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      currentAssessment: {
        id: true,
        assessmentDate: true,
        offering: {
          id: true,
          name: true,
          studyStartDate: true,
          studyEndDate: true,
          offeringIntensity: true,
          educationProgram: {
            id: true,
            name: true,
            credentialType: true,
            cipCode: true,
          },
        },
        disbursementSchedules: {
          id: true,
          disbursementValues: {
            id: true,
            valueAmount: true,
          },
        },
      },
      parentApplication: {
        id: true,
        submittedDate: true,
        versions: {
          id: true,
          studentAssessments: {
            id: true,
            disbursementSchedules: {
              id: true,
              disbursementScheduleStatus: true,
            },
          },
        },
      },
    },
    relations: {
      currentAssessment: {
        offering: {
          educationProgram: true,
        },
        disbursementSchedules: {
          disbursementValues: true,
        },
      },
      location: {
        institution: true,
      },
      student: {
        user: true,
        sinValidation: true,
      },
      parentApplication: {
        versions: {
          studentAssessments: {
            disbursementSchedules: true,
          },
        },
      },
    },
    where: { id: applicationId },
  });
  const savedOffering = application.currentAssessment.offering;
  const savedEducationProgram = savedOffering.educationProgram;
  const savedInstitution = application.location.institution;
  const savedLocation = application.location;
  const savedStudent = application.student;
  const savedUser = savedStudent.user;
  const disbursementValues =
    application.currentAssessment.disbursementSchedules.flatMap(
      (disbursementSchedule) => disbursementSchedule.disbursementValues ?? [],
    );
  const disbursed = application.parentApplication.versions
    .flatMap(
      (applicationVersion) => applicationVersion.studentAssessments ?? [],
    )
    .flatMap(
      (studentAssessment) => studentAssessment.disbursementSchedules ?? [],
    )
    .some(
      (disbursementSchedule) =>
        disbursementSchedule.disbursementScheduleStatus ===
        DisbursementScheduleStatus.Sent,
    );
  return {
    "Student First Name": savedUser.firstName,
    "Student Last Name": savedUser.lastName,
    SIN: savedStudent.sinValidation.sin,
    "Student Number": application.studentNumber ?? "",
    "Institution Operating Name": savedInstitution.operatingName,
    Country: savedInstitution.country ?? "",
    Province: savedInstitution.province ?? "",
    Classification: savedInstitution.classification ?? "",
    "Organization Status": savedInstitution.organizationStatus ?? "",
    "Location Name": savedLocation.name,
    "Application Number": application.applicationNumber,
    "Original Submission": getPSTPDTDateTime(
      application.parentApplication.submittedDate,
    ),
    "Last Submission": getPSTPDTDateTime(application.submittedDate),
    "Assessment Date":
      getISODateOnlyString(application.currentAssessment.assessmentDate) ?? "",
    "Application Status": application.applicationStatus,
    Disbursed: disbursed ? "Yes" : "No",
    "Study Intensity": savedOffering.offeringIntensity,
    "Program Name": savedEducationProgram.name,
    "Program Credential Type": savedEducationProgram.credentialType,
    "CIP Code": savedEducationProgram.cipCode,
    "Offering Name": savedOffering.name,
    "Study Start Date": savedOffering.studyStartDate,
    "Study End Date": savedOffering.studyEndDate,
    "Total Assistance": disbursementValues?.length
      ? sumAwardAmounts(disbursementValues).toFixed(2)
      : "",
  };
}
