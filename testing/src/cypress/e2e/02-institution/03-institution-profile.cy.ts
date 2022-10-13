import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionProfileObject from "../../page-objects/Institution-objects/InstitutionProfileObject";
import { profileData } from "../../../data/dev/institution-data/institutionProfileData";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionObject = new InstitutionProfileObject();
const institutionHelperActions = new InstitutionHelperActions();

describe("Institution Profile", () => {
  beforeEach(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  it("Verify that user redirect to institution profile page", () => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    institutionObject.manageProfileButton().click();
  });

  it("Check that legal operating name text field should be disable or not", () => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    institutionObject.manageProfileButton().click();
    institutionObject.legalOperatingNameInputText().should("be.disabled");
  });

  it("Clicking on the save button without filling out the required fields", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    institutionObject.manageProfileButton().click();
    institutionObject.primaryEmailInputText().should("be.visible");
  });

  it("Check that when user enter data only in non mandatory field and click on next section.", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    institutionObject.manageProfileButton().click();
  });

  it("Make sure enable fields are editable and disable fields are not.", () => {
    cy.intercept("GET", "**/institution").as("institution");
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    institutionObject.manageProfileButton().click();
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
