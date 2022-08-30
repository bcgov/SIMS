import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import ManageInstitutionObject from "../../page-objects/Institution-objects/ManageInstitutionObject";

const dashboardObject = new DashboardInstitutionObject();
const iCC = new InstitutionCustomCommand();
const manageInstituionObject = new ManageInstitutionObject();

const LOGIN_URL = Cypress.env("TEST").BASE_URL + "/institution/login";
const UNAME = Cypress.env("TEST").UNAME_1;
const PASS = Cypress.env("TEST").PASS_1;

describe("Dashboard Page", () => {
  beforeEach(() => {
    cy.visit(LOGIN_URL);
    iCC.loginWithCredentials(UNAME, PASS);
  });

  it("Verify that user is redirected to dashboard page", () => {
    cy.url().should("include", "/dashboard");
    dashboardObject.dashboardWelcomeMessage().should("be.visible");
    dashboardObject
      .dashboardStartMessage()
      .scrollIntoView()
      .should("be.visible");
    dashboardObject
      .dashboardHelpMessage()
      .scrollIntoView()
      .should("be.visible");
    dashboardObject
      .helpCenter()
      .scrollIntoView()
      .should("have.attr", "href", "https://studentaidbc.ca/help-centre");
  });

  it("Verify that all buttons are clickable in dashboard and redirect to appropriate pages.", () => {
    dashboardObject.dashboardButton().click();
    dashboardObject.notificationButton().click();
    //needs validation with the notifications
    dashboardObject.homeButton().click();
    dashboardObject.locationButton().click();
    dashboardObject.manageInstitutionButton().click();
    manageInstituionObject.institutionDetails().should("be.visible");
    manageInstituionObject.manageDesignation().should("be.visible");
    manageInstituionObject.manageLocations().should("be.visible");
    manageInstituionObject.manageUsers().should("be.visible");
    dashboardObject.profileButton().click();
    dashboardObject.iconButton().click();
    dashboardObject.logOutButton().click();
  });

  it("Verify that clicking on manage institution leads Location Summary page", () => {
    dashboardObject.dashboardButton().click();
    dashboardObject.manageInstitutionButton().click();
    dashboardObject.locationVerifyText().should("be.visible");
  });
});
