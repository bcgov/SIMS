import ApplicationObject from "../../page-objects/student-objects/ApplicationObject";
import StudentCustomCommand from "../../custom-command/student/StudentCustomCommand";
import { draftApplication } from "../../../data/dev/student-data/studentDraftApplication";

const applicationObject = new ApplicationObject();
const studentCustomCommand = new StudentCustomCommand();
const url = Cypress.env("studentURL");

function draftApplicationVerify() {
  cy.intercept("GET", "**/api/**").as("applicationSummary");
  applicationObject.applicationButton().should("be.visible").click();
  cy.wait("@applicationSummary");
  cy.focused().click();
  applicationObject.draftApplication().click();
  applicationObject.draftApplicationVerifyText().should("be.visible");
  applicationObject.nextSectionButton().click();
}

function startNewApplication() {
  applicationObject.applicationButton().should("be.visible").click();
  applicationObject.startNewApplicationButton().should("be.visible").click();
}

function personalInformationSection() {
  draftApplicationVerify();
  applicationObject.schoolIWillBeAttendingDropdown2();
  applicationObject.howWillYouAttendProgramDropdown2();
  cy.focused().click();
  applicationObject.myProgramNotListedCheckbox().click({ force: true });
  applicationObject.programName().type(draftApplication.programNameData);
  applicationObject
    .programDescription()
    .type(draftApplication.programDescriptionData);
  applicationObject.studyStartDate();
  applicationObject.studyEndDate();
  applicationObject.inputStudentNumber2();
  applicationObject.nextSectionButton().click();
}

function fieldsForPersonalInformation() {
  cy.intercept("GET", "**/program-year").as("programYear");
  draftApplicationVerify();
  applicationObject.personalInformationButton().click({ force: true });
  applicationObject.iConfirmMyStudentAidCheckbox().click({ force: true });
  applicationObject.citizenStatusRadioButton().click();
  applicationObject.residentOfBCRadioButton().click({ force: true });
  applicationObject.residenceNoneOfTheAboveRadioButton().click();
  applicationObject
    .explainSituationInputField()
    .type("I applied but haven't received confirmation yet.");
  applicationObject.indigenousPersonRadioButton().click();
  applicationObject.aboriginalRadioButton().click();
  applicationObject.legalGuardianRadioButton().click();
  applicationObject.courseStudyStartDateRadioButton().click();
  applicationObject.whenDidYouGraduateInputText().type("2023-12-01");
  applicationObject.workingFullTimeRadioButton().click();
  applicationObject.fullTimeLaborForceRadioButton().click();
  applicationObject.allowTrustContactRadioButton().click();
  applicationObject.nextSectionButton().click();
}

function partnerInformationSection() {
  fieldsForPersonalInformation();
  applicationObject.marriedRadioButton().click();
  applicationObject.dateOfMarriage().type("2023-12-01");
  applicationObject.dependRadioButton().click();
  applicationObject.fullNameText().type("Jason Holder");
  applicationObject.dateOfBirth().type("2003-07-01");
  applicationObject.attendingPostSecondarySchoolRadioButton().click();
  applicationObject.declaredOnTaxesRadioButton().click();
  applicationObject.addAnotherDependantButton().click();
  applicationObject.secondCloseButton().click({ force: true });
  applicationObject.doYouHaveDependentSupportRadioButton().click();
}

function financialInformationSection() {
  cy.intercept("GET", "**/program-year").as("programYear");
  draftApplicationVerify();
  applicationObject.schoolIWillBeAttendingDropdown2();
  applicationObject.howWillYouAttendProgramDropdown2();
  applicationObject.myStudyPeriodIsNotListedCheckbox();
  applicationObject.applicationButton().should("be.visible").click();
  cy.wait("@applicationSummary");
  cy.focused().click();
  applicationObject.draftApplication().click();
  applicationObject.draftApplicationVerifyText().should("be.visible");
  applicationObject.nextSectionButton().click();
  cy.wait("@programYear");
  cy.focused().click();
  applicationObject.financialInformationButton().click({ force: true });
  applicationObject.financialInformationButton().click({ force: true });
  applicationObject.totalIncomeInputText().type(draftApplication.totalIncome);

  applicationObject.iGiveCanadianRevenueCheckbox().click();
  applicationObject.yearEstimatedIncomeRadioButton().click();
  applicationObject
    .currentYearIncomeInputText()
    .type(draftApplication.currentYearIncome);
  applicationObject.reasonForDecreaseIncomeRadioButton().click();
  applicationObject.exceptionalExpensesRadioButton().click();
  applicationObject.childDaycareRadioButton().click();
  applicationObject.childDaycareInputText().type(draftApplication.childDaycare);
  applicationObject.classHoursDisabledRadioButton().click();
  applicationObject
    .classHoursDisabledInputText()
    .type(draftApplication.classHours);
  applicationObject.payingChildSupportRadioButton().click();
  applicationObject.meritBasedRadioButtonRadioButton().click();
  applicationObject.meritBasedInputText().type(draftApplication.meritBased);
  applicationObject.receiveVoluntaryRadioButton().click();
  applicationObject.govtFundingRadioButton().click();
  applicationObject.govtFundingInputText().type(draftApplication.govtFunding);
  applicationObject.nonGovtFundingRadioButton().click();
  applicationObject.bcIncomeAssistanceRadioButton().click();
  applicationObject.homePaidByOurParentsRadioButton().click();
  applicationObject.relocateToDifferentCityRadioButton().click();
  applicationObject
    .oneReturnTripInputText()
    .type(draftApplication.oneReturnTrip);
  applicationObject.additionalTransportationCostsRadioButton().click();
  applicationObject.describeSituationRadioButton().click();
  applicationObject
    .weeklyTransportationCostsInputText()
    .type(draftApplication.classHours);
  applicationObject.nextSectionButton().click();
}

describe("Application Page", () => {
  beforeEach("Login", () => {
    cy.reload();
    cy.visit(url);
    studentCustomCommand.loginStudent();
    cy.intercept("GET", "**/api/**").as("applicationSummary");
  });

  it("Verify that user able to redirect to Application Page", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.verifyApplicationText().should("be.visible");
  });

  it("Verify that Start New Application button must be present on the page & clickable", () => {
    startNewApplication();
    applicationObject.verifyStartNewApplicationText().should("be.visible");
    cy.go("back");
  });

  it("Verify that Start Application button must be disable if study year not selected in application form.", () => {
    startNewApplication();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
  });

  it("Check that Start Application button is enabled if a study year is selected in the application form.", () => {
    startNewApplication();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
    applicationObject.selectStudyYearDropdown(draftApplication.selectStudyYear);
  });

  it("Verify that Start Application button must be disable if selected study year is removed in application form.", () => {
    startNewApplication();
    applicationObject.selectStudyYearDropdown(draftApplication.selectStudyYear);
    applicationObject.removedButton().click();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
  });

  it("Verify that Start Application button must be clickable in application form.", () => {
    startNewApplication();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
    applicationObject.selectStudyYearDropdown(draftApplication.selectStudyYear);

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
    cy.wait("@applicationSummary");
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
  });

  it("By clicking on Next Section button from Welcome Page it redirects to Program Page in application form.", () => {
    draftApplicationVerify();
  });

  it("Check without selecting any mandatory fields in Program section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
    draftApplicationVerify();
    applicationObject.nextSectionButton().click();
    applicationObject.errorMsgTxtForSchoolAttending().should("be.visible");
    applicationObject.selectStudyYearDropdown(draftApplication.selectStudyYear);
  });

  it("Verify that user must be redirect to previous form by clicking on button in application form.", () => {
    draftApplicationVerify();
    applicationObject.nextSectionButton().click();
    cy.go("back");
    applicationObject.verifyApplicationText().should("be.visible");
  });

  it("Verify that user able to check the checkbox in Program section in application form.", () => {
    draftApplicationVerify();
    applicationObject.mySchoolIsNotListedCheckbox().check();
    applicationObject.checkboxAlertMessage().should("be.visible");
  });

  it("Verify that user able to uncheck the checkbox in Program section in application form.", () => {
    draftApplicationVerify();
    applicationObject.mySchoolIsNotListedCheckbox().click();
    applicationObject.uncheckAlertMessage().click();
    applicationObject.checkboxAlertMessage().should("not.exist");
  });

  it("Verify that user able to edit all details in Program page in application form.", () => {
    draftApplicationVerify();
    applicationObject.schoolIWillBeAttendingDropdown2();
    applicationObject.howWillYouAttendProgramDropdown2();
    applicationObject.inputStudentNumber();
  });

  it("Verify that Student number must have no more than 12 characters in application form.", () => {
    draftApplicationVerify();
    applicationObject.nextSectionButton().click();
    applicationObject.incorrectStudentNumber().type("SDPLETW3543543FSFSD");
    applicationObject.incorrectStudentNumberText().should("be.visible");
  });

  it("Verify that user enter data in mandatory fields to save program in application form.", () => {
    draftApplicationVerify();
    applicationObject.schoolIWillBeAttendingDropdown2();
    applicationObject.howWillYouAttendProgramDropdown2();
    applicationObject.programIWillBeAttendingDropdown2();
    applicationObject.inputStudentNumber2();
  });

  it("Verify that user redirect to Personal Information page from Program page in application form.", () => {
    personalInformationSection();
  });

  it("Check without selecting any mandatory fields in Personal Information section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
    personalInformationSection();
    applicationObject.nextSectionButton().click();
    applicationObject.pleaseFixErrorBeforeSubmittingText().should("be.visible");
  });

  it("Verify that all mandatory fields in the Personal information page have error messages displayed if they are not filled out.", () => {
    personalInformationSection();
    applicationObject.nextSectionButton().click();
    applicationObject.pleaseFixErrorBeforeSubmittingText().should("be.visible");
    applicationObject.iConfirmMyStudentText().should("be.visible");
    applicationObject.citizenshipStatusText().should("be.visible");
    applicationObject.areYouResidentText().should("be.visible");
    applicationObject.identifyAsIndigenousText().should("be.visible");
    applicationObject.youthInContinuingText().should("be.visible");
    applicationObject.outOfHighSchoolText().should("be.visible");
    applicationObject.graduateOrLeaveHighSchoolText().should("be.visible");
    applicationObject
      .employmentInformationIsRequiredText()
      .should("be.visible");
    applicationObject.leftSchoolFirstDayOfClassText().should("be.visible");
    applicationObject.trustedContactText().should("be.visible");
  });

  it("Check that by clicking on Student Profile redirects to student information.", () => {
    personalInformationSection();
    applicationObject.studentProfileButton().click();
  });

  it("Verify that redirects to Student Profile by clicking Student Profile button from Personal Information.", () => {
    personalInformationSection();
    applicationObject.studentProfileButton().click();
  });

  it("Check that all fields on the Personal Information page are working.", () => {
    fieldsForPersonalInformation();
  });

  it("Check that all fields on the Family Information page are working.", () => {
    partnerInformationSection();
  });

  it("Check that previous button is working in family information page.", () => {
    partnerInformationSection();
    applicationObject.previousSectionButton().click();
    applicationObject.previousSectionButton().click();
    applicationObject.previousSectionButton().click();
    applicationObject.welcomeText().should("be.visible");
  });

  it("Verify that condition-based records are displaying or not in partner Information.", () => {
    partnerInformationSection();
    applicationObject.nextSectionButton().click();
    applicationObject.yesSocialInsuranceNumber().click();
    applicationObject.yesSocialInsuranceNumberMessage().should("be.visible");
  });

  it("Check that all fields on the Partner information page are working.", () => {
    partnerInformationSection();
    applicationObject.nextSectionButton().click();
    applicationObject.yesSocialInsuranceNumber().click({ force: true });
    applicationObject.yesSocialInsuranceNumberMessage().should("be.visible");
    applicationObject.nextSectionButton().click();
  });

  it("Verify that all mandatory fields in the Financial information page have error messages displayed if they are not filled out.", () => {
    financialInformationSection();
  });

  it("Verify that without filling declaration form click on Submit application button & page have error messages displayed.", () => {
    cy.intercept("GET", "**/program-year").as("programYear");
    draftApplicationVerify();
    applicationObject.nextSectionButton().click();
    cy.wait("@programYear");
    applicationObject.buttonNextSection().click();
    applicationObject.schoolAttendingErrorMessage().should("be.visible");
  });

  it("Verify that user is able to complete all forms in the application & submit it successfully", () => {
    financialInformationSection();
    applicationObject.declarationFormCheckbox().click();
  });

  it("Verify that all fields are working in file upload section", () => {
    applicationObject.fileUploader().click();
    applicationObject.documentDropdown().click();
    applicationObject
      .documentDropdownType()
      .type("Application")
      .type("{enter}");
    applicationObject.applicationNumberInputTextFileUpload().type("843098423");
  });

  it("Verify that financial aid application redirects to correct page or not.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.financialApplicationButton().click({ multiple: true });
    applicationObject.applicationsOptionButton().click();
    applicationObject.viewButton().click();
    applicationObject.welcomeText().should("be.visible");
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.financialApplicationButton().click({ multiple: true });
    applicationObject.continueButtonInFinancialAid().click();
    applicationObject.welcomeText().should("be.visible");
  });
});
