export default class DashboardInstitutionObject {
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

  profileIconButton() {
    return cy.get(".mdi-account");
  }

  logOffButton() {
    return cy.contains("Log off");
  }

  confirmationEnrollmentText() {
    return cy.contains("Confirm enrollment ");
  }

  confirmationEnrollmentVerifyText() {
    return cy.contains("Available to confirm enrollment");
  }

  upcomingEnrollmentText() {
    return cy.contains("Upcoming enrollment");
  }

  upcomingEnrollmentVerifyText() {
    return cy.contains("Upcoming enrollment");
  }

  locationVerifyText() {
    return cy.contains("Location Summary");
  }
}
