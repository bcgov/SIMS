import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  ApplicationStatus,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import {
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  getProviderInstanceForModule,
  saveFakeApplication,
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
import { DataSource, Repository } from "typeorm";
import { parse } from "papaparse";
import * as request from "supertest";
import { SystemUsersService } from "@sims/services";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import { FormService } from "../../../../services";
import { TestingModule } from "@nestjs/testing";

describe("ReportInstitutionsController(e2e)-exportReport", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;
  let offeringRepo: Repository<EducationProgramOffering>;
  let systemUsersService: SystemUsersService;
  let formService: FormService;
  const REPORT_FORM_NAME = "exportfinancialreports";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    // Mock the form service to validate the dry-run submission result.
    formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    // College C.
    const { institution: collegeC } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    offeringRepo = appDataSource.getRepository(EducationProgramOffering);
    systemUsersService = nestApplication.get(SystemUsersService);
  });

  it("Should generate the offering details report when a report generation request is made with the appropriate parameters i.e. program year and the offering intensity", async () => {
    // Arrange

    // Created 3 offerings as follows:
    // 1st offering with 0 applications.
    // 2nd offering with two applications for two different students belonging to the location of the institution for which the report is generated.
    // 3rd offering with an application for a student belonging to the location of a different institution for which this report is not generated.
    const auditUser = systemUsersService.systemUser;
    const student = await saveFakeStudent(appDataSource);
    // 1st offering: with no submitted applications to it.
    const firstFakeOffering = createFakeEducationProgramOffering(
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        auditUser,
      },
      { initialValues: { studyStartDate: "2022-09-01" } },
    );
    const firstSavedOffering = await offeringRepo.save(firstFakeOffering);
    // 2nd offering: with an application belonging to the location of the institution for which the report is generated.
    const secondFakeOffering = createFakeEducationProgramOffering(
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        auditUser,
      },
      { initialValues: { studyStartDate: "2022-09-01" } },
    );
    const secondSavedOffering = await offeringRepo.save(secondFakeOffering);
    await saveFakeApplication(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
        offering: secondSavedOffering,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
    // 3rd offering: with an application belonging to the location of the institution for which the report is not generated.
    const thirdFakeOffering = createFakeEducationProgramOffering(
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        auditUser,
      },
      { initialValues: { studyStartDate: "2022-09-01" } },
    );
    const thirdSavedOffering = await offeringRepo.save(thirdFakeOffering);
    await saveFakeApplication(
      appDataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
        student,
        offering: thirdSavedOffering,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const payload = {
      reportName: "Offering_Details_Report",
      params: {
        offeringIntensity: {
          "Full Time": true,
          "Part Time": false,
        },
        programYear: 2,
      },
    };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: REPORT_FORM_NAME,
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
          delimiter: ",",
          header: true,
          skipEmptyLines: "greedy",
        });
        expect(parsedResult.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              "Institution Location Code": collegeFLocation.institutionCode,
              Program: secondSavedOffering.educationProgram.name,
              "SABC Program Code":
                secondSavedOffering.educationProgram.sabcCode ?? "",
              "Offering Name": secondSavedOffering.name,
              "Year of Study": secondSavedOffering.yearOfStudy.toString(),
              "Offering Intensity": secondSavedOffering.offeringIntensity,
              "Course Load": secondSavedOffering.courseLoad.toString(),
              "Delivery Type": secondSavedOffering.offeringDelivered,
              "WIL Component": secondSavedOffering.hasOfferingWILComponent,
              "WIL Component Type": secondSavedOffering.offeringWILType ?? "",
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
            }),
            expect.objectContaining({
              "Institution Location Code": collegeFLocation.institutionCode,
              Program: firstSavedOffering.educationProgram.name,
              "SABC Program Code":
                firstSavedOffering.educationProgram.sabcCode ?? "",
              "Offering Name": firstSavedOffering.name,
              "Year of Study": firstSavedOffering.yearOfStudy.toString(),
              "Offering Intensity": firstSavedOffering.offeringIntensity,
              "Course Load": firstSavedOffering.courseLoad.toString(),
              "Delivery Type": firstSavedOffering.offeringDelivered,
              "WIL Component": firstSavedOffering.hasOfferingWILComponent,
              "WIL Component Type": firstSavedOffering.offeringWILType ?? "",
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
            }),
            expect.not.objectContaining({
              "Institution Location Code": collegeCLocation.institutionCode,
              Program: thirdSavedOffering.educationProgram.name,
              "SABC Program Code":
                thirdSavedOffering.educationProgram.sabcCode ?? "",
              "Offering Name": thirdSavedOffering.name,
              "Year of Study": thirdSavedOffering.yearOfStudy.toString(),
              "Offering Intensity": thirdSavedOffering.offeringIntensity,
              "Course Load": thirdSavedOffering.courseLoad.toString(),
              "Delivery Type": thirdSavedOffering.offeringDelivered,
              "WIL Component": thirdSavedOffering.hasOfferingWILComponent,
              "WIL Component Type": thirdSavedOffering.offeringWILType ?? "",
              "Start Date": thirdSavedOffering.studyStartDate,
              "End Date": thirdSavedOffering.studyEndDate,
              "Has Study Breaks":
                (!thirdSavedOffering.lacksStudyBreaks).toString(),
              "Actual Tuition":
                thirdSavedOffering.actualTuitionCosts.toString(),
              "Program Related Costs":
                thirdSavedOffering.programRelatedCosts.toString(),
              "Mandatory Fees": thirdSavedOffering.mandatoryFees.toString(),
              "Exceptional Expenses":
                thirdSavedOffering.exceptionalExpenses.toString(),
              "Offering Type": thirdSavedOffering.offeringType,
              Status: thirdSavedOffering.offeringStatus,
              "Funded Weeks":
                thirdSavedOffering.studyBreaks.totalFundedWeeks.toString(),
              "Total Applications": "",
            }),
          ]),
        );
      });
  });
});
