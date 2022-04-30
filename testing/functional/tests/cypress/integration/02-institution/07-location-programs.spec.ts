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

  it(
    "Verify that user redirect to location program page",
    { retries: 4 },
    () => {
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
    }
  );

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

  it("Check that user can able to add new program", { retries: 4 }, () => {
    cy.fixture("institutionProgramData").then((_testData) => {
      cy.intercept("GET", "**/institution").as("institution");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      locationProgramObject.createNewProgramButton().click();
      cy.wait("@institution");
      locationProgramObject.programNameInputText().type(_testData.programName);
      locationProgramObject
        .programDescriptionInputText()
        .type(_testData.programDescription);
      locationProgramObject
        .credentialType()
        .select(_testData.credentialType)
        .should("have.value", _testData.credentialTypeAssertion);
      locationProgramObject.cipCodeInputText().type(_testData.cipCode);
      locationProgramObject.partTimeBasisRadioButton().click();
      locationProgramObject.programBeDeliveredRadioButton().click();
      locationProgramObject
        .programLengthInputText()
        .select(_testData.programLength)
        .should("have.value", _testData.programLengthAssertion);
      locationProgramObject.programCourseLoadRadioButton().click();
      locationProgramObject
        .regulatoryBox()
        .select(_testData.regulatoryBox)
        .should("have.value", _testData.regulatoryBoxAssertion);
      locationProgramObject.entranceRequirementsCheckbox().click();
      locationProgramObject.wait();
      locationProgramObject.percentageOfProgramRadioButton().click();
      locationProgramObject.programOfferedJointlyRadioButton().click();
      locationProgramObject.institutionPartner().click();
      locationProgramObject.wilComponentRadioButton().click();
      locationProgramObject.wilApprovedByRegulatorRadioButton().click();
      locationProgramObject.wait();
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
    cy.fixture("institutionProgramData").then((_testData) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      cy.wait("@location");
      locationProgramObject.firstRowEditButton().click();
      locationProgramObject.programNameAssertion(_testData.programName);
    });
  });

  it("Verify that user able to add study period", () => {
    cy.fixture("institutionProgramData").then((_testData) => {
      cy.intercept("GET", "**/education-program/**").as("educationProgram");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      cy.wait("@educationProgram");
      locationProgramObject.firstRowEditButton().click();
      locationProgramObject.programNameAssertion(_testData.programName);
      locationProgramObject.addStudyPeriodButton().click();
      locationProgramObject.addStudyPeriodAssertion().should("be.visible");
      locationProgramObject.wait();
      locationProgramObject
        .programNameStudyPeriod()
        .type(_testData.studyPeriodName);
      locationProgramObject.yearOfStudyDropdown().click();
      locationProgramObject
        .yearOfStudyDropdownInputText()
        .type(_testData.yearOfStudy)
        .type("{enter}");
      locationProgramObject.displayThisToStudentCheckbox().click();
      locationProgramObject.howWillThisBeOfferedRadioButton().click();
      locationProgramObject.offeringBeDeliveredRadioButton().click();
      locationProgramObject.workIntegratedComponentRadioButton().click();
      locationProgramObject.studyStartDate().type(_testData.startDate);
      locationProgramObject.studyEndDate().type(_testData.endDate);
      locationProgramObject.breakStartDate().type(_testData.breakStart);
      locationProgramObject.breakEndDate().type(_testData.breakEnd);
      locationProgramObject.actualTuitionInput().type(_testData.actualTuitions);
      locationProgramObject
        .programRelatedInput()
        .type(_testData.programRelatedCosts);
      locationProgramObject.mandatoryFeesInput().type(_testData.mandatoryFees);
      locationProgramObject
        .exceptionalExpensesInput()
        .type(_testData.exceptionalExpenses);
      locationProgramObject.tuitionRemittanceRadioButton().click();
      locationProgramObject
        .amountRequestedInput()
        .type(_testData.amountRequested);
      locationProgramObject.declarationFormForVerification().click();
      locationProgramObject.submitButtonStudyPeriod().click();
      cy.wait("@educationProgram");
      locationProgramObject
        .educationOfferingCreatedAssertion()
        .should("be.visible");
    });
  });

  it("Verify that search is working in study period offerings", () => {
    cy.fixture("institutionProgramData").then((_testData) => {
      cy.intercept("GET", "**/education-program/**").as("educationProgram");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      cy.wait("@educationProgram");
      locationProgramObject.firstRowEditButton().click();
      locationProgramObject.programNameAssertion(_testData.programName);
      locationProgramObject
        .searchStudyPeriodInput()
        .type(_testData.studyPeriodName)
        .type("{enter}");
      locationProgramObject
        .firstRecordAssertionStudyPeriod()
        .should("be.visible");
    });
  });
});
