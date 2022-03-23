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
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
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
    applicationObject.NextSectionButton();
  });

  it("Check without selecting any mandatory fields in Program section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    cy.wait(2000);
    applicationObject.draftApplication().click({ force: true });
    cy.wait(2000);
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.NextSectionButton().click();
    applicationObject.NextSectionButton().click();
    applicationObject.errorMsgTxtForSchoolAttending().should("be.visible");
    applicationObject.selectStudyYearDropdown;
  });

  it("Verify that user must be redirect to previous form by clicking on button in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.NextSectionButton().click();
    applicationObject.NextSectionButton().click();
    cy.wait(2000);
    cy.go("back");
    applicationObject.verifyApplicationText().should("be.visible");
  });

  it("Verify that user able to check the checkbox in Program section in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.NextSectionButton().click();
    cy.wait(2000);
    applicationObject.mySchoolIsNotListedCheckbox().check();
    applicationObject.checkboxAlertMessage().should("be.visible");
  });

  it("Verify that user able to uncheck the checkbox in Program section in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.NextSectionButton().click();
    cy.wait(2000);
    applicationObject.mySchoolIsNotListedCheckbox().check();
    applicationObject.uncheckAlertMessage().click();
    applicationObject.checkboxNotExist().should("not.exist");
  });

  it("Verify that user able to edit all details in Program page in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.NextSectionButton().click();
    applicationObject.schoolIWillBeAttendingDropdown();
    applicationObject.howWillYouAttendProgramDropdown();
    applicationObject.inputStudentNumber();
  });

  it("Verify that Student number must have no more than 12 characters in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.NextSectionButton().click();
    applicationObject.incorrectStudentNumber().type("SDPLETW3543543FSFSD");
    applicationObject.incorrectStudentNumberText().should("be.visible");
  });

  it("Verify that user enter data in mandatory fields to save program in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.NextSectionButton().click();
    applicationObject.schoolIWillBeAttendingDropdown2();
    applicationObject.howWillYouAttendProgramDropdown2();
    applicationObject.programIWillBeAttendingDropdown2();
    applicationObject.inputStudentNumber2();
  });

  

});
