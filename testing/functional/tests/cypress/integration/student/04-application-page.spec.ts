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
    applicationObject.draftApplication().click({ force: true });
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
    cy.go("back");
    applicationObject.verifyApplicationText().should("be.visible");
  });

  it(
    "Verify that user able to check the checkbox in Program section in application form.",
    { retries: 4 },
    () => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject.mySchoolIsNotListedCheckbox().check();
      applicationObject.checkboxAlertMessage().should("be.visible");
    }
  );

  it(
    "Verify that user able to uncheck the checkbox in Program section in application form.",
    { retries: 4 },
    () => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject.mySchoolIsNotListedCheckbox().check();
      applicationObject.uncheckAlertMessage().click();
      applicationObject.checkboxAlertMessage().should("not.exist");
    }
  );

  it("Verify that user able to edit all details in Program page in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    applicationObject.schoolIWillBeAttendingDropdown2();
    applicationObject.howWillYouAttendProgramDropdown2();
    applicationObject.inputStudentNumber();
  });

  it("Verify that Student number must have no more than 12 characters in application form.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    cy.wait(1000);
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

  it("Verify that user redirect to Personal Information page from Program page in application form.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject.schoolIWillBeAttendingDropdown2();
      applicationObject.howWillYouAttendProgramDropdown2();
      applicationObject.myProgramNotListedCheckbox().click({ force: true });
      applicationObject.programName().type(testData.programNameData);
      applicationObject
        .programDescription()
        .type(testData.programDescriptionData);
      applicationObject.studyStartDate();
      applicationObject.studyEndDate();
      applicationObject.inputStudentNumber2();
      applicationObject.nextSectionButton().click();
    });
  });

  it("Check without selecting any mandatory fields in Personal Information section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject.schoolIWillBeAttendingDropdown2();
      applicationObject.howWillYouAttendProgramDropdown2();
      applicationObject.myProgramNotListedCheckbox().click({ force: true });
      applicationObject.programName().type(testData.programNameData);
      applicationObject
        .programDescription()
        .type(testData.programDescriptionData);
      applicationObject.studyStartDate();
      applicationObject.studyEndDate();
      applicationObject.inputStudentNumber2();
      applicationObject.nextSectionButton().click();
      applicationObject.nextSectionButton().click();
      applicationObject
        .pleaseFixErrorBeforeSubmittingText()
        .should("be.visible");
    });
  });

  it("Verify that all mandatory fields in the Personal information page have error messages displayed if they are not filled out.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject.schoolIWillBeAttendingDropdown2();
      applicationObject.howWillYouAttendProgramDropdown2();
      applicationObject.myProgramNotListedCheckbox().click({ force: true });
      applicationObject.programName().type(testData.programNameData);
      applicationObject
        .programDescription()
        .type(testData.programDescriptionData);
      applicationObject.studyStartDate();
      applicationObject.studyEndDate();
      applicationObject.inputStudentNumber2();
      applicationObject.nextSectionButton().click();
      applicationObject.nextSectionButton().click();
      applicationObject
        .pleaseFixErrorBeforeSubmittingText()
        .should("be.visible");
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
  });

  it("Check that by clicking on Student Profile redirects to student information.", () => {
    cy.fixture("draftApplicationData").then((testDataForInfo) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject.schoolIWillBeAttendingDropdown2();
      applicationObject.howWillYouAttendProgramDropdown2();
      applicationObject.myProgramNotListedCheckbox().click({ force: true });
      applicationObject.programName().type(testDataForInfo.programNameData);
      applicationObject
        .programDescription()
        .type(testDataForInfo.programDescriptionData);
      applicationObject.studyStartDate();
      applicationObject.studyEndDate();
      applicationObject.inputStudentNumber2();
      applicationObject.nextSectionButton().click();
      applicationObject.studentProfileButton().click();
      applicationObject.studentInformationText().should("be.visible");
    });
  });

  it("Verify that redirects to Student Profile by clicking Student Profile button from Personal Information.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject.schoolIWillBeAttendingDropdown2();
      applicationObject.howWillYouAttendProgramDropdown2();
      applicationObject.myProgramNotListedCheckbox().click({ force: true });
      applicationObject.programName().type(testData.programNameData);
      applicationObject
        .programDescription()
        .type(testData.programDescriptionData);
      applicationObject.studyStartDate();
      applicationObject.studyEndDate();
      applicationObject.inputStudentNumber2();
      applicationObject.nextSectionButton().click();
      applicationObject.studentProfileButton().click();
      applicationObject.studentInformationText().should("be.visible");
    });
  });

  it("Check that all fields on the Personal Information page are working.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      cy.wait(2000);
      applicationObject.personalInformationButton().click();
      applicationObject.iConfirmMyStudentAidCheckbox().click();
      applicationObject.citizenStatusRadioButton().click();
      applicationObject.residentOfBCRadioButton().click();
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
    });
  });

  it("Check that all fields on the Family Information page are working.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      cy.wait(2000);
      applicationObject.personalInformationButton().click();
      applicationObject.iConfirmMyStudentAidCheckbox().click();
      applicationObject.citizenStatusRadioButton().click();
      applicationObject.residentOfBCRadioButton().click();
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
      applicationObject.marriedRadioButton().click();
      applicationObject.dateOfMarriage().type("2023-12-01");
      applicationObject.dependRadioButton().click();
      applicationObject.fullNameText().type("Jason Holder");
      applicationObject.dateOfBirth().type("2003-07-01");
      applicationObject.attendingPostSecondarySchoolRadioButton().click();
      applicationObject.declaredOnTaxesRadioButton().click();
      applicationObject.addAnotherDependantButton().click();
      applicationObject.secondCloseButton().click();
      applicationObject.doYouHaveDependentSupportRadioButton().click();
    });
  });

  it("Check that previous button is working in family information page.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      cy.wait(2000);
      applicationObject.personalInformationButton().click();
      applicationObject.iConfirmMyStudentAidCheckbox().click();
      applicationObject.citizenStatusRadioButton().click();
      applicationObject.residentOfBCRadioButton().click();
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
      applicationObject.marriedRadioButton().click();
      applicationObject.dateOfMarriage().type("2023-12-01");
      applicationObject.dependRadioButton().click();
      applicationObject.fullNameText().type("Jason Holder");
      applicationObject.dateOfBirth().type("2003-07-01");
      applicationObject.attendingPostSecondarySchoolRadioButton().click();
      applicationObject.declaredOnTaxesRadioButton().click();
      applicationObject.addAnotherDependantButton().click();
      applicationObject.secondCloseButton().click();
      applicationObject.doYouHaveDependentSupportRadioButton().click();
      applicationObject.previousSectionButton().click();
      applicationObject.previousSectionButton().click();
      applicationObject.previousSectionButton().click();
      applicationObject.welcomeText().should("be.visible");
    });
  });

  it("Verify that condition-based records are displaying or not in partner Information.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      cy.wait(2000);
      applicationObject.personalInformationButton().click();
      applicationObject.iConfirmMyStudentAidCheckbox().click();
      applicationObject.citizenStatusRadioButton().click();
      applicationObject.residentOfBCRadioButton().click();
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
      applicationObject.marriedRadioButton().click();
      applicationObject.dateOfMarriage().type("2023-12-01");
      applicationObject.dependRadioButton().click();
      applicationObject.fullNameText().type("Jason Holder");
      applicationObject.dateOfBirth().type("2003-07-01");
      applicationObject.attendingPostSecondarySchoolRadioButton().click();
      applicationObject.declaredOnTaxesRadioButton().click();
      applicationObject.addAnotherDependantButton().click();
      applicationObject.secondCloseButton().click();
      applicationObject.doYouHaveDependentSupportRadioButton().click();
      applicationObject.nextSectionButton().click();
      applicationObject.yesSocialInsuranceNumber().click();
      applicationObject.yesSocialInsuranceNumberMessage().should("be.visible");
      applicationObject.noSocialInsuranceNumber().click();
      applicationObject.noSocialInsuranceNumberMessage().should("be.visible");
    });
  });

  it("Verify that all mandatory fields in the Partner information page have error messages displayed if they are not filled out.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      cy.wait(2000);
      applicationObject.personalInformationButton().click();
      applicationObject.iConfirmMyStudentAidCheckbox().click();
      applicationObject.citizenStatusRadioButton().click();
      applicationObject.residentOfBCRadioButton().click();
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
      applicationObject.marriedRadioButton().click();
      applicationObject.dateOfMarriage().type("2023-12-01");
      applicationObject.dependRadioButton().click();
      applicationObject.fullNameText().type("Jason Holder");
      applicationObject.dateOfBirth().type("2003-07-01");
      applicationObject.attendingPostSecondarySchoolRadioButton().click();
      applicationObject.declaredOnTaxesRadioButton().click();
      applicationObject.addAnotherDependantButton().click();
      applicationObject.secondCloseButton().click();
      applicationObject.doYouHaveDependentSupportRadioButton().click();
      applicationObject.nextSectionButton().click();
      applicationObject.yesSocialInsuranceNumber().click();
      applicationObject.yesSocialInsuranceNumberMessage().should("be.visible");
      applicationObject.noSocialInsuranceNumber().click();
      applicationObject.noSocialInsuranceNumberMessage().should("be.visible");
      applicationObject.nextSectionButton().click();
      applicationObject
        .pleaseFixErrorBeforeSubmittingText()
        .should("be.visible");
      applicationObject.financialInformationErrorMessage().should("be.visible");
      applicationObject.partnerIncomeErrorMessage().should("be.visible");
      applicationObject.partnerEmployedErrorMessage().should("be.visible");
      applicationObject.financialInformationErrorMessage().should("be.visible");
      applicationObject.partnerBeAtHomeErrorMessage().should("be.visible");
      applicationObject.partnerBeLivingErrorMessage().should("be.visible");
      applicationObject.partnerBeFullTimeErrorMessage().should("be.visible");
      applicationObject.partnerReciveIncomeErrorMessage().should("be.visible");
      applicationObject
        .partnerEmploymentInsuranceErrorMessage()
        .should("be.visible");
      applicationObject
        .partnerReceiptFederalErrorMessage()
        .should("be.visible");
      applicationObject
        .partnerPayingCanadaStudentErrorMessage()
        .should("be.visible");
      applicationObject.duringStudyPeriodErrorMessage().should("be.visible");
    });
  });

  it("Check that all fields on the Partner information page are working.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      cy.wait(2000);

      applicationObject.personalInformationButton().click();
      applicationObject.iConfirmMyStudentAidCheckbox().click();
      applicationObject.citizenStatusRadioButton().click();
      applicationObject.residentOfBCRadioButton().click();
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
      applicationObject.marriedRadioButton().click();
      applicationObject.dateOfMarriage().type("2023-12-01");
      applicationObject.dependRadioButton().click();
      applicationObject.fullNameText().type("Jason Holder");
      applicationObject.dateOfBirth().type("2003-07-01");
      applicationObject.attendingPostSecondarySchoolRadioButton().click();
      applicationObject.declaredOnTaxesRadioButton().click();
      applicationObject.addAnotherDependantButton().click();
      applicationObject.secondCloseButton().click();
      applicationObject.doYouHaveDependentSupportRadioButton().click();
      applicationObject.nextSectionButton().click();
      applicationObject.yesSocialInsuranceNumber().click();
      applicationObject.yesSocialInsuranceNumberMessage().should("be.visible");
      applicationObject.noSocialInsuranceNumber().click();
      applicationObject.noSocialInsuranceNumberMessage().should("be.visible");
      applicationObject.iHaveBeenAuthorizedCheckbox().click();
      applicationObject.partnerIncomeInputMessage().type("93");
      applicationObject.partnerFullTimeRadioButton().click();
      applicationObject.homeCaringRadioButton().click();
      applicationObject.livingStudyPeriodRadioButton().click();
      applicationObject.fullTimePostRadioButton().click();
      applicationObject.receiveIncomeAssistanceRadioButton().click();
      applicationObject.receiptEmploymentInsuranceRadioButton().click();
      applicationObject.receiptFederalRadioButton().click();
      applicationObject.payingCanadaStudentRadioButton().click();
      applicationObject.partnerWillPayInputText().type("1200");
      applicationObject.payingForChildSupportRadioButton().click();
      applicationObject.payingForChildSupportInputText().type("1100");
      applicationObject.eligibleDependRadioButton().click();
      applicationObject.nextSectionButton().click();
    });
  });

  it("Verify that all mandatory fields in the Financial information page have error messages displayed if they are not filled out.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    cy.wait(2000);
    applicationObject.financialInformationButton().click();
    applicationObject.nextSectionButton().click();
    applicationObject.pleaseFixErrorBeforeSubmittingText().should("be.visible");
    applicationObject.myTotalIncomeErrorMessage().should("be.visible");

    applicationObject.canadianRevenueErrorMessage().should("be.visible");
    applicationObject.estimatedIncomeErrorMessage().should("be.visible");
    applicationObject.exceptionalExpensesErrorMessage().should("be.visible");
    applicationObject.daycareErrorMessage().should("be.visible");
    applicationObject.dayCareCostsErrorMessage().should("be.visible");
    applicationObject.childSupportErrorMessage().should("be.visible");
    applicationObject.meritBasedErrorMessage().should("be.visible");
    applicationObject.voluntaryContributionsErrorMessage().should("be.visible");
    applicationObject.govtFundingErrorMessage().should("be.visible");
    applicationObject.nonGovtFundingErrorMessage().should("be.visible");
    applicationObject.bcIncomeAssistanceErrorMessage().should("be.visible");
    applicationObject.parentIsRequiredErrorMessage().should("be.visible");
    applicationObject.relocateCityErrorMessage().should("be.visible");
    applicationObject
      .additionalTransportationErrorMessage()
      .should("be.visible");
  });

  it("Check that all fields on the Partner information page are working.", () => {
    cy.fixture("draftApplicationData").then((testData) => {
      applicationObject.applicationButton().should("be.visible").click();
      applicationObject.draftApplication().click();
      applicationObject.draftApplicationVerifyText().should("be.visible");
      applicationObject.nextSectionButton().click();
      cy.wait(2000);
      applicationObject.financialInformationButton().click();
      applicationObject.totalIncomeInputText().type("4500");

      applicationObject.iGiveCanadianRevenueCheckbox().click();
      applicationObject.yearEstimatedIncomeRadioButton().click();
      applicationObject.currentYearIncomeInputText().type("32000");
      applicationObject.reasonForDecreaseIncomeRadioButton().click();
      applicationObject.exceptionalExpensesRadioButton().click();
      applicationObject.childDaycareRadioButton().click();
      applicationObject.childDaycareInputText().type("3450");
      applicationObject.classHoursDisabledRadioButton().click();
      applicationObject.classHoursDisabledInputText().type("200");
      applicationObject.payingChildSupportRadioButton().click();
      applicationObject.meritBasedRadioButtonRadioButton().click();
      applicationObject.meritBasedInputText().type("150");
      applicationObject.receiveVoluntaryRadioButton().click();
      applicationObject.govtFundingRadioButton().click();
      applicationObject.govtFundingInputText().type("2500");
      applicationObject.nonGovtFundingRadioButton().click();
      applicationObject.bcIncomeAssistanceRadioButton().click();
      applicationObject.homePaidByOurParentsRadioButton().click();
      applicationObject.relocateToDifferentCityRadioButton().click();
      applicationObject.oneReturnTripInputText().type("70");
      applicationObject.additionalTransportationCostsRadioButton().click();
      applicationObject.describeSituationRadioButton().click();
      applicationObject.weeklyTransportationCostsInputText().type("200");
      applicationObject.nextSectionButton().click();
    });
  });

  it("Verify that without filling declaration form click on Submit application button & page have error messages displayed.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.draftApplication().click();
    applicationObject.draftApplicationVerifyText().should("be.visible");
    applicationObject.nextSectionButton().click();
    cy.wait(2000);
    applicationObject.confirmSubmissionButton().click();
    applicationObject.submitApplicationButton().click();
    applicationObject.declarationErrorMessage().should("be.visible");
  });

  it(
    "Verify that user is able to complete all forms in the application & submit it successfully",
    {
      retries: {
        runMode: 2,
        openMode: 1,
      },
    },
    () => {
      cy.fixture("draftApplicationData").then((testData) => {
        applicationObject.applicationButton().should("be.visible").click();
        applicationObject.draftApplication().click();
        applicationObject.draftApplicationVerifyText().should("be.visible");
        applicationObject.nextSectionButton().click();
        cy.wait(2000);

        applicationObject.schoolIWillBeAttendingDropdown2();
        applicationObject.howWillYouAttendProgramDropdown2();
        applicationObject.myProgramNotListedCheckbox().click({ force: true });
        applicationObject.programName().type(testData.programNameData);
        applicationObject
          .programDescription()
          .type(testData.programDescriptionData);
        applicationObject.studyStartDate();
        applicationObject.studyEndDate();
        applicationObject.inputStudentNumber2();
        applicationObject.nextSectionButton().click();

        applicationObject.iConfirmMyStudentAidCheckbox().click();
        applicationObject.citizenStatusRadioButton().click();
        applicationObject.residentOfBCRadioButton().click();
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
        applicationObject.marriedRadioButton().click();
        applicationObject.dateOfMarriage().type("2023-12-01");
        applicationObject.dependRadioButton().click();
        applicationObject.fullNameText().type("Jason Holder");
        applicationObject.dateOfBirth().type("2003-07-01");
        applicationObject.attendingPostSecondarySchoolRadioButton().click();
        applicationObject.declaredOnTaxesRadioButton().click();
        applicationObject.addAnotherDependantButton().click();
        applicationObject.secondCloseButton().click();
        applicationObject.doYouHaveDependentSupportRadioButton().click();
        applicationObject.nextSectionButton().click();
        applicationObject.yesSocialInsuranceNumber().click();
        applicationObject
          .yesSocialInsuranceNumberMessage()
          .should("be.visible");
        applicationObject.noSocialInsuranceNumber().click();
        applicationObject.noSocialInsuranceNumberMessage().should("be.visible");
        applicationObject.iHaveBeenAuthorizedCheckbox().click();
        applicationObject.partnerIncomeInputMessage().type("93");
        applicationObject.partnerFullTimeRadioButton().click();
        applicationObject.homeCaringRadioButton().click();
        applicationObject.livingStudyPeriodRadioButton().click();
        applicationObject.fullTimePostRadioButton().click();
        applicationObject.receiveIncomeAssistanceRadioButton().click();
        applicationObject.receiptEmploymentInsuranceRadioButton().click();
        applicationObject.receiptFederalRadioButton().click();
        applicationObject.payingCanadaStudentRadioButton().click();
        applicationObject.partnerWillPayInputText().type("1200");
        applicationObject.payingForChildSupportRadioButton().click();
        applicationObject.payingForChildSupportInputText().type("1100");
        applicationObject.eligibleDependRadioButton().click();
        applicationObject.nextSectionButton().click();

        applicationObject.totalIncomeInputText().type("4500");

        applicationObject.iGiveCanadianRevenueCheckbox().click();
        applicationObject.yearEstimatedIncomeRadioButton().click();
        applicationObject.currentYearIncomeInputText().type("32000");
        applicationObject.reasonForDecreaseIncomeRadioButton().click();
        applicationObject.exceptionalExpensesRadioButton().click();
        applicationObject.childDaycareRadioButton().click();
        applicationObject.childDaycareInputText().type("3450");
        applicationObject.classHoursDisabledRadioButton().click();
        applicationObject.classHoursDisabledInputText().type("200");
        applicationObject.payingChildSupportRadioButton().click();
        applicationObject.meritBasedRadioButtonRadioButton().click();
        applicationObject.meritBasedInputText().type("150");
        applicationObject.receiveVoluntaryRadioButton().click();
        applicationObject.govtFundingRadioButton().click();
        applicationObject.govtFundingInputText().type("2500");
        applicationObject.nonGovtFundingRadioButton().click();
        applicationObject.bcIncomeAssistanceRadioButton().click();
        applicationObject.homePaidByOurParentsRadioButton().click();
        applicationObject.relocateToDifferentCityRadioButton().click();
        applicationObject.oneReturnTripInputText().type("70");
        applicationObject.additionalTransportationCostsRadioButton().click();
        applicationObject.describeSituationRadioButton().click();
        applicationObject.weeklyTransportationCostsInputText().type("200");
        applicationObject.nextSectionButton().click();
        applicationObject.declarationFormCheckbox().click();
      });
    }
  );

  it("Check Draft status form is getting create or not", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.startNewApplicationButton().should("be.visible").click();
    applicationObject
      .startApplicationStudyYearDisableButton()
      .should("be.visible");
    applicationObject.selectStudyYearDropdown();
  });

  it(
    "Verify that all fields are working in file upload section",
    { retries: 2 },
    () => {
      const path = "images/data.png";
      applicationObject.fileUploader().click();
      applicationObject.documentDropdown().click();
      applicationObject
        .documentDropdownType()
        .type("Application")
        .type("{enter}");
      applicationObject
        .applicationNumberInputTextFileUpload()
        .type("843098423");
      //cy.get('.fileSelector').attachFile(path);
      //cy.get('input[type="file"]').attachFile(path).trigger("input");
    }
  );

  it("Verify that profile pages have proper error validation with error messages.", () => {
    applicationObject.profileSection().click();
    applicationObject.phoneNumberInputText().clear();
    applicationObject.addressLineInputText().clear();
    applicationObject.cityInputText().clear();
    applicationObject.provinceInputText().clear();
    applicationObject.countryInputText().clear();
    applicationObject.zipCodeInputText().clear();
    applicationObject.saveProfileButton().click();
    applicationObject.phoneErrorMessage().should("be.visible");
    applicationObject.addressErrorMessage().should("be.visible");
    applicationObject.cityErrorMessage().should("be.visible");
    applicationObject.provinceErrorMessage().should("be.visible");
    applicationObject.countryErrorMessage().should("be.visible");
    applicationObject.zipErrorMessage().should("be.visible");
  });

  it("Verify that all fields are working properly in profile page .", () => {
    applicationObject.profileSection().click();
    applicationObject.phoneNumberInputText().clear().type("42328722932");
    applicationObject
      .addressLineInputText()
      .clear()
      .type("Oreo site, New Jersey, US");
    applicationObject.cityInputText().clear().type("New Jersey");
    applicationObject.provinceInputText().clear().type("065756");
    applicationObject.countryInputText().clear().type("USA");
    applicationObject.zipCodeInputText().clear().type("E934536");
    applicationObject.saveProfileButton().click();
    applicationObject.studentUpdatedText().should("be.visible");
  });

  it("Verify that user able to apply for PD status in profile page .", () => {
    applicationObject.profileSection().click();
    applicationObject.applyForPDStatusButton().click();
    applicationObject.applyForPDMessage().should("be.visible");
    applicationObject.yesForApplyPDButton().click();
  });

  it("Verify that financial aid application redirects to correct page or not.", () => {
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.financialApplicationButton().click();
    applicationObject.applicationsOptionButton().click();
    applicationObject.viewButton().click();
    applicationObject.welcomeText().should("be.visible");
    applicationObject.applicationButton().should("be.visible").click();
    applicationObject.financialApplicationButton().click();
    applicationObject.continueButtonInFinancialAid().click();
    applicationObject.welcomeText().should("be.visible");
  });
});
