import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionProfileObject from "../../page-objects/Institution-objects/InstitutionProfileObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import { profileData } from "../../../data/dev/institution-data/institutionProfileData";

describe("Institution Profile", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const institutionObject = new InstitutionProfileObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("institutionURL");

  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it("Verify that user redirect to institution profile page", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
  });

  it("Check that legal operating name text field should be disable or not", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
    institutionObject.legalOperatingNameInputText().should("be.disabled");
  });

  it("Clicking on the save button without filling out the required fields", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
    institutionObject.primaryEmailInputText().should("be.visible");
  });

  it("Check that when user enter data only in non mandatory field and click on next section.", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
  });

  it("Make sure enable fields are editable and disable fields are not.", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
    cy.wait("@institution");
    institutionObject.primaryPhoneNumberInputText().should("be.disabled");

    institutionObject.primaryEmailInputText().should("be.disabled");

    institutionObject.establishedDate().should("be.disabled");
    institutionObject.firstNameInstitutionInputText().should("be.disabled");
    institutionObject.lastNameInstitutionInputText().should("be.disabled");
    institutionObject.emailInstitutionInputText().should("be.disabled");
    institutionObject.phoneNumberInstitutionInputText().should("be.disabled");

    institutionObject
      .addressInstitutionInputText()
      .clear()
      .type(profileData.addressInput);
    institutionObject.cityInputText().clear().type(profileData.cityInput);
    institutionObject.countryInputText().click();
    institutionObject
      .countrySearchInputText(profileData.countryInput)
      .type("{enter}");
    institutionObject.provinceInputText().click({ force: true });
    institutionObject
      .provinceSearchInputText(profileData.provinceState)
      .type("{enter}");
    institutionObject.postalInputText().clear().type(profileData.postalInput);
  });
});
