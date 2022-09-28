export default class ManageInstitutionObject {
  manageProfile() {
    return cy.contains("Manage Profile");
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
