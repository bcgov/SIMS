import BaseMethods from "./BaseMethods";

export default class DashboardInstitutionObject extends BaseMethods {
  institutionLandingPage() {
    return this.getElementByCyId("institutionHeader");
  }

  clickOnSideBar(location: string, menuItem: string) {
    cy.get("[data-cy='institutionSideBar']")
      .get(".v-list-item-title")
      .contains(`${location}`)
      .click()
      .parentsUntil(".v-list-group")
      .get(".v-list-item-title")
      .contains(`${menuItem}`)
      .click();
  }

  manageInstitutionProfileHeader() {
    return this.getElementByCyId("manageProfileHeader");
  }

  manageInstitutionButton() {
    return this.getElementByCyId("manageInstitutions");
  }

  myProfileButton() {
    return this.getElementByCyId("myProfile");
  }

  settingButton() {
    return this.getElementByCyId("settings");
  }
  /**
   * Elements identified by text only
   */
  dashboardWelcomeMessage() {
    return cy.contains("Welcome!");
  }

  dashboardStartMessage() {
    return cy.contains("Get started here");
  }

  dashboardHelpMessage() {
    return cy.contains("Need help?");
  }

  helpCenter() {
    return cy.contains("Help Centre");
  }

  programsButton() {
    return cy.contains("Programs");
  }

  activeApplicationsButton() {
    return cy.contains("Report a change");
  }

  programInfoRequestsButton() {
    return cy.contains("Program Info Requests");
  }

  confirmationOfEnrollment() {
    return cy.contains("Confirmation of Enrollment");
  }

  homeButton() {
    return cy.contains("Home");
  }

  iconButton() {
    return cy.get(".fa-user");
  }

  logOutButton() {
    return cy.contains("Log Out");
  }

  allLocationsText() {
    return cy.contains("All locations");
  }

  locationButton() {
    return cy.get(".v-list-group div:first");
  }

  manageLocationsText() {
    return cy.contains("Manage Locations");
  }
}
