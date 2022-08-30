import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import LoginInstitutionObject from "../../page-objects/Institution-objects/LoginInstitutionObject";

const dashboardObject = new DashboardInstitutionObject();
const iCC = new InstitutionCustomCommand();
const loginObject = new LoginInstitutionObject();

const LOGIN_URL = Cypress.env("TEST").BASE_URL + "/institution/login";
const UNAME = Cypress.env("TEST").UNAME_1;
const PASS = Cypress.env("TEST").PASS_1;

describe("Login Page", () => {
  beforeEach(() => {
    cy.visit(LOGIN_URL);
  });

  it("Verify invalid uname/password field validation error", () => {
    iCC.loginWithCredentials("invalid", "invalid");
    loginObject
      .errorMessage()
      .should("have.text", "The user ID or password you entered is incorrect");
  });

  it("Verify login and logout successfully logout", () => {
    iCC.loginWithCredentials(UNAME, PASS);
    loginObject.welcomeMessageDashboard().should("be.visible");
    dashboardObject.iconButton().click();
    dashboardObject.logOutButton().click();
    loginObject
      .loginScreenWelcome()
      .should("include.text", "Welcome to StudentAid BC");
  });
});
