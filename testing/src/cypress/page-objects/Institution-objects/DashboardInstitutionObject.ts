export default class DashboardInstitutionObject {
  dashboardWelcomeMessage() {
    return cy.contains("Welcome to your institution account!");
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

  dashboardButton() {
    return cy.contains("Dashboard");
  }

  notificationButton() {
    return cy.contains("Notifications");
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

  profileButton() {
    return cy.contains("PROFILE");
  }

  iconButton() {
    return cy.get(".fa-user");
  }

  logOutButton() {
    return cy.contains("Log Out");
  }

  locationVerifyText() {
    return cy.contains("Location Summary");
  }

  locationButton() {
    return cy.get(".v-list-group div:first");
  }
  locationsList() {
    return cy.contains("All Locations");
  }  
}
