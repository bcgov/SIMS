import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  ApplicationData,
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  FullTimeAssessment,
  Institution,
  InstitutionLocation,
  InstitutionType,
  InstitutionUserTypes,
  OfferingIntensity,
  ProgramYear,
  Student,
  User,
  WorkflowData,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementValue,
  createFakeEducationProgramOffering,
  createFakeInstitution,
  createFakeInstitutionLocation,
  ensureProgramYearExists,
  getProviderInstanceForModule,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  mockInstitutionUserAuthorization,
} from "../../../../testHelpers";
import { parse } from "papaparse";
import * as request from "supertest";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import {
  FormNames,
  FormService,
  InstitutionUserAuthorizations,
} from "../../../../services";
import { TestingModule } from "@nestjs/testing";
import { getISODateOnlyString, getPSTPDTDateTime } from "@sims/utilities";
import { INSTITUTION_TYPE_BC_PUBLIC } from "@sims/sims-db/constant";

describe("ReportInstitutionsController(e2e)-exportReport", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;
  let formService: FormService;
  let programYear: ProgramYear;
  let institutionUser: User;
  let sharedStudent: Student;
  const PROGRAM_YEAR_PREFIX = 2010;
  const bcPublicInstitutionType = {
    id: INSTITUTION_TYPE_BC_PUBLIC,
  } as InstitutionType;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    // Mock the form service to validate the dry-run submission result.
    formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
    // College F.
    const { institution: collegeF, user } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    institutionUser = user;
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    // College C.
    const { institution: collegeC } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    // Program Year for the following tests.
    programYear = await ensureProgramYearExists(db, PROGRAM_YEAR_PREFIX);
    sharedStudent = await saveFakeStudent(db.dataSource);
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
  });

  it("Should generate the offering details report when a report generation request is made with the appropriate program year and offering intensity.", async () => {
    // Arrange

    // Created 3 offerings as follows:
    // 1st offering with 0 applications.
    // 2nd offering with an application for a student belonging to the location of the institution for which the report is generated.
    // 3rd offering with an application for a student belonging to the location of a different institution for which this report is not generated.
    const student = await saveFakeStudent(db.dataSource);
    // 1st offering: with no submitted applications to it.
    const firstFakeOffering = createFakeEducationProgramOffering(
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        auditUser: institutionUser,
      },
      { initialValues: { studyStartDate: "2010-09-01" } },
    );
    const firstSavedOffering = await db.educationProgramOffering.save(
      firstFakeOffering,
    );
    // 2nd offering: with an application belonging to the location of the institution for which the report is generated.
    const secondFakeOffering = createFakeEducationProgramOffering(
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        auditUser: institutionUser,
      },
      {
        initialValues: {
          studyStartDate: "2010-09-01",
          offeringWILType: "dummy type",
        },
      },
    );
    const secondSavedOffering = await db.educationProgramOffering.save(
      secondFakeOffering,
    );
    await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
        offering: secondSavedOffering,
        programYear,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // 3rd offering: with an application belonging to the location of the institution for which the report is not generated.
    const thirdFakeOffering = createFakeEducationProgramOffering(
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        auditUser: institutionUser,
      },
      { initialValues: { studyStartDate: "2010-09-01" } },
    );
    const thirdSavedOffering = await db.educationProgramOffering.save(
      thirdFakeOffering,
    );
    await saveFakeApplication(
      db.dataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student,
        offering: thirdSavedOffering,
        programYear,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const payload = {
      reportName: "Offering_Details_Report",
      params: {
        offeringIntensity: {
          "Full Time": true,
          "Part Time": false,
        },
        programYear: programYear.id,
      },
    };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.ExportFinancialReports,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = "/institutions/report";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual(
          expect.arrayContaining([
            {
              "Institution Location Code": collegeFLocation.institutionCode,
              Program: secondSavedOffering.educationProgram.name,
              "SABC Program Code": "",
              "Offering Name": secondSavedOffering.name,
              "Year of Study": secondSavedOffering.yearOfStudy.toString(),
              "Offering Intensity": secondSavedOffering.offeringIntensity,
              "Course Load": secondSavedOffering.courseLoad.toString(),
              "Delivery Type": secondSavedOffering.offeringDelivered,
              "WIL Component": secondSavedOffering.hasOfferingWILComponent,
              "WIL Component Type": "dummy type",
              "Start Date": secondSavedOffering.studyStartDate,
              "End Date": secondSavedOffering.studyEndDate,
              "Has Study Breaks":
                (!secondSavedOffering.lacksStudyBreaks).toString(),
              "Actual Tuition":
                secondSavedOffering.actualTuitionCosts.toString(),
              "Program Related Costs":
                secondSavedOffering.programRelatedCosts.toString(),
              "Mandatory Fees": secondSavedOffering.mandatoryFees.toString(),
              "Exceptional Expenses":
                secondSavedOffering.exceptionalExpenses.toString(),
              "Offering Type": secondSavedOffering.offeringType,
              Status: secondSavedOffering.offeringStatus,
              "Funded Weeks":
                secondSavedOffering.studyBreaks.totalFundedWeeks.toString(),
              "Total Applications": "1",
            },
            {
              "Institution Location Code": collegeFLocation.institutionCode,
              Program: firstSavedOffering.educationProgram.name,
              "SABC Program Code": "",
              "Offering Name": firstSavedOffering.name,
              "Year of Study": firstSavedOffering.yearOfStudy.toString(),
              "Offering Intensity": firstSavedOffering.offeringIntensity,
              "Course Load": firstSavedOffering.courseLoad.toString(),
              "Delivery Type": firstSavedOffering.offeringDelivered,
              "WIL Component": firstSavedOffering.hasOfferingWILComponent,
              "WIL Component Type": "",
              "Start Date": firstSavedOffering.studyStartDate,
              "End Date": firstSavedOffering.studyEndDate,
              "Has Study Breaks":
                (!firstSavedOffering.lacksStudyBreaks).toString(),
              "Actual Tuition":
                firstSavedOffering.actualTuitionCosts.toString(),
              "Program Related Costs":
                firstSavedOffering.programRelatedCosts.toString(),
              "Mandatory Fees": firstSavedOffering.mandatoryFees.toString(),
              "Exceptional Expenses":
                firstSavedOffering.exceptionalExpenses.toString(),
              "Offering Type": firstSavedOffering.offeringType,
              Status: firstSavedOffering.offeringStatus,
              "Funded Weeks":
                firstSavedOffering.studyBreaks.totalFundedWeeks.toString(),
              "Total Applications": "",
            },
            expect.not.objectContaining({
              "Institution Location Code": collegeCLocation.institutionCode,
              "Offering Name": thirdSavedOffering.name,
            }),
          ]),
        );
      });
  });

  it("Should generate the Student Unmet Need Report when a report generation request is made with the appropriate filters.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const savedApplication = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        institution: collegeF,
        institutionLocation: collegeFLocation,
        programYear,
      },
      {
        currentAssessmentInitialValues: {
          workflowData: {
            calculatedData: {
              totalEligibleDependents: 2,
              pdppdStatus: false,
            },
          } as WorkflowData,
          assessmentDate: new Date(),
          assessmentData: {
            totalFederalAssessedResources: 10,
            federalAssessmentNeed: 3,
            totalProvincialAssessedResources: 5,
            provincialAssessmentNeed: 11,
            finalAwardTotal: 20,
            finalFederalAwardNetCSGPAmount: 13,
            finalFederalAwardNetCSGDAmount: 14,
            finalProvincialAwardNetBCAGAmount: 15,
            finalProvincialAwardNetSBSDAmount: 16,
            finalProvincialAwardNetBCSLAmount: 17,
            finalFederalAwardNetCSGFAmount: 18,
            finalProvincialAwardNetBGPDAmount: 19,
            totalAssessedCost: 50,
          } as Assessment,
        },
        applicationData: {
          indigenousStatus: "no",
          citizenship: "canadianCitizen",
          youthInCare: "no",
          dependantstatus: "independant",
        } as ApplicationData,
      },
    );
    const payload = {
      reportName: "Student_Unmet_Need_Report",
      params: {
        offeringIntensity: {
          "Full Time": true,
          "Part Time": true,
        },
        programYear: programYear.id,
      },
    };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.ExportFinancialReports,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = "/institutions/report";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const assessmentData = savedApplication.currentAssessment
      .assessmentData as FullTimeAssessment;
    const applicationData = savedApplication.currentAssessment.application.data;
    const savedOffering = savedApplication.currentAssessment.offering;
    const savedEducationProgram = savedOffering.educationProgram;
    const savedLocation = savedApplication.location;
    const savedStudent = savedApplication.student;
    const savedUser = savedStudent.user;
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual(
          expect.arrayContaining([
            {
              "Application Disability Status": "no",
              "Application Number": savedApplication.applicationNumber,
              "Assessment Date": getISODateOnlyString(
                savedApplication.currentAssessment.assessmentDate,
              ),
              "CIP Code": savedEducationProgram.cipCode,
              "Citizenship Status": applicationData.citizenship,
              "Estimated BCAG":
                assessmentData.finalProvincialAwardNetBCAGAmount.toString(),
              "Estimated BCSL":
                assessmentData.finalProvincialAwardNetBCSLAmount.toString(),
              "Estimated BGPD":
                assessmentData.finalProvincialAwardNetBGPDAmount.toString(),
              "Estimated CSGD":
                assessmentData.finalFederalAwardNetCSGDAmount.toString(),
              "Estimated CSGF":
                assessmentData.finalFederalAwardNetCSGFAmount.toString(),
              "Estimated CSGP":
                assessmentData.finalFederalAwardNetCSGPAmount.toString(),
              "Estimated CSLP": "",
              "Estimated CSPT": "",
              "Estimated SBSD":
                assessmentData.finalProvincialAwardNetSBSDAmount.toString(),
              "Federal Assessed Resources":
                assessmentData.totalFederalAssessedResources.toString(),
              "Federal assessed need":
                assessmentData.federalAssessmentNeed.toString(),
              "Federal/Provincial Assessed Costs":
                assessmentData.totalAssessedCost.toString(),
              "Independant/Dependant": applicationData.dependantstatus,
              "Indigenous person status": applicationData.indigenousStatus,
              "Institution Location Code": savedLocation.institutionCode,
              "Institution Location Name": savedLocation.name,
              "Marital Status":
                savedApplication.currentAssessment.application
                  .relationshipStatus,
              "Number of Eligible Dependants Total":
                savedApplication.currentAssessment.workflowData.calculatedData.totalEligibleDependents.toString(),
              "Offering Name": savedOffering.name,
              "Profile Disability Status": savedStudent.disabilityStatus,
              "Program Credential Type": savedEducationProgram.credentialType,
              "Program Length": savedEducationProgram.completionYears,
              "Program Name": savedEducationProgram.name,
              "Provincial Assessed Resources":
                assessmentData.totalProvincialAssessedResources.toString(),
              "Provincial assessed need":
                assessmentData.provincialAssessmentNeed.toString(),
              "SABC Program Code": "",
              SIN: savedStudent.sinValidation.sin,
              "Student Email Address": savedUser.email,
              "Student First Name": savedUser.firstName,
              "Student Last Name": savedUser.lastName,
              "Student Number": "",
              "Student Phone Number": savedStudent.contactInfo.phone,
              "Study End Date": savedOffering.studyEndDate,
              "Study Intensity (PT or FT)": savedOffering.offeringIntensity,
              "Study Start Date": savedOffering.studyStartDate,
              "Total assistance": assessmentData.finalAwardTotal.toString(),
              "Year of Study": savedOffering.yearOfStudy.toString(),
              "Youth in Care Flag": applicationData.youthInCare,
              "Youth in Care beyond age 19": "",
            },
          ]),
        );
      });
  });

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    const endpoint = "/institutions/report";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({})
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it(
    `Should generate the COE Requests report for both ${OfferingIntensity.fullTime} and ${OfferingIntensity.partTime} application disbursements` +
      ` and for the given program year when one or more applications which are neither in ${ApplicationStatus.Completed} or ${ApplicationStatus.Enrolment} status` +
      " exist for the given institution.",
    async () => {
      // Arrange
      const institution = await db.institution.save(
        createFakeInstitution({ institutionType: bcPublicInstitutionType }),
      );

      // Application in completed status with disbursements.
      const completedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          institution,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          currentAssessmentInitialValues: {
            workflowData: {
              calculatedData: {
                pdppdStatus: false,
              },
            } as WorkflowData,
            assessmentDate: new Date(),
          },
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            coeUpdatedAt: new Date(),
            tuitionRemittanceRequestedAmount: 100,
            dateSent: new Date(),
          },
        },
      );
      // Application in enrolment status with disbursements.
      const enrolmentApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          institution,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          currentAssessmentInitialValues: {
            workflowData: {
              calculatedData: {
                pdppdStatus: false,
              },
            } as WorkflowData,
            assessmentDate: new Date(),
          },
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Enrolment,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.required,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            tuitionRemittanceRequestedAmount: 100,
          },
        },
      );

      // Application in assessment status with disbursements.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          institution,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          currentAssessmentInitialValues: {
            workflowData: {
              calculatedData: {
                pdppdStatus: false,
              },
            } as WorkflowData,
            assessmentDate: new Date(),
          },
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Assessment,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.required,
            coeUpdatedAt: new Date(),
            tuitionRemittanceRequestedAmount: 100,
          },
        },
      );

      const programYearDefault = completedApplication.programYear;
      const payload = {
        reportName: "COE_Requests",
        params: {
          offeringIntensity: {
            "Full Time": true,
            "Part Time": true,
          },
          programYear: programYearDefault.id,
        },
      };

      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      const endpoint = "/institutions/report";
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Mock institution user authorization so that the user token will return the fake institution id and mocked roles.
      await mockInstitutionUserAuthorization(
        appModule,
        new InstitutionUserAuthorizations(institution.id, [
          {
            locationId: null,
            userRole: null,
            userType: InstitutionUserTypes.admin,
          },
        ]),
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          // Build expected result.
          const [firstReportDisbursement] =
            enrolmentApplication.currentAssessment.disbursementSchedules;
          const [secondReportDisbursement] =
            completedApplication.currentAssessment.disbursementSchedules;
          const firstReportDisbursementData = buildCOERequestsReportData(
            firstReportDisbursement,
            "1000.00",
            firstReportDisbursement.disbursementDate,
          );
          const secondReportDisbursementData = buildCOERequestsReportData(
            secondReportDisbursement,
            "1000.00",
            getISODateOnlyString(secondReportDisbursement.dateSent),
          );
          // Expect the disbursement for the application in `Assessment` status is not included in the report.
          expect(parsedResult.data.length).toBe(2);
          expect(parsedResult.data).toStrictEqual([
            firstReportDisbursementData,
            secondReportDisbursementData,
          ]);
        });
    },
  );

  it(
    "Should generate the COE Requests report without including application(s) that are archived" +
      " when one or more applications which are archived exist for the given institution.",
    async () => {
      // Arrange
      const institution = await db.institution.save(
        createFakeInstitution({ institutionType: bcPublicInstitutionType }),
      );

      // Application in completed status with disbursements and not archived.
      const notArchivedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          institution,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          currentAssessmentInitialValues: {
            workflowData: {
              calculatedData: {
                pdppdStatus: false,
              },
            } as WorkflowData,
            assessmentDate: new Date(),
          },
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            coeUpdatedAt: new Date(),
            tuitionRemittanceRequestedAmount: 100,
            dateSent: new Date(),
          },
        },
      );
      // Application to be archived.
      const archivedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          institution,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          currentAssessmentInitialValues: {
            workflowData: {
              calculatedData: {
                pdppdStatus: false,
              },
            } as WorkflowData,
            assessmentDate: new Date(),
          },
          applicationStatus: ApplicationStatus.Enrolment,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.required,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            coeUpdatedAt: new Date(),
            tuitionRemittanceRequestedAmount: 100,
          },
        },
      );
      archivedApplication.isArchived = true;
      await db.application.save(archivedApplication);

      const programYearDefault = notArchivedApplication.programYear;
      const payload = {
        reportName: "COE_Requests",
        params: {
          offeringIntensity: {
            "Full Time": true,
            "Part Time": true,
          },
          programYear: programYearDefault.id,
        },
      };

      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      const endpoint = "/institutions/report";
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Mock institution user authorization so that the user token will return the fake institution id and mocked roles.
      await mockInstitutionUserAuthorization(
        appModule,
        new InstitutionUserAuthorizations(institution.id, [
          {
            locationId: null,
            userRole: null,
            userType: InstitutionUserTypes.admin,
          },
        ]),
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          // Build expected result.
          const [firstReportDisbursement] =
            notArchivedApplication.currentAssessment.disbursementSchedules;
          const firstReportDisbursementData = buildCOERequestsReportData(
            firstReportDisbursement,
            "1000.00",
            getISODateOnlyString(firstReportDisbursement.dateSent),
          );

          // Expect the disbursement for the application which is not archived.
          expect(parsedResult.data.length).toBe(1);
          expect(parsedResult.data).toStrictEqual([
            firstReportDisbursementData,
          ]);
        });
    },
  );

  it(
    "Should generate the COE Requests report without application(s) that don't have estimated awards" +
      " when one or more applications exist for the given institution.",
    async () => {
      // Arrange
      const institution = await db.institution.save(
        createFakeInstitution({ institutionType: bcPublicInstitutionType }),
      );

      // Application with disbursements which have estimated awards.
      const applicationWithEstimatedAwards =
        await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student: sharedStudent,
            institution,
            disbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLF",
                1000,
              ),
            ],
          },
          {
            currentAssessmentInitialValues: {
              assessmentDate: new Date(),
            },
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              dateSent: new Date(),
            },
          },
        );
      // Application with disbursements which don't estimated awards.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          institution,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
          ],
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            hasEstimatedAwards: false,
          },
        },
      );

      const programYearDefault = applicationWithEstimatedAwards.programYear;
      const payload = {
        reportName: "COE_Requests",
        params: {
          offeringIntensity: {
            "Full Time": true,
            "Part Time": true,
          },
          programYear: programYearDefault.id,
        },
      };

      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.ExportFinancialReports,
        data: { data: payload },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      const endpoint = "/institutions/report";
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Mock institution user authorization so that the user token will return the fake institution id and mocked roles.
      await mockInstitutionUserAuthorization(
        appModule,
        new InstitutionUserAuthorizations(institution.id, [
          {
            locationId: null,
            userRole: null,
            userType: InstitutionUserTypes.admin,
          },
        ]),
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          const fileContent = response.request.res["text"];
          const parsedResult = parse(fileContent, {
            header: true,
          });
          // Build expected result.
          const [firstReportDisbursement] =
            applicationWithEstimatedAwards.currentAssessment
              .disbursementSchedules;
          const firstReportDisbursementData = buildCOERequestsReportData(
            firstReportDisbursement,
            "1000.00",
            getISODateOnlyString(firstReportDisbursement.dateSent),
          );
          // Expect the disbursement for the application which has estimated awards.
          expect(parsedResult.data.length).toBe(1);
          expect(parsedResult.data).toStrictEqual([
            firstReportDisbursementData,
          ]);
        });
    },
  );

  /**
   * Build COE Requests report data.
   * @param disbursements disbursements part of the report.
   * @param expectedDisbursementAmount expected total sum of disbursement amount.
   * @param expectedDisbursementDate expected disbursement date.
   * @returns report data.
   */
  function buildCOERequestsReportData(
    disbursement: DisbursementSchedule,
    expectedDisbursementAmount: string,
    expectedDisbursementDate: string,
  ): Record<string, string | number> {
    const application = disbursement.studentAssessment.application;
    return {
      "Student First Name": application.student.user.firstName,
      "Student Last Name": application.student.user.lastName,
      SIN: application.student.sinValidation.sin,
      "Student Number": "",
      "Student Email Address": application.student.user.email,
      "Student Phone Number": application.student.contactInfo.phone,
      "Application Number": application.applicationNumber,
      "Assessment Date": getPSTPDTDateTime(
        disbursement.studentAssessment.assessmentDate,
      ),
      "Program Name":
        disbursement.studentAssessment.offering.educationProgram.name,
      "Offering Name": application.currentAssessment.offering.name,
      "Study Intensity":
        disbursement.studentAssessment.offering.offeringIntensity,
      "Profile Disability Status": application.student.disabilityStatus,
      "Application Disability Status": String(
        disbursement.studentAssessment.workflowData.calculatedData.pdppdStatus,
      ),
      "Study Start Date":
        disbursement.studentAssessment.offering.studyStartDate,
      "Study End Date": disbursement.studentAssessment.offering.studyEndDate,
      "COE Status": disbursement.coeStatus,
      "COE Actioned": disbursement.coeUpdatedAt
        ? getPSTPDTDateTime(disbursement.coeUpdatedAt)
        : "",
      "Remittance Requested":
        disbursement.tuitionRemittanceRequestedAmount.toFixed(2),
      "Remittance Disbursed": disbursement.tuitionRemittanceEffectiveAmount
        ? disbursement.tuitionRemittanceEffectiveAmount.toFixed(2)
        : "",
      "Estimated Disbursement Amount": expectedDisbursementAmount,
      "Disbursement Date": expectedDisbursementDate,
    };
  }
});
