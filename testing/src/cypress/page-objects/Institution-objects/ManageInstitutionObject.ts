import BaseMethods from "./BaseMethods";

export default class ManageInstitutionObject extends BaseMethods {
  clickOnSideBar(menuItem: string) {
    this.getElementByCyId("sideBarMenu")
      .get(".v-list-item-title")
      .contains(`${menuItem}`)
      .click();
  }

  
  /**
   *
   * @returns
   */
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
