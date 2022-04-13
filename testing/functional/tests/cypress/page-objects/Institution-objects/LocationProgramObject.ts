export default class LocationProgramObject {
  createNewProgramButton() {
    return cy.contains("Create New Program");
  }

  submitButton() {
    return cy.get(".btn");
  }

  wait() {
    return cy.wait(2000);
  }

  programNameErrorMessage() {
    return cy.contains("Program name is required");
  }

  credentialType() {
    return cy.get("#e3cqf5c-credentialType");
  }

  credentialTypeErrorMessage() {
    return cy.contains("Credential type is required");
  }

  cipCodeErrorMessage() {
    return cy.contains("CIP code is required");
  }

  cipCodeErrorMessageIncorrectFormat() {
    return cy.contains("Incorrect Format");
  }

  partTimeBasisErrorMessage() {
    return cy.contains(
      "Are students able to take this on a part time basis? is required"
    );
  }

  programBeDeliveredErrorMessage() {
    return cy.contains(
      "How will this program be delivered? (Select all that apply) is required"
    );
  }

  programLengthErrorMessage() {
    return cy.contains("Program length is required");
  }

  programCourseLoadErrorMessage() {
    return cy.contains("Program course load calculation is: is required");
  }

  entranceRequiredErrorMessage() {
    return cy.contains("An entrance requirement is required.");
  }

  percentageOfProgramESLErrorMessage() {
    return cy.contains(
      "What percentage of the program has ESL Content? is required"
    );
  }

  programOfferedJointlyErrorMessage() {
    return cy.contains(
      "Is the program offered jointly or in partnership with other institutions? is required"
    );
  }

  programWILComponentErrorMessage() {
    return cy.contains("Does this program have a WIL component? is required");
  }

  fieldTripErrorMessage() {
    return cy.contains(
      "Is a field trip, field placement or travel part of this program? is required"
    );
  }

  internationalExchangeErrorMessage() {
    return cy.contains(
      "Does the program have an international exchange? is required"
    );
  }

  declarationErrorMessage() {
    return cy.contains(
      "I confirm this program meets the policies outlined in the StudentAid BC policy manual. is required"
    );
  }

  programNameInputText() {
    return cy.get("#ee0f6le-name");
  }

  programDescriptionInputText() {
    return cy.get("#ev0808-description");
  }

  credentialTypeInputText() {
    return cy.get("#e3cqf5c-credentialType");
  }

  cipCodeInputText() {
    return cy.get("#e428vwr-cipCode");
  }

  nocInputText() {
    return cy.get("#epeke7s-nocCode");
  }

  sabcInputText() {
    return cy.get("#e9wg9zb-sabcCode");
  }

  institutionProgramCode() {
    return cy.get("#ezavw7e-institutionProgramCode");
  }

  partTimeBasisRadioButton() {
    return cy.xpath("//input[@id='e19ahea-Full Time and Part Time']");
  }

  programBeDeliveredRadioButton() {
    return cy.get("#ehyzwln-deliveredOnSite");
  }

  programLengthInputText() {
    return cy.get("#e2u2n1o-completionYears");
  }

  programCourseLoadRadioButton() {
    return cy.get("#elx192-credit");
  }

  regulatoryBox() {
    return cy.get("#escw5nj-regulatoryBody");
  }

  entranceRequirementsCheckbox() {
    return cy.get("#eaxt08-minHighSchool");
  }

  percentageOfProgramRadioButton() {
    return cy.xpath("//input[@id='esmuskn-lessThan20']");
  }

  programOfferedJointlyRadioButton() {
    return cy.xpath("//input[@id='e1rl8gr-yes']");
  }

  institutionPartner() {
    return cy.xpath("//input[@id='eaa8y48-yes']");
  }

  wilComponentRadioButton() {
    return cy.xpath("//input[@id='exfol75-yes']");
  }

  wilApprovedByRegulatorRadioButton() {
    return cy.xpath("//input[@id='etm9ggd-yes']");
  }

  wilMeetProgramRadioButton() {
    return cy.xpath("//input[@id='ecvd00d-yes']");
  }

  fieldPlacementRadioButton() {
    return cy.get("#e6e6rtk-yes");
  }

  fieldPlacementEligibilityRadioButton() {
    return cy.get("#e7spkqj-yes");
  }

  internationalExchangeRadioButton() {
    return cy.get("#eoapr4-yes");
  }

  internationalExchangeEligibilityRadioButton() {
    return cy.get("#evzt5g8-yes");
  }

  declarationCheckbox() {
    return cy.get(".field-required > .form-check-input");
  }

  firstRowEditButton() {
    return cy.get(":nth-child(1) > :nth-child(6) > .v-btn");
  }

  programNameAssertion(programName: string) {
    return cy.contains(programName);
  }

  addStudyPeriodButton() {
    return cy.contains("Add Study Period");
  }

  addStudyPeriodAssertion() {
    return cy.contains("Add study period");
  }

  programNameStudyPeriod() {
    return cy.get("#e0u54c-offeringName");
  }

  yearOfStudyDropdown() {
    return cy.get(".form-control.ui");
  }

  yearOfStudyDropdownInputText() {
    return cy.xpath("//input[@aria-label='false']");
  }

  displayThisToStudentCheckbox() {
    return cy.get(
      "#ebim1 > .form-check > .form-check-label > .form-check-input"
    );
  }

  howWillThisBeOfferedRadioButton() {
    return cy.xpath("//input[@id='ev71tr-Part Time']");
  }

  offeringBeDeliveredRadioButton() {
    return cy.get("#eqelas-onsite");
  }

  workIntegratedComponentRadioButton() {
    return cy.get("#evhzrlx-no");
  }

  studyStartDate() {
    return cy.get('#eryjb2i > [ref="element"] > .input-group > .input');
  }

  studyEndDate() {
    return cy.get('#ebqtys > [ref="element"] > .input-group > .input');
  }

  breakStartDate() {
    return cy.get(
      '#e4xdqvr0000000000000000000000000000000000000 > [ref="element"] > .input-group > .input'
    );
  }

  breakEndDate() {
    return cy.get(
      '#ex3qj3m0000000000000000000000000000000000000 > [ref="element"] > .input-group > .input'
    );
  }

  actualTuitionInput() {
    return cy.get("#e3iuupj-actualTuitionCosts");
  }

  programRelatedInput() {
    return cy.get("#edg8oot-programRelatedCosts");
  }

  mandatoryFeesInput() {
    return cy.get("#expot7k-mandatoryFees");
  }

  exceptionalExpensesInput() {
    return cy.get("#e3mdxgr-exceptionalExpenses");
  }

  tuitionRemittanceRadioButton() {
    return cy.get(
      ":nth-child(1) > .form-check-label > #tuitionRemittanceRequested"
    );
  }

  amountRequestedInput() {
    return cy.get("#eim5ou-tuitionRemittanceRequestedAmount");
  }

  declarationFormForVerification() {
    return cy.get(".field-required > .form-check-input");
  }

  submitButtonStudyPeriod() {
    return cy.get("#e673e1 > .btn");
  }

  educationOfferingCreatedAssertion() {
    return cy.contains("Education Offering created successfully!");
  }

  searchStudyPeriodInput() {
    return cy.get(".float-right > .p-inputtext");
  }

  firstRecordAssertionStudyPeriod() {
    return cy.get(".p-datatable-tbody > :nth-child(1) > :nth-child(1)");
  }
}
