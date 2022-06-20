export default class LocationProgramObject {
  createNewProgramButton() {
    return cy.contains("Create New Program");
  }

  submitButton() {
    return cy.get("[name='data[submit]']");
  }

  wait() {
    return cy.wait(2000);
  }

  programNameErrorMessage() {
    return cy.contains("Program name is required");
  }

  credentialType() {
    return cy.get("[name='data[credentialType]']");
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
    return cy.get("[name='data[name]']");
  }

  programDescriptionInputText() {
    return cy.get("[name='data[description]']");
  }

  credentialTypeInputText() {
    return cy.get("[name='data[credentialType]']");
  }

  cipCodeInputText() {
    return cy.get("[name='data[cipCode]']");
  }

  nocInputText() {
    return cy.get("#efcnjfm-nocCode");
  }

  sabcInputText() {
    return cy.get("#e8v6024-sabcCode");
  }

  institutionProgramCode() {
    return cy.get("[name='data[institutionProgramCode]']");
  }

  partTimeBasisRadioButton() {
    return cy.get("[type='radio']").eq(0);
  }

  programBeDeliveredRadioButton() {
    return cy.contains("On site");
  }

  programLengthInputText() {
    return cy.get("[name='data[completionYears]']");
  }

  programCourseLoadRadioButton() {
    return cy.get("[type='radio']").eq(2);
  }

  regulatoryBox() {
    return cy.get("[name='data[regulatoryBody]']");
  }

  entranceRequirementsCheckbox() {
    return cy.get("[name='data[entranceRequirements][]']").eq(0);
  }

  percentageOfProgramRadioButton() {
    return cy.contains("Less than 20%");
  }

  programOfferedJointlyRadioButton() {
    return cy.get("[type='radio']").eq(6);
  }

  institutionPartner() {
    return cy.get("[type='radio']").eq(8);
  }

  wilComponentRadioButton() {
    return cy.get("[type='radio']").eq(10);
  }

  wilApprovedByRegulatorRadioButton() {
    return cy.get("[type='radio']").eq(11);
  }

  wilMeetProgramRadioButton() {
    return cy.get("[type='radio']").eq(13);
  }

  fieldPlacementRadioButton() {
    return cy.get("[type='radio']").eq(15);
  }

  fieldPlacementEligibilityRadioButton() {
    return cy.get("[type='radio']").eq(17);
  }

  internationalExchangeRadioButton() {
    return cy.get("[type='radio']").eq(19);
  }

  internationalExchangeEligibilityRadioButton() {
    return cy.get("[type='radio']").eq(21);
  }

  declarationCheckbox() {
    return cy.contains("I confirm this program meets");
  }

  educationCreatedMessage() {
    return cy.contains("Education Program created successfully!");
  }

  firstRowEditButton() {
    return cy.get("[type='button']").eq(6);
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
    return cy.get("[name='data[offeringName]']");
  }

  yearOfStudyDropdown() {
    return cy.get(".form-control.ui");
  }

  yearOfStudyDropdownInputText() {
    return cy.get("[placeholder='Type to search']");
  }

  displayThisToStudentCheckbox() {
    return cy.get("[name='data[showYearOfStudy]']");
  }

  howWillThisBeOfferedRadioButton() {
    return cy.get("[type='radio']").eq(0);
  }

  offeringBeDeliveredRadioButton() {
    return cy.get("[type='radio']").eq(3);
  }

  workIntegratedComponentRadioButton() {
    return cy.get("[type='radio']").eq(6);
  }

  studyStartDate() {
    return cy.get("[placeholder='Select date']").eq(1);
  }

  studyEndDate() {
    return cy.get("[placeholder='Select date']").eq(3);
  }

  breakStartDate() {
    return cy.get("[placeholder='Select date']").eq(5);
  }

  breakEndDate() {
    return cy.get("[placeholder='Select date']").eq(7);
  }

  actualTuitionInput() {
    return cy.get("[name='data[actualTuitionCosts]']");
  }

  programRelatedInput() {
    return cy.get("[name='data[programRelatedCosts]']");
  }

  mandatoryFeesInput() {
    return cy.get("[name='data[mandatoryFees]']");
  }

  exceptionalExpensesInput() {
    return cy.get("[name='data[exceptionalExpenses]']");
  }

  tuitionRemittanceRadioButton() {
    return cy.get("[type='radio']").eq(8);
  }

  amountRequestedInput() {
    return cy.get("[name='data[tuitionRemittanceRequestedAmount]']");
  }

  addStudyPeriodRadioButton() {
    return cy.get("[data-cy='offeringType']").eq(1);
  }

  declarationFormForVerification() {
    return cy.get("[name='data[offeringDeclaration]']");
  }

  submitButtonStudyPeriod() {
    return cy.get("[name='data[submit]']");
  }

  educationOfferingCreatedAssertion() {
    return cy.contains("Education Offering created successfully!");
  }

  searchStudyPeriodInput() {
    return cy.get("[name='searchProgramName']");
  }

  firstRecordAssertionStudyPeriod() {
    return cy.contains("2022 Fall Semester");
  }
}
