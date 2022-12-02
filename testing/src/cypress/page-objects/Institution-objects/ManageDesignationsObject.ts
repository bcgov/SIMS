import BaseMethods from "./BaseMethods";

export default class ManageDesignationsObject extends BaseMethods {
  designationAgreementsHeaderText() {
    return this.getElementByCyId("manageDesignationHeader");
  }

  manageDesignationsBackButton() {
    return cy.contains("Manage designations");
  }

  viewDesignationButton() {
    return this.getElementByCyId("viewDesignation").eq(0);
  }

  viewDesignationText() {
    return cy.contains("View Designation");
  }

  designationStatus() {
    return this.getElementByCyId("designationStatus");
  }

  designationDetailsText() {
    return cy.contains("Designation details");
  }

  designatedLocationsText() {
    return cy.contains("Designated locations");
  }

  signingOfficersText() {
    return cy.contains("Signing officers");
  }

  agreementDocumentationText() {
    return cy.contains("Agreement documentation");
  }

  bcPolicyManualHyperlinkText() {
    return cy.contains("Schedule A - StudentAid BC Policy Manuals");
  }

  administrationManualHyperlinkText() {
    return cy.contains("Schedule B - StudentAid Administration Manual");
  }

  informationSharingAgreementHyperlinkText() {
    return cy.contains("Schedule D - Information Sharing agreement");
  }

  designationAcknowledgementsText() {
    return cy.contains("Designation acknowledgments");
  }

  manageLocationsHyperlink() {
    return cy.contains("manage locations");
  }

  manageUsersHyperlink() {
    return cy.contains("manage users");
  }

  requestDesignationButton() {
    return this.getElementByCyId("requestDesignation");
  }

  requestDesignationHeader() {
    return cy.get("Request Designation");
  }

  requestForDesignationCheckBox() {
    return this.getElementByCyId("requestForDesignationCheckBox").eq(0);
  }

  eligibilityOfficerName() {
    return this.getElementByCyId("eligibilityOfficerName");
  }

  eligibilityOfficerPosition() {
    return this.getElementByCyId("eligibilityOfficerPosition");
  }

  eligibilityOfficerEmail() {
    return this.getElementByCyId("eligibilityOfficerEmail");
  }

  eligibilityOfficerPhone() {
    return this.getElementByCyId("eligibilityOfficerPhone");
  }

  enrolmentOfficerName() {
    return this.getElementByCyId("enrolmentOfficerName");
  }

  enrolmentOfficerPosition() {
    return this.getElementByCyId("enrolmentOfficerPosition");
  }

  enrolmentOfficerEmail() {
    return this.getElementByCyId("enrolmentOfficerEmail");
  }

  enrolmentOfficerPhone() {
    return this.getElementByCyId("enrolmentOfficerPhone");
  }

  scheduleACheckbox() {
    return this.getElementByCyId("scheduleA");
  }

  scheduleBCheckbox() {
    return this.getElementByCyId("scheduleB");
  }

  scheduleDCheckbox() {
    return this.getElementByCyId("scheduleD");
  }

  agreementAcceptedCheckbox() {
    return this.getElementByCyId("agreementAccepted");
  }

  submitAgreementButton() {
    return cy.contains("Submit");
  }

  cancelAgreementButton() {
    return cy.contains("Cancel");
  }
}
