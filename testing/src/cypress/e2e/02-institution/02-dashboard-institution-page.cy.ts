import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import ManageInstitutionObject from "../../page-objects/Institution-objects/ManageInstitutionObject";
import InstitutionHelperActions from "./common-helper-functions.cy";

const dashboardObject = new DashboardInstitutionObject();
const institutionCustomCommand = new InstitutionCustomCommand();
const manageInstituionObject = new ManageInstitutionObject();
const institutionHelperActions = new InstitutionHelperActions()

const URL = institutionHelperActions.getLoginUrlForTestEnv();
const USERNAME = institutionHelperActions.getUserNameSingleLocation();
const PASSWORD = institutionHelperActions.getUserPasswordSingleLocation();

describe("Dashboard Page", () => {
  beforeEach(() => {
    cy.visit(URL);
    institutionCustomCommand.loginWithCredentials(USERNAME, PASSWORD);
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
    //Needs validation with the notifications.
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
