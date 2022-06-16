export default class MinistryUserViewsStudent {
  welcomeMessage() {
    return cy.contains("Welcome to AEST Portal");
  }

  applicationNumber() {
    return cy.get("[data-cy='appNumber']");
  }

  givenNames() {
    return cy.get("[data-cy='firstName']");
  }

  lastName() {
    return cy.get("[data-cy='lastName']");
  }

  searchButton() {
    return cy.xpath("//button[normalize-space()='Search']");
  }

  noStudentFoundText() {
    return cy.contains("No Students found");
  }

  firstNameText() {
    return cy.contains("First Name");
  }

  viewButtonFirstRow() {
    return cy.get("[data-cy='viewStudent']");
  }

  studentDetailsText() {
    return cy.contains("Student Details");
  }

  studentProfileText() {
    return cy.contains("Student Profile");
  }

  applicationsSectionsButton() {
    return cy.contains("Applications");
  }

  applicationSectionVerify() {
    return cy.contains("Application #");
  }

  restrictionsSectionButton() {
    return cy.contains("Restrictions");
  }

  restrictionsSectionVerify() {
    return cy.contains("All Restrictions");
  }

  notesSectionButton() {
    return cy.contains("Notes");
  }

  notesSectionVerify() {
    return cy.contains("Create new note");
  }

  viewButtonFirstRowApplication() {
    return cy.xpath("//tbody/tr[1]/td[6]");
  }

  waitForNextSelector() {
    return cy.wait(2000);
  }

  programSectionButton() {
    return cy.contains("Program");
  }

  personalInformationSectionButton() {
    return cy.contains("Personal information");
  }

  familyInformationSectionButton() {
    return cy.contains("Family information");
  }

  parentInformationSectionButton() {
    return cy.contains("Parent information");
  }

  financialInformationSectionButton() {
    return cy.contains("Financial information");
  }

  confirmSubmissionSectionButton() {
    return cy.contains("Confirm submission");
  }

  studentProfileVerify() {
    return cy.contains("Student Profile");
  }
}
