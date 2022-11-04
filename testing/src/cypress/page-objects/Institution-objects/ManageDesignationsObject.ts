export default class ManageDesignationsObject {
  manageDesignationButton() {
    return cy.contains("Manage Designation");
  }

  designationAgreementsText() {
    return cy.contains("Designation agreements");
  }

  viewDesignationButton() {
    return cy.get("[data-cy='viewDesignation']").eq(0);
  }

  viewDesignationText() {
    return cy.contains("View Designation");
  }

  manageDesignationsBackButton() {
    return cy.contains("Manage designations");
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
    return cy.get("[data-cy='requestDesignation']");
  }

  requestDesignationHeader() {
    return cy.get("Request Designation");
  }

  requestForDesignationCheckBox() {
    return cy.get("[data-cy='requestForDesignationCheckBox']").eq(0);
  }

  eligibilityOfficerName() {
    return cy.get("[data-cy='eligibilityOfficerName']");
  }

  eligibilityOfficerPosition() {
    return cy.get("[data-cy='eligibilityOfficerPosition']");
  }

  eligibilityOfficerEmail() {
    return cy.get("[data-cy='eligibilityOfficerEmail']");
  }

  eligibilityOfficerPhone() {
    return cy.get("[data-cy='eligibilityOfficerPhone']");
  }

  enrolmentOfficerName() {
    return cy.get("[data-cy='enrolmentOfficerName']");
  }

  enrolmentOfficerPosition() {
    return cy.get("[data-cy='enrolmentOfficerPosition']");
  }

  enrolmentOfficerEmail() {
    return cy.get("[data-cy='enrolmentOfficerEmail']");
  }

  enrolmentOfficerPhone() {
    return cy.get("[data-cy='enrolmentOfficerPhone']");
  }

  scheduleACheckbox() {
    return cy.get("[data-cy='scheduleA']");
  }

  scheduleBCheckbox() {
    return cy.get("[data-cy='scheduleB']");
  }

  scheduleDCheckbox() {
    return cy.get("[data-cy='scheduleD']");
  }

  agreementAcceptedCheckbox() {
    return cy.get("[data-cy='agreementAccepted']");
  }

  submitAgreementButton() {
    return cy.contains("Submit");
  }

  cancelAgreementButton() {
    return cy.contains("Cancel");
  }
}
