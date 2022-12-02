import BaseMethods from "./BaseMethods";

export const enum SideBarMenuItems {
  ManageProfile = "Manage Profile",
  ManageLocations = "Manage Locations",
  ManageDesignation = "Manage Designations",
  ManageUsers = "Manage Users",
}

export default class ManageInstitutionObject extends BaseMethods {
  clickOnSideBar(menuItem: string) {
    this.getElementByCyId("sideBarMenu")
      .get(".v-list-item-title")
      .contains(`${menuItem}`)
      .click();
  }

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
