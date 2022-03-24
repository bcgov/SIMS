import WelcomeObject from "../../page-objects/student-objects/WelcomeObject";
import LoginObject from "../../page-objects/student-objects/LoginObject";
import ApplicationObject from "../../page-objects/student-objects/ApplicationObject";

describe("Application Page", () => {
  const welcomeObject = new WelcomeObject();
  const loginObject = new LoginObject();
  const applicationObject = new ApplicationObject();

  const username = Cypress.env("cardSerialNumber");
  const password = Cypress.env("passcode");

  before("Login", () => {
    cy.visit("/");
    cy.intercept("PUT", "**/device").as("waitCardSerialNumber");
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait("@waitCardSerialNumber");
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    loginObject.cardSerialNumberContinueButton().click();
    loginObject
      .passcodeInputText()
      .type(password)
      .should("have.value", password);
    loginObject.passcodeContinueButton().click();
    loginObject.verifyLoggedInText();
  });

  it("Verify that user able to redirect to Application Page", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.verifyApplicationText().should("be.visible");
  });

  it("Verify that Start New Application button must be present on the page & clickable", () => {
    applicationObject.startNewApplicationButton().should("be.visible").click();
    applicationObject.verifyStartNewApplicationText().should("be.visible");
    cy.go("back");
  });

  it("Verify that Start Application button must be disable if study year not selected in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.startNewApplicationButton().should("be.visible").click();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
  });

  it("Verify that Start Application button must be enable if study year selected in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.startNewApplicationButton().should("be.visible").click();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
    applicationObject.selectStudyYearDropdown();
    applicationObject
      .startApplicationStudyYearEnableButton()
      .should("not.exist");
  });

  it("Verify that Start Application button must be disable if selected study year is removed in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.startNewApplicationButton().should("be.visible").click();
    applicationObject.selectStudyYearDropdown();
    applicationObject
      .startApplicationStudyYearEnableButton()
      .should("not.exist");
    applicationObject.removedButton().click();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
  });

  it("Verify that Start Application button must be clickable in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.startNewApplicationButton().should("be.visible").click();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
    applicationObject.selectStudyYearDropdown();
    applicationObject
      .startApplicationStudyYearEnableButton()
      .should("not.exist");

    //Info:- On click -> Alert in progress popup open
    applicationObject.startApplicationTuitionWaiverButton().click();
    applicationObject.applicationAlreadyInProgressText().should("be.visible");
    applicationObject.applicationAlreadyInProgressTextCard().click();

    applicationObject.startApplicationBCloanForgivenessProgramButton();
    applicationObject.applicationAlreadyInProgressText().should("be.visible");
    applicationObject.applicationAlreadyInProgressTextCard().click();

    applicationObject.startApplicationPacificLeaderLoanForgivenessButton();
    applicationObject.applicationAlreadyInProgressText().should("be.visible");
    applicationObject.applicationAlreadyInProgressTextCard().click();

    applicationObject.startApplicationInterestFreeStatusButton();
    applicationObject.applicationAlreadyInProgressText().should("be.visible");
    applicationObject.applicationAlreadyInProgressTextCard().click();
  });

  it("By clicking on edit button it redirects to Welcome Page in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
  });

  it("By clicking on Next Section button from Welcome Page it redirects to Program Page in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton();
  });

  it("Check without selecting any mandatory fields in Program section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    cy.wait(2000);
    applicationObject.draftApplication().click({ force: true });
    cy.wait(2000);
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    applicationObject.nextSectionButton().click();
    applicationObject.errorMsgTxtForSchoolAttending().should("be.visible");
    applicationObject.selectStudyYearDropdown();
  });

  it("Verify that user must be redirect to previous form by clicking on button in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    applicationObject.nextSectionButton().click();
    cy.wait(2000);
    cy.go("back");
    applicationObject.verifyApplicationText().should("be.visible");
  });

  it("Verify that user able to check the checkbox in Program section in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    cy.wait(2000);
    applicationObject.mySchoolIsNotListedCheckbox().check();
    applicationObject.checkboxAlertMessage().should("be.visible");
  });

  it("Verify that user able to uncheck the checkbox in Program section in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    cy.wait(2000);
    applicationObject.mySchoolIsNotListedCheckbox().check();
    applicationObject.uncheckAlertMessage().click();
    applicationObject.checkboxAlertMessage().should("not.exist");
  });

  it("Verify that user able to edit all details in Program page in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    applicationObject.schoolIWillBeAttendingDropdown();
    applicationObject.howWillYouAttendProgramDropdown();
    applicationObject.inputStudentNumber();
  });

  it("Verify that Student number must have no more than 12 characters in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    cy.wait(2000);
    applicationObject.incorrectStudentNumber().type("SDPLETW3543543FSFSD");
    applicationObject.incorrectStudentNumberText().should("be.visible");
  });

  it("Verify that user enter data in mandatory fields to save program in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    applicationObject.schoolIWillBeAttendingDropdown2();
    applicationObject.howWillYouAttendProgramDropdown2();
    applicationObject.programIWillBeAttendingDropdown2();
    applicationObject.inputStudentNumber2();
  });

  it.skip("Verify that user redirect to Personal Information page from Program page in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    applicationObject.schoolIWillBeAttendingDropdown2();
    applicationObject.howWillYouAttendProgramDropdown2();
    applicationObject.myStudyPeriodIsNotListedCheckbox();
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.programName().type(testData.programNameData);
      applicationObject
        .programDescription()
        .type(testData.programDescriptionData);
    });
    applicationObject.studyStartDate();
    applicationObject.studyEndDate();
    applicationObject.inputStudentNumber2();
    applicationObject.nextSectionButton().click();
  });
});
