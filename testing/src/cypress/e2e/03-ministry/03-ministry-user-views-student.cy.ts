import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";
import { noteStudent } from "../../../data/dev/ministry-data/ministryNotesStudent";

const ministryCustomCommand = new MinistryCustomCommand();
const dashboardMinistryObject = new DashboardMinistryObject();
const ministryUserViewsStudent = new MinistryUserViewsStudent();
const url = Cypress.env("ministryURL");

function searchStudent() {
  ministryCustomCommand.loginMinistry();
  dashboardMinistryObject.dashboardText().should("be.visible");
  dashboardMinistryObject.searchStudentsText().click();
}

function givenNameSearch() {
  searchStudent();
  ministryUserViewsStudent.givenNames().type("a");
  ministryUserViewsStudent.searchButton().click();
}

function lastNameSearch() {
  searchStudent();
  ministryUserViewsStudent.lastName().type(noteStudent.lastNameStudent);
  ministryUserViewsStudent.searchButton().click();
}

function applicationSection() {
  lastNameSearch();
  ministryUserViewsStudent.firstNameText().should("be.visible");
  ministryUserViewsStudent.viewButtonFirstRow().click();
  ministryUserViewsStudent.studentDetailsText().should("be.visible");
  ministryUserViewsStudent.studentProfileText().should("be.visible");
  ministryUserViewsStudent.applicationsSectionsButton().click();
  ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
}

describe("Ministry User View Student Page", () => {
  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that the user is redirected to correct page Search student page & no results search is tested.", () => {
    searchStudent();
    dashboardMinistryObject.searchStudentsText().should("be.visible");
    ministryUserViewsStudent.applicationNumber().type("28e838");
    ministryUserViewsStudent.givenNames().type("ASAS");
    ministryUserViewsStudent.lastName().type("dsfds");
    ministryUserViewsStudent.searchButton().click({ force: true });
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
  });

  it("Verify that submit button is disabled when an input text is not filled in.", () => {
    searchStudent();
    ministryUserViewsStudent.searchButton().should("be.disabled");
    ministryUserViewsStudent.lastName().type("dsfds");
    ministryUserViewsStudent.searchButton().should("be.enabled");
  });

  it("Check that Application Number does not display any results when searched using alphabets.", () => {
    searchStudent();
    ministryUserViewsStudent.applicationNumber().type("HJKL");
    ministryUserViewsStudent.searchButton().click();
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
  });

  it("Check Given Names & Last Name does not display any results when searched using numbers.", () => {
    searchStudent();
    ministryUserViewsStudent.givenNames().type("543");
    ministryUserViewsStudent.searchButton().click();
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
    ministryUserViewsStudent.givenNames().clear();
    ministryUserViewsStudent.lastName().type("753");
    ministryUserViewsStudent.searchButton().click();
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
  });

  it("Check that when searching with given names & last names, records should be displayed.", () => {
    givenNameSearch();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.givenNames().clear();
    ministryUserViewsStudent.lastName().type("a");
    ministryUserViewsStudent.searchButton().click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
  });

  it("Verify that clicking the View button redirects to the student's profile page.", () => {
    lastNameSearch();
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
  });

  it("Verify that all sections are clickable and that they redirect to the appropriate pages.", () => {
    applicationSection();
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    ministryUserViewsStudent.notesSectionButton().click();
    ministryUserViewsStudent.notesSectionVerify().should("be.visible");
  });

  it("Verify that the minister user can view the student application.", () => {
    applicationSection();
    ministryUserViewsStudent.viewButtonFirstRowApplication().click();
    ministryUserViewsStudent.waitForNextSelector();
    ministryUserViewsStudent.programSectionButton().click();
    ministryUserViewsStudent.personalInformationSectionButton().click();
    ministryUserViewsStudent.familyInformationSectionButton().click();
    ministryUserViewsStudent.financialInformationSectionButton().click();
    ministryUserViewsStudent.confirmSubmissionSectionButton().click();
    cy.go("back");
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
  });
});
