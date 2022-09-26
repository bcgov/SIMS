export default class ManageDesignationsObject {
  manageDesignationButton() {
    return cy.contains("Manage Designation");
  }

  designationAgreementsText() {
    return cy.contains("Designation agreements");
  }

  viewDesignationButton() {
    return cy.contains("View");
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
}
