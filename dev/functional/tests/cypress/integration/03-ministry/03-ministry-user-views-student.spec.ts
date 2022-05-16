import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";

describe("Ministry User View Student Page", () => {
  const ministryCustomCommand = new MinistryCustomCommand();
  const dashboardMinistryObject = new DashboardMinistryObject();
  const ministryUserViewsStudent = new MinistryUserViewsStudent();
  const url = Cypress.env("ministryURL");

  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that the user is redirected to correct page Search student page & no results search is tested.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    dashboardMinistryObject.searchStudentsText().should("be.visible");
    ministryUserViewsStudent.applicationNumber().type("28e838");
    ministryUserViewsStudent.givenNames().type("ASAS");
    ministryUserViewsStudent.lastName().type("dsfds");
    ministryUserViewsStudent.searchButton().eq(1).click({ force: true });
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
  });

  it("Verify that submit button is disabled when an input text is not filled in.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.searchButton().eq(1).should("be.disabled");
    ministryUserViewsStudent.lastName().type("dsfds");
    ministryUserViewsStudent.searchButton().eq(1).should("be.enabled");
  });

  it("Check that Application Number does not display any results when searched using alphabets.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.applicationNumber().type("HJKL");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
  });

  it("Check Given Names & Last Name does not display any results when searched using numbers.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("543");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
    ministryUserViewsStudent.givenNames().clear();
    ministryUserViewsStudent.lastName().type("753");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.noStudentFoundText().should("be.visible");
  });

  it(
    "Check that when searching with given names & last names, records should be displayed.",
    { retries: { runMode: 2, openMode: 1 } },
    () => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsStudent.firstNameText().should("be.visible");
      ministryUserViewsStudent.givenNames().clear();
      ministryUserViewsStudent.lastName().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsStudent.firstNameText().should("be.visible");
    }
  );

  it("Verify that clicking the View button redirects to the student's profile page.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
  });

  it("Verify that all sections are clickable and that they redirect to the appropriate pages.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    ministryUserViewsStudent.notesSectionButton().click();
    ministryUserViewsStudent.notesSectionVerify().should("be.visible");
  });

  it("Verify that the minister user can view the student application.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
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
