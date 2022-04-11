import LoginInstituteObject from "../../page-objects/institute-objects/LoginInstituteObject";
import DashboardInstituteObject from "../../page-objects/institute-objects/DashboardInstituteObject";
import ManageUsersObject from "../../page-objects/institute-objects/ManageUsersObject";
import LocationProgramObject from "../../page-objects/institute-objects/LocationProgramObject";

describe("Location Program", () => {
  const loginInstituteObject = new LoginInstituteObject();
  const dashboardInstituteObject = new DashboardInstituteObject();
  const manageUsersObject = new ManageUsersObject();
  const locationProgramObject = new LocationProgramObject();

  const url = Cypress.env("instituteURL");
  const username = Cypress.env("bceid");
  const password = Cypress.env("password");

  beforeEach(() => {
    cy.visit(url);
    cy.intercept("GET", "**/bceid-account").as("bceidAccount");
    loginInstituteObject.loginWithBCEID().should("be.visible").click();
    loginInstituteObject.loginInWithBCEIDtext().should("be.visible");
    loginInstituteObject
      .bceidInputText()
      .type(username)
      .should("have.value", username);
    loginInstituteObject
      .passwordInputText()
      .type(password)
      .should("have.value", password);
    loginInstituteObject.continueButton().click();
    cy.wait("@bceidAccount");
  });

  it("Verify that user redirect to location program page", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
  });

  it("Verify that search bar is working properly by searching incorrect word", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.programsButton().eq(0).click();
    manageUsersObject.searchUserInputText().type("Dummy data");
    manageUsersObject.searchButton().click();
    manageUsersObject.noRecordsFoundMessage().should("be.visible");
    manageUsersObject.zeroUserContains().should("be.visible");
  });

  it("Verify that without filling mandatory fields, proper error message must be displayed", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.programsButton().eq(0).click();
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
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
    locationProgramObject.createNewProgramButton().click();
    locationProgramObject.wait();
    locationProgramObject.cipCodeInputText().type("WALKER");
    locationProgramObject
      .cipCodeErrorMessageIncorrectFormat()
      .should("be.visible");
  });

  it("Check that user can able to add new program", () => {
    cy.fixture("instituteProgramData").then((testdata) => {
      dashboardInstituteObject.dashboardButton().click();
      dashboardInstituteObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      locationProgramObject.createNewProgramButton().click();
      locationProgramObject.wait();
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
    cy.fixture("instituteProgramData").then((testdata) => {
      dashboardInstituteObject.dashboardButton().click();
      dashboardInstituteObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      locationProgramObject.wait();
      locationProgramObject.firstRowEditButton().click();
      locationProgramObject.programNameAssertion(testdata.programName);
    });
  });

  it.only("Verify that user able to add study period", () => {
    cy.fixture("instituteProgramData").then((testdata) => {
      dashboardInstituteObject.dashboardButton().click();
      dashboardInstituteObject.programsButton().eq(0).click();
      cy.url().should("contain", "/location-programs");
      locationProgramObject.wait();
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
      locationProgramObject.howWillThisBeOfferedCheckbox().click();
    });
  });
});
