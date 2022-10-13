export default class DashboardInstitutionObject {
  dashboardWelcomeMessage() {
    return cy.contains("Welcome to your account!");
  }

  dashboardStartMessage() {
    return cy.contains("Let's get started");
  }

  dashboardHelpMessage() {
    return cy.contains("Need help?");
  }

  helpCenter() {
    return cy.contains("Help Centre");
  }

  loginWithBCEID() {
    return cy.contains("Login with BCeID");
  }

  loginInWithBCEIDtext() {
    return cy.contains("Log in with");
  }

  bceidInputText() {
    return cy.get("#user");
  }

  passwordInputText() {
    return cy.get("#password");
  }

  continueButton() {
    return cy.get('input[type="submit"]');
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

  manageInstitutionButton() {
    return cy.contains("Manage Institution");
  }

  myProfileButton() {
    return cy.contains("My Profile");
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
