import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageUsersObject from "../../page-objects/Institution-objects/ManageUsersObject";
import LocationProgramObject from "../../page-objects/Institution-objects/LocationProgramObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Location Program", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const manageUsersObject = new ManageUsersObject();
  const locationProgramObject = new LocationProgramObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("institutionURL");

  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it("Verify that user redirect to location program page", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
  });

  it("Verify that search bar is working properly by searching incorrect word", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    manageUsersObject.searchUserInputText().type("Dummy data");
    manageUsersObject.searchButton().click();
  });

  it("Verify that without filling mandatory fields, proper error message must be displayed", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    locationProgramObject.createNewProgramButton().click();
    locationProgramObject.wait();
    locationProgramObject.submitButton().click();
    locationProgramObject.programNameErrorMessage().should("be.visible");
    locationProgramObject.credentialTypeErrorMessage().should("be.visible");
    locationProgramObject.cipCodeErrorMessage().should("be.visible");
    locationProgramObject.partTimeBasisErrorMessage().should("be.visible");
    locationProgramObject.programBeDeliveredErrorMessage().should("be.visible");
    locationProgramObject.programLengthErrorMessage().should("be.visible");
    locationProgramObject.programCourseLoadErrorMessage().should("be.visible");
    locationProgramObject.entranceRequiredErrorMessage().should("be.visible");
    locationProgramObject
      .percentageOfProgramESLErrorMessage()
      .should("be.visible");
    locationProgramObject
      .programOfferedJointlyErrorMessage()
      .should("be.visible");
    locationProgramObject
      .programWILComponentErrorMessage()
      .should("be.visible");
    locationProgramObject.fieldTripErrorMessage().should("be.visible");
    locationProgramObject
      .internationalExchangeErrorMessage()
      .should("be.visible");
    locationProgramObject.declarationErrorMessage().should("be.visible");
  });

  it("Verify that CIP code accept numbers only", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
    locationProgramObject.createNewProgramButton().click();
    cy.wait("@institution");
    locationProgramObject.cipCodeInputText().type("WALKER");
    locationProgramObject
      .cipCodeErrorMessageIncorrectFormat()
      .should("be.visible");
  });

  it.only("Check that user can able to add new program", { retries: 4 }, () => {
    cy.fixture("institutionProgramData").then((testdata) => {
      cy.intercept("GET", "**/institution").as("institution");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      locationProgramObject.createNewProgramButton().click();
      cy.wait("@institution");
      locationProgramObject.programNameInputText().type(testdata.programName);
      locationProgramObject
        .programDescriptionInputText()
        .type(testdata.programDescription);
      locationProgramObject
        .credentialType()
        .select(testdata.credentialType)
        .should("have.value", testdata.credentialTypeAssertion);
      locationProgramObject.cipCodeInputText().type(testdata.cipCode);
      locationProgramObject.partTimeBasisRadioButton().click();
      locationProgramObject.programBeDeliveredRadioButton().click();
      locationProgramObject
        .programLengthInputText()
        .select(testdata.programLength)
        .should("have.value", testdata.programLengthAssertion);
      locationProgramObject.programCourseLoadRadioButton().click();
      locationProgramObject
        .regulatoryBox()
        .select(testdata.regulatoryBox)
        .should("have.value", testdata.regulatoryBoxAssertion);
      locationProgramObject.entranceRequirementsCheckbox().click();
      locationProgramObject.wait();
      locationProgramObject.percentageOfProgramRadioButton().click();
      locationProgramObject.programOfferedJointlyRadioButton().click();
      locationProgramObject.institutionPartner().click();
      locationProgramObject.wilComponentRadioButton().click();
      locationProgramObject.wilApprovedByRegulatorRadioButton().click();
      locationProgramObject.wilMeetProgramRadioButton().click();
      locationProgramObject.fieldPlacementRadioButton().click();
      locationProgramObject.fieldPlacementEligibilityRadioButton().click();
      locationProgramObject.internationalExchangeRadioButton().click();
      locationProgramObject
        .internationalExchangeEligibilityRadioButton()
        .click();
      locationProgramObject.declarationCheckbox().click();
      locationProgramObject.submitButton().click();
      locationProgramObject.wait();
      cy.contains("Education Program created successfully!").should(
        "be.visible"
      );
    });
  });

  it("Verify that user able to edit created program", () => {
    cy.fixture("institutionProgramData").then((testdata) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      cy.wait("@location");
      locationProgramObject.firstRowEditButton().click();
      locationProgramObject.programNameAssertion(testdata.programName);
    });
  });

  it("Verify that user able to add study period", () => {
    cy.fixture("institutionProgramData").then((testdata) => {
      cy.intercept("GET", "**/education-program/**").as("educationProgram");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      cy.wait("@educationProgram");
      locationProgramObject.firstRowEditButton().click();
      locationProgramObject.programNameAssertion(testdata.programName);
      locationProgramObject.addStudyPeriodButton().click();
      locationProgramObject.addStudyPeriodAssertion().should("be.visible");
      locationProgramObject.wait();
      locationProgramObject
        .programNameStudyPeriod()
        .type(testdata.studyPeriodName);
      locationProgramObject.yearOfStudyDropdown().click();
      locationProgramObject
        .yearOfStudyDropdownInputText()
        .type(testdata.yearOfStudy)
        .type("{enter}");
      locationProgramObject.displayThisToStudentCheckbox().click();
      locationProgramObject.howWillThisBeOfferedRadioButton().click();
      locationProgramObject.offeringBeDeliveredRadioButton().click();
      locationProgramObject.workIntegratedComponentRadioButton().click();
      locationProgramObject.studyStartDate().type(testdata.startDate);
      locationProgramObject.studyEndDate().type(testdata.endDate);
      locationProgramObject.breakStartDate().type(testdata.breakStart);
      locationProgramObject.breakEndDate().type(testdata.breakEnd);
      locationProgramObject.actualTuitionInput().type(testdata.actualTuitions);
      locationProgramObject
        .programRelatedInput()
        .type(testdata.programRelatedCosts);
      locationProgramObject.mandatoryFeesInput().type(testdata.mandatoryFees);
      locationProgramObject
        .exceptionalExpensesInput()
        .type(testdata.exceptionalExpenses);
      locationProgramObject.tuitionRemittanceRadioButton().click();
      locationProgramObject
        .amountRequestedInput()
        .type(testdata.amountRequested);
      locationProgramObject.declarationFormForVerification().click();
      locationProgramObject.submitButtonStudyPeriod().click();
      cy.wait("@educationProgram");
      locationProgramObject
        .educationOfferingCreatedAssertion()
        .should("be.visible");
    });
  });

  it("Verify that search is working in study period offerings", () => {
    cy.fixture("institutionProgramData").then((testdata) => {
      cy.intercept("GET", "**/education-program/**").as("educationProgram");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      cy.wait("@educationProgram");
      locationProgramObject.firstRowEditButton().click();
      locationProgramObject.programNameAssertion(testdata.programName);
      locationProgramObject
        .searchStudyPeriodInput()
        .type(testdata.studyPeriodName)
        .type("{enter}");
      locationProgramObject
        .firstRecordAssertionStudyPeriod()
        .should("be.visible");
    });
  });
});
