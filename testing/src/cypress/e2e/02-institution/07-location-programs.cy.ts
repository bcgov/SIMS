import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageUsersObject from "../../page-objects/Institution-objects/ManageUsersObject";
import LocationProgramObject from "../../page-objects/Institution-objects/LocationProgramObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import { programData } from "../../../data/dev/institution-data/institutionProgramData";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const manageUsersObject = new ManageUsersObject();
const locationProgramObject = new LocationProgramObject();
const institutionHelperActions = new InstitutionHelperActions();

describe("Location Program", () => {
  beforeEach(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
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

  it("Check that user can able to add new program", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
    locationProgramObject.createNewProgramButton().click();
    cy.wait("@institution");
    locationProgramObject.programNameInputText().type(programData.programName);
    locationProgramObject
      .programDescriptionInputText()
      .type(programData.programDescription);
    locationProgramObject
      .credentialType()
      .select(programData.credentialType)
      .should("have.value", programData.credentialTypeAssertion);
    locationProgramObject.cipCodeInputText().type(programData.cipCode);
    locationProgramObject.nocInputText().type(programData.noc);
    locationProgramObject.sabcInputText().type(programData.sab);

    locationProgramObject.partTimeBasisRadioButton().click();
    locationProgramObject.programBeDeliveredRadioButton().click();
    locationProgramObject
      .programLengthInputText()
      .select(programData.programLength)
      .should("have.value", programData.programLengthAssertion);
    locationProgramObject.programCourseLoadRadioButton().click();
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
    locationProgramObject.declarationCheckbox().click();
    locationProgramObject.submitButton().click();
    locationProgramObject.wait();
    locationProgramObject.educationCreatedMessage().should("be.visible");
  });

  it("Verify that user able to edit created program", () => {
    cy.intercept("GET", "**/location/**").as("location");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
    cy.wait("@location");
    locationProgramObject.firstRowEditButton().click();
  });

  it.only("Verify that user able to add study period", () => {
    cy.intercept("GET", "**/education-program/**").as("educationProgram");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
    cy.wait("@educationProgram");
    locationProgramObject.firstRowEditButton().click();
    locationProgramObject.addStudyPeriodButton().click();
    locationProgramObject.wait();
    locationProgramObject
      .programNameStudyPeriod()
      .type(programData.studyPeriodName);
    locationProgramObject.yearOfStudyDropdown().click();
    locationProgramObject
      .yearOfStudyDropdownInputText()
      .type(programData.yearOfStudy)
      .type("{enter}");
    locationProgramObject.displayThisToStudentCheckbox().click();
    locationProgramObject.howWillThisBeOfferedRadioButton().click();
    locationProgramObject.offeringBeDeliveredRadioButton().click();
    locationProgramObject.workIntegratedComponentRadioButton().click();
    locationProgramObject.studyStartDate().type(programData.startDate);
    locationProgramObject.studyEndDate().type(programData.endDate);
    locationProgramObject.breakStartDate().type(programData.breakStart);
    locationProgramObject.breakEndDate().type(programData.breakEnd);
    locationProgramObject.actualTuitionInput().type(programData.actualTuitions);
    locationProgramObject
      .programRelatedInput()
      .type(programData.programRelatedCosts);
    locationProgramObject.mandatoryFeesInput().type(programData.mandatoryFees);
    locationProgramObject
      .exceptionalExpensesInput()
      .type(programData.exceptionalExpenses);
    locationProgramObject.tuitionRemittanceRadioButton().click();
    locationProgramObject.addStudyPeriodRadioButton().click({ force: true });
    locationProgramObject.declarationFormForVerification().click();
  });

  it("Verify that search is working in study period offerings", () => {
    cy.intercept("GET", "**/education-program/**").as("educationProgram");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    cy.url().should("contain", "/location-programs");
    cy.wait("@educationProgram");
    locationProgramObject.firstRowEditButton().click();
    locationProgramObject
      .searchStudyPeriodInput()
      .type(programData.studyPeriodName)
      .type("{enter}");
    locationProgramObject
      .firstRecordAssertionStudyPeriod()
      .should("be.visible");
  });
});
