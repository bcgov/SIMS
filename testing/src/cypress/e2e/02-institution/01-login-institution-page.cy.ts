import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import LoginInstitutionObject from "../../page-objects/Institution-objects/LoginInstitutionObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";

const dashboardObject = new DashboardInstitutionObject();
const institutionCustomCommand = new InstitutionCustomCommand();
const loginObject = new LoginInstitutionObject();
const institutionHelperActions = new InstitutionHelperActions();

const [URL, USERNAME, PASSWORD] =
  institutionHelperActions.getBaseUrlAndLoginCredentialsInstitution();

describe("[Institution Login] - Login Page", () => {
  beforeEach(() => {
    cy.visit(URL);
  });

  it("Verify invalid username/password field validation error", () => {
    // Please note that this is not a functionality that our application owns. If there is any issue with the test case, it should not be a blocker.
    institutionCustomCommand.loginWithCredentials("invalid", "invalid");
    loginObject
      .errorMessage()
      .should("have.text", "The user ID or password you entered is incorrect");
  });

  it("Verify login successfully", () => {
    institutionCustomCommand.loginWithCredentials(USERNAME, PASSWORD);
    dashboardObject.dashboardWelcomeMessage().should("be.visible");
  });

  it("Verify logout successfully", () => {
    institutionCustomCommand.loginWithCredentials(USERNAME, PASSWORD);
    dashboardObject.iconButton().click();
    dashboardObject.logOutButton().click();
    loginObject
      .loginScreenWelcome()
      .should("include.text", "Welcome to StudentAid BC");
  });
});
