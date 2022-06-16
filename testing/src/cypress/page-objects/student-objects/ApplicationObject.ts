import { draftApplication } from "../../../data/dev/student-data/studentDraftApplication";
export default class ApplicationObject {
  clickOnDraftStatus() {
    cy.get("//tbody/tr/td[5]").each(($el) => {
      if ($el.text() === "Draft") {
        $el.click();
      }
    });
  }

  applicationButton() {
    return cy.contains("Applications");
  }

  verifyApplicationText() {
    return cy.contains("My Applications");
  }

  startNewApplicationButton() {
    return cy.contains("Start New Application");
  }

  //<StartRegion----------------------------Start New Application------------------------------>
  verifyStartNewApplicationText() {
    return cy.contains("Select an application to begin");
  }

  startApplicationStudyYearDisableButton() {
    return cy.xpath("//button[@disabled='disabled']");
  }

  selectStudyYearDropdown(data: any) {
    cy.get(".form-group").eq(1).click({ force: true });
    cy.wait(2000);
    cy.get(".choices__input.choices__input--cloned")
      .click({ force: true })
      .type(data)
      .type("{enter}");
  }

  removedButton() {
    return cy.contains("Remove item");
  }

  //Alert message in "Already In Progress"
  applicationAlreadyInProgressText() {
    return cy.contains("Application already in progress");
  }

  applicationAlreadyInProgressTextCard() {
    return cy.contains("Close");
  }

  //Start Application
  startApplicationTuitionWaiverButton() {
    return cy.get("[name='data[startApplication1]']");
  }
  startApplicationBCloanForgivenessProgramButton() {
    return cy.get("[name='data[startApplication2]']").click();
  }
  startApplicationPacificLeaderLoanForgivenessButton() {
    return cy.get("[name='data[startApplication4]']").click();
  }
  startApplicationInterestFreeStatusButton() {
    return cy.get("[name='data[startApplication3]']").click();
  }

  //<EndRegion----------------------------Start New Application------------------------------>

  //<StartRegion--------------------------Draft Status------------------------------------->

  draftApplication() {
    return cy.xpath("(//*[name()='svg'][@role='img'])[4]");
  }

  draftApplicationVerifyText() {
    return cy.contains("Let’s get started on your application");
  }

  nextSectionButton() {
    return cy.get(":nth-child(4) > .ml-auto > .v-btn");
  }

  buttonNextSection() {
    return cy.contains("Next section");
  }

  previousSectionButton() {
    return cy.get("[data-cy='previousSection']");
  }

  errorMsgTxtForSchoolAttending() {
    return cy.contains("The school I will be attending is required");
  }

  welcomeText() {
    return cy.contains("Let’s get started on your application");
  }

  mySchoolIsNotListedCheckbox() {
    return cy.get(".form-check-input", { timeout: 5000 });
  }

  checkboxAlertMessage() {
    return cy.contains(
      "Your institution may not be designated by StudentAid BC"
    );
  }

  uncheckAlertMessage() {
    return cy.contains("My school isn't listed");
  }

  schoolIWillBeAttendingDropdown() {
    cy.get(".form-group").eq(1).click({ force: true });
    cy.get(".choices__input.choices__input--cloned")
      .click({ force: true })
      .type(draftApplication.schoolIWillBeAttending)
      .type("{enter}");
  }

  schoolIWillBeAttendingDropdown2() {
    cy.get(".form-group", { timeout: 3000 }).eq(1).click({ force: true });
    cy.wait(2000);
    cy.get(".choices__input.choices__input--cloned", { timeout: 3000 })
      .click({ force: true })
      .type(draftApplication.schoolIWillBeAttending2)
      .type("{enter}");
  }

  howWillYouAttendProgramDropdown() {
    cy.intercept("GET", "**/options-list").as("optionListHowWillYou");
    cy.get(".form-group").eq(4).click({ force: true });
    cy.wait("@optionListHowWillYou");
    cy.get(".choices__input.choices__input--cloned")
      .eq(1)
      .click({ force: true })
      .type(draftApplication.howWillYouAttendProgram)
      .type("{enter}", { timeout: 2000 });
  }

  howWillYouAttendProgramDropdown2() {
    cy.intercept("GET", "**/options-list").as("optionListHowWillYou2");
    cy.get(".form-group").eq(4).click({ force: true });
    cy.wait("@optionListHowWillYou2");
    cy.get(".choices__input.choices__input--cloned")
      .eq(1)
      .click({ force: true })
      .type(draftApplication.howWillYouAttendProgram2)
      .type("{enter}", { timeout: 2000 });
  }

  programIWillBeAttendingDropdown() {
    cy.intercept("GET", "**/options-list").as("optionListProgramIWill");
    cy.get(".form-group").eq(6).click({ force: true });
    cy.wait("@optionListProgramIWill");
    cy.get(".choices__input.choices__input--cloned")
      .eq(2)
      .click({ force: true })
      .type(draftApplication.programIWillBeAttendingDropdown)
      .type("{enter}", { timeout: 2000 });
  }

  programIWillBeAttendingDropdown2() {
    cy.intercept("GET", "**/options-list").as("optionListProgramIWill2");
    cy.get(".form-group").eq(6).click({ force: true });
    cy.wait("@optionListProgramIWill2");
    cy.get(".choices__input.choices__input--cloned")
      .eq(2)
      .click({ force: true })
      .type(draftApplication.programIWillBeAttendingDropdown2)
      .type("{enter}", { timeout: 2000 });
  }

  myStudyPeriodIsNotListedCheckbox() {
    return cy.contains("My program is not listed");
  }

  programName() {
    return cy.get("[name='data[programName]']");
  }

  programDescription() {
    return cy.get("[name='data[programDescription]']");
  }

  studyStartDate() {
    cy.get('#eqnahab > [ref="element"] > .input-group > .input').type(
      draftApplication.studyStartDate
    );
  }

  studyEndDate() {
    cy.get('#eyw0exi > [ref="element"] > .input-group > .input').type(
      draftApplication.studyEndDate
    );
  }

  inputStudentNumber() {
    cy.get("#ek8w4hn-studentNumber").type(draftApplication.studentNumber);
  }

  inputStudentNumber2() {
    cy.get("[name='data[studentNumber]']").type(
      draftApplication.studentNumber2
    );
  }

  incorrectStudentNumber() {
    return cy.get("[name='data[studentNumber]']");
  }

  incorrectStudentNumberText() {
    return cy.contains("Student number must have no more than 12 characters.");
  }

  programOfferingDropdown() {
    cy.intercept("GET", "**/options-list").as("programOffering");
    cy.xpath(
      "//div[@id='eb4inb']//div[@class='form-control ui fluid selection dropdown']"
    ).click({ force: true });
    cy.wait("@programOffering");
    cy.get(".choices__input.choices__input--cloned")
      .eq(3)
      .click({ force: true })
      .type(draftApplication.programOffering)
      .type("{enter}", { timeout: 2000 });
  }

  myProgramNotListedCheckbox() {
    return cy.contains("My program is not listed");
  }

  //<EndRegion--------------------------Draft Status------------------------------------->

  programPageText() {
    //Dropdown selection
    cy.get(".fa").eq(0).click({ force: true });
    cy.get(".choices__input.choices__input--cloned")
      .click({ force: true })
      .type(draftApplication.searchForYourSchool)
      .type("{enter}");
  }

  pleaseFixErrorBeforeSubmittingText() {
    return cy.contains("Please fix the following errors before submitting.");
  }

  iConfirmMyStudentText() {
    return cy.contains(
      "I confirm my StudentAid BC Profile information shown is correct is required"
    );
  }

  citizenshipStatusText() {
    return cy.contains("Citizen and Residency");
  }

  areYouResidentText() {
    return cy.contains("Have lived in B.C. for at least 12 consecutive months");
  }

  identifyAsIndigenousText() {
    return cy.contains("Aboriginal Status is required");
  }

  youthInContinuingText() {
    return cy.contains("Youth In Care is required");
  }

  outOfHighSchoolText() {
    return cy.contains(
      "At the time of your course study start date, will you have been out of high school for 4 years? is required"
    );
  }

  graduateOrLeaveHighSchoolText() {
    return cy.contains(
      "When did you graduate or leave high-school? is required"
    );
  }

  employmentInformationIsRequiredText() {
    return cy.contains("Employment Information is required");
  }

  leftSchoolFirstDayOfClassText() {
    return cy.contains(
      "In the time since you left high school to your first day of classes, have you spent two periods of 12 consecutive months each, in the full time labour force? is required"
    );
  }

  trustedContactText() {
    return cy.contains(
      "Do you want to allow a trusted contact to interact with StudentAid BC on your behalf? is required"
    );
  }

  studentProfileButton() {
    return cy.contains("Student profile");
  }

  studentInformationText() {
    return cy.contains("Student Information");
  }

  personalInformationButton() {
    return cy.get(":nth-child(3) > .page-link");
  }

  iConfirmMyStudentAidCheckbox() {
    return cy.contains("I confirm my StudentAid");
  }

  citizenStatusRadioButton() {
    return cy.contains("Canadian citizen");
  }

  residentOfBCRadioButton() {
    return cy.get("[role='radio']").eq(4);
  }

  residenceNoneOfTheAboveRadioButton() {
    return cy.get("[role='radio']").eq(8);
  }

  explainSituationInputField() {
    return cy.get("[name='data[otherLivingSituation]']");
  }

  indigenousPersonRadioButton() {
    return cy.get("[role='radio']").eq(9);
  }

  aboriginalRadioButton() {
    return cy.get("[role='radio']").eq(11);
  }

  legalGuardianRadioButton() {
    return cy.get("[role='radio']").eq(14);
  }

  courseStudyStartDateRadioButton() {
    return cy.get("[role='radio']").eq(16);
  }

  whenDidYouGraduateInputText() {
    return cy.get(".input");
  }

  workingFullTimeRadioButton() {
    return cy.get("[role='radio']").eq(18);
  }

  fullTimeLaborForceRadioButton() {
    return cy.get("[role='radio']").eq(20);
  }

  allowTrustContactRadioButton() {
    return cy.get("[role='radio']").eq(23);
  }

  familyInformationButton() {
    return cy.get(":nth-child(4) > .page-link");
  }

  marriedRadioButton() {
    return cy.get(":nth-child(3) > .form-check-label > #relationshipStatus");
  }

  dateOfMarriage() {
    return cy.get(".input");
  }

  dependRadioButton() {
    return cy.get(":nth-child(1) > .form-check-label > #hasDependents");
  }

  fullNameText() {
    return cy.get("#ex25e6h-fullName");
  }

  dateOfBirth() {
    return cy.get('#es6kg2vr > [ref="element"] > .input-group > .input');
  }

  attendingPostSecondarySchoolRadioButton() {
    return cy.get("[type='radio']").eq(6);
  }

  declaredOnTaxesRadioButton() {
    return cy.get("[type='radio']").eq(8);
  }

  addAnotherDependantButton() {
    return cy.contains("Add Another Dependant");
  }

  secondCloseButton() {
    return cy.get(":nth-child(2) > :nth-child(2) > .btn");
  }

  doYouHaveDependentSupportRadioButton() {
    return cy.get("[type='radio']").eq(10);
  }

  yesSocialInsuranceNumber() {
    return cy.get("[type='radio']").eq(0);
  }

  yesSocialInsuranceNumberMessage() {
    return cy.contains(
      "Please be advised your partner will need to sign in to StudentAid BC and provide additional information."
    );
  }

  noSocialInsuranceNumber() {
    return cy.get(":nth-child(2) > .form-check-label > span");
  }

  noSocialInsuranceNumberMessage() {
    return cy.contains("Please be advised this could delay your application");
  }

  financialInformationErrorMessage() {
    return cy.contains(
      "I have been authorized by my partner to submit their financial"
    );
  }

  partnerIncomeErrorMessage() {
    return cy.contains("What was your partner’s income");
  }

  partnerEmployedErrorMessage() {
    return cy.contains("Will your partner be employed");
  }

  partnerBeAtHomeErrorMessage() {
    return cy.contains("Will your partner be at home");
  }

  partnerBeLivingErrorMessage() {
    return cy.contains("Will your partner be living");
  }

  partnerBeFullTimeErrorMessage() {
    return cy.contains("Will your partner be a full-time");
  }

  partnerReceiveIncomeErrorMessage() {
    return cy.contains("Will your partner recieve income");
  }

  partnerEmploymentInsuranceErrorMessage() {
    return cy.contains(
      "Will your partner be in receipt of Employment Insurance"
    );
  }

  partnerReceiptFederalErrorMessage() {
    return cy.contains("Will your partner be in receipt of federal");
  }

  partnerPayingCanadaStudentErrorMessage() {
    return cy.contains("Will your partner be paying a Canada Student");
  }

  partnerPayingChildSupport() {
    return cy.contains("Will your partner be paying for child support");
  }

  duringStudyPeriodErrorMessage() {
    return cy.contains("Durring your study period");
  }

  iHaveBeenAuthorizedCheckbox() {
    return cy.contains("I have been authorized by my");
  }

  partnerIncomeInputMessage() {
    return cy.get("[name='data[estimatedSpouseIncome]']");
  }

  partnerFullTimeRadioButton() {
    return cy.get("#et8sctn > .form-radio > :nth-child(1)");
  }

  homeCaringRadioButton() {
    return cy.get("#efeg6kc-yes");
  }

  livingStudyPeriodRadioButton() {
    return cy.get("#e6f8sq-no");
  }

  fullTimePostRadioButton() {
    return cy.get("#eeeyy3l-no");
  }

  receiveIncomeAssistanceRadioButton() {
    return cy.get("#erbduch-no");
  }

  receiptEmploymentInsuranceRadioButton() {
    return cy.get("#e31a1pa-no");
  }

  receiptFederalRadioButton() {
    return cy.get("#en3em5g-no");
  }

  payingCanadaStudentRadioButton() {
    return cy.get("#eu8nr9s-yes");
  }

  partnerWillPayInputText() {
    return cy.get("#esoydt6-partnerstudentloanCosts");
  }

  payingForChildSupportRadioButton() {
    return cy.get("#e12r1qh-yes");
  }

  payingForChildSupportInputText() {
    return cy.get("#ehvnz5p-partnerchildsupportCosts");
  }

  eligibleDependRadioButton() {
    return cy.get("#elmurep-yes");
  }

  financialInformationButton() {
    return cy.contains("Financial information");
  }

  myTotalIncomeErrorMessage() {
    return cy.contains("My total income in 2020 was: is required");
  }

  canadianRevenueErrorMessage() {
    return cy.contains("Canadian Revenue");
  }

  estimatedIncomeErrorMessage() {
    return cy.contains("Do you want to be assessed");
  }

  exceptionalExpensesErrorMessage() {
    return cy.contains("Do you want to submit");
  }

  daycareErrorMessage() {
    return cy.contains("Will you have a child age");
  }

  dayCareCostsErrorMessage() {
    return cy.contains("Will you have unsubsidized day-care");
  }

  childSupportErrorMessage() {
    return cy.contains("Will you be paying child support");
  }

  meritBasedErrorMessage() {
    return cy.contains("Will you have merit-based");
  }

  voluntaryContributionsErrorMessage() {
    return cy.contains("Will you receive voluntary contributions");
  }

  govtFundingErrorMessage() {
    return cy.contains("Will you have government funding");
  }

  nonGovtFundingErrorMessage() {
    return cy.contains("Will you have non-government");
  }

  bcIncomeAssistanceErrorMessage() {
    return cy.contains("Will you have B.C. income");
  }

  parentIsRequiredErrorMessage() {
    return cy.contains("Living with your parent/guardian is required");
  }

  relocateCityErrorMessage() {
    return cy.contains("If you must relocate");
  }

  additionalTransportationErrorMessage() {
    return cy.contains("Do you want to be assessed");
  }

  totalIncomeInputText() {
    return cy.get("#ei8r8ok-taxReturnIncome");
  }

  iGiveCanadianRevenueCheckbox() {
    return cy.contains("I give the Canadian Revenue Agency");
  }

  yearEstimatedIncomeRadioButton() {
    return cy.get("[type='radio']").eq(0);
  }

  currentYearIncomeInputText() {
    return cy.get("#et21m-myTotalCurrentYearIncomeIs");
  }

  reasonForDecreaseIncomeRadioButton() {
    return cy.get("[type='radio']").eq(2);
  }

  exceptionalExpensesRadioButton() {
    return cy.get("[type='radio']").eq(9);
  }

  childDaycareRadioButton() {
    return cy.get("[type='radio']").eq(10);
  }

  childDaycareInputText() {
    return cy.get("#en2sgy-daycareCosts11YearsOrUnder");
  }

  classHoursDisabledRadioButton() {
    return cy.get("[type='radio']").eq(12);
  }

  classHoursDisabledInputText() {
    return cy.get("#edo521o-daycareCosts12YearsOrOver");
  }

  payingChildSupportRadioButton() {
    return cy.get("[type='radio']").eq(15);
  }

  meritBasedRadioButtonRadioButton() {
    return cy.get("[type='radio']").eq(16);
  }

  meritBasedInputText() {
    return cy.get("#eddiwrq-scholarshipsreceviedCosts");
  }

  receiveVoluntaryRadioButton() {
    return cy.get("[type='radio']").eq(19);
  }

  govtFundingRadioButton() {
    return cy.get("[type='radio']").eq(20);
  }

  govtFundingInputText() {
    return cy.get("#erupwha-governmentFundingCosts");
  }

  nonGovtFundingRadioButton() {
    return cy.get("[type='radio']").eq(23);
  }

  bcIncomeAssistanceRadioButton() {
    return cy.get("[type='radio']").eq(25);
  }

  homePaidByOurParentsRadioButton() {
    return cy.get("[type='radio']").eq(27);
  }

  relocateToDifferentCityRadioButton() {
    return cy.get("[type='radio']").eq(28);
  }

  oneReturnTripInputText() {
    return cy.get("#ea21r2t-returntriphomeCost");
  }

  additionalTransportationCostsRadioButton() {
    return cy.get("[type='radio']").eq(30);
  }

  describeSituationRadioButton() {
    return cy.get("[type='radio']").eq(35);
  }

  weeklyTransportationCostsInputText() {
    return cy.get("#e5q38z2-transportationcostsEstimate");
  }

  confirmSubmissionButton() {
    return cy.contains("Confirm submission");
  }

  submitApplicationButton() {
    return cy.contains("Submit application");
  }

  declarationErrorMessage() {
    return cy.contains("I give StudentAid BC consent to verify the data");
  }

  schoolAttendingErrorMessage() {
    return cy.contains("The school I will be attending is required");
  }

  declarationFormCheckbox() {
    return cy.contains("I give StudentAid BC consent");
  }

  applicationSavedSuccessfully() {
    return cy.contains("Application saved!");
  }

  fileUploader() {
    return cy.contains("File Uploader");
  }

  documentDropdown() {
    return cy.get("[data-id='3']").eq(0);
  }

  documentDropdownType() {
    return cy.get("[placeholder='Type to search']");
  }

  applicationNumberInputTextFileUpload() {
    return cy.get("[name='data[applicationNumber]']");
  }

  profileSection() {
    return cy.contains("Profile");
  }

  phoneNumberInputText() {
    return cy.get("[name='data[phone]']");
  }

  addressLineInputText() {
    return cy.get("[name='data[addressLine1]']");
  }

  cityInputText() {
    return cy.get("[name='data[city]']");
  }

  provinceInputText() {
    return cy.get("[name='data[provinceState]']");
  }

  countryInputText() {
    return cy.get("[name='data[country]']");
  }

  zipCodeInputText() {
    return cy.get("[name='data[postalCode]']");
  }

  phoneErrorMessage() {
    return cy.contains("Phone number is required");
  }

  addressErrorMessage() {
    return cy.contains("Address line 1 is required");
  }

  cityErrorMessage() {
    return cy.contains("City is required");
  }

  provinceErrorMessage() {
    return cy.contains("Province/State is required");
  }

  countryErrorMessage() {
    return cy.contains("Country is required");
  }

  zipErrorMessage() {
    return cy.contains("Postal/Zip code is required");
  }

  saveProfileButton() {
    return cy.get("#eyrg48 > .btn");
  }

  studentUpdatedText() {
    return cy.contains("Student Updated");
  }

  applyForPDStatusButton() {
    return cy.get("[name='data[submitPDStatus]']");
  }

  applyForPDMessage() {
    return cy.contains("Apply for a permanent disability status");
  }

  yesForApplyPDButton() {
    return cy.contains("Yes");
  }

  financialApplicationButton() {
    return cy.contains("Financial Aid Application");
  }

  applicationsOptionButton() {
    return cy.contains("Application Options");
  }

  viewButton() {
    return cy.get(":nth-child(3) > .p-menuitem-link");
  }

  continueButtonInFinancialAid() {
    return cy.get("#e6p3z3r > .btn");
  }
}
