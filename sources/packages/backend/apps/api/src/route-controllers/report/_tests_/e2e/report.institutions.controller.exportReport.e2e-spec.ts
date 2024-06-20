import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  ApplicationData,
  ApplicationStatus,
  Assessment,
  FullTimeAssessment,
  Institution,
  InstitutionLocation,
  ProgramYear,
  User,
  WorkflowData,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  ensureProgramYearExists,
  getProviderInstanceForModule,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
} from "../../../../testHelpers";
import { parse } from "papaparse";
import * as request from "supertest";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import { FormNames, FormService } from "../../../../services";
import { TestingModule } from "@nestjs/testing";
import { getISODateOnlyString } from "@sims/utilities";

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
  const PROGRAM_YEAR_PREFIX = 2010;

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
});
