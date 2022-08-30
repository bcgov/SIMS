export default class ManageInstitutionObject {
  institutionDetails() {
    return cy.contains("Institution Details");
  }

  manageLocations() {
    return cy.contains("Manage Locations");
  }
  manageDesignation() {
    return cy.contains("Manage Designation");
  }

  manageUsers() {
    return cy.contains("Manage Users");
  }
}
