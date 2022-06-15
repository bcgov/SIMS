import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";

describe("Dashboard Ministry Page", () => {
  const ministryCustomCommand = new MinistryCustomCommand();
  const dashboardMinistryObject = new DashboardMinistryObject();
  const url = Cypress.env("ministryURL");

  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify the user is redirected to dashboard page after logged in.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
  });

  it("Verify all buttons in Home Page is clickable & redirects to correct page or not.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    dashboardMinistryObject.searchStudentsText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    dashboardMinistryObject.searchInstitutionsText().should("be.visible");
    dashboardMinistryObject.pendingDesignationsText().click();
    dashboardMinistryObject.pendingDesignationsText().should("be.visible");
  });

  it("Check search button is clickable in pending designations section.", () => {
    cy.intercept("GET", "**/Pending").as("Pending");
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.pendingDesignationsText().click();
    cy.wait("@Pending");
    dashboardMinistryObject.pendingDesignationSearchInput().type("Searching");
    dashboardMinistryObject.pendingDesignationSearchButton().click();
  });
});
