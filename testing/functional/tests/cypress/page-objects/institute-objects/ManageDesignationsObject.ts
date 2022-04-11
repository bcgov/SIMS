export default class ManageDesignationsObject {
  manageDesignationButton() {
    return cy.contains("Manage Designation");
  }

  designationAgreementsText() {
    return cy.contains("Designation agreements");
  }
}
