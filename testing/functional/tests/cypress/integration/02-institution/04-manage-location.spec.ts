import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageLocationObject from "../../page-objects/Institution-objects/ManageLocationObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Manage Locations", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const institutionManageLocationObject = new ManageLocationObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("institutionURL");

  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it(
    "Verify that user redirect to institution manage location page",
    { retries: 4 },
    () => {
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      dashboardInstitutionObject.locationVerifyText().should("be.visible");
      institutionManageLocationObject.manageLocationButton().click();
      dashboardInstitutionObject.locationVerifyText().should("be.visible");
    }
  );

  it("Verify that user redirect to edit page of institution manage location", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionManageLocationObject.manageLocationButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionManageLocationObject.editLocationButton().click();
    cy.url().should("contain", "/edit-institution-location");
  });

  it("Verify that edit button is working or not", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.editLocationButton().click();
    institutionManageLocationObject
      .additionalInstitutionLocationMessage()
      .should("be.visible");
  });

  it("Verify that by clicking on Add New Location button redirects to appropriate page or not", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.addNewLocationButton().click();
    institutionManageLocationObject
      .additionalInstitutionLocationMessage()
      .should("be.visible");
  });

  it("Verify that without filling mandatory fields, submit button must be disabled", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.editLocationButton().click();
    institutionManageLocationObject.submitButton().should("be.disabled");
  });

  it("Verify that after filling all details, submit button must be enabled", () => {
    cy.fixture("institutionManageLocationData").then((data) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      institutionManageLocationObject.manageLocationButton().click();
      institutionManageLocationObject.editLocationButton().click();
      cy.wait("@location");
      institutionManageLocationObject
        .institutionCode()
        .clear()
        .type(data.institutionCode);
      institutionManageLocationObject
        .locationName()
        .click()
        .clear()
        .type(data.locationName);
      institutionManageLocationObject.addressFirst().clear().type(data.address);
      institutionManageLocationObject.cityInputText().clear().type(data.city);
      institutionManageLocationObject
        .postalCode()
        .clear()
        .type(data.postalCode);
      institutionManageLocationObject.stateInputText().clear().type(data.state);
      institutionManageLocationObject
        .countryInputText()
        .clear()
        .type(data.country);
      institutionManageLocationObject
        .firstNameInputText()
        .clear()
        .type(data.firstName);
      institutionManageLocationObject
        .lastNameINputText()
        .clear()
        .type(data.lastName);
      institutionManageLocationObject.emailInputText().clear().type(data.email);
      institutionManageLocationObject
        .phoneInputText()
        .clear()
        .type(data.phoneNumber);
      institutionManageLocationObject.submitButton().should("be.enabled");
    });
  });

  it("Verify that user have proper error messages when mandatory fields are not filled out", () => {
    cy.fixture("institutionManageLocationData").then((data) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      institutionManageLocationObject.manageLocationButton().click();
      institutionManageLocationObject.editLocationButton().click();
      cy.wait("@location");
      institutionManageLocationObject
        .institutionCode()
        .type(data.institutionCode)
        .clear();
      institutionManageLocationObject
        .locationName()
        .click()
        .type(data.locationName)
        .clear();
      institutionManageLocationObject.addressFirst().type(data.address).clear();
      institutionManageLocationObject.cityInputText().type(data.city).clear();
      institutionManageLocationObject
        .postalCode()
        .type(data.postalCode)
        .clear();
      institutionManageLocationObject.stateInputText().type(data.state).clear();
      institutionManageLocationObject
        .countryInputText()
        .type(data.country)
        .clear();
      institutionManageLocationObject
        .firstNameInputText()
        .type(data.firstName)
        .clear();
      institutionManageLocationObject
        .lastNameINputText()
        .type(data.lastName)
        .clear();
      institutionManageLocationObject.emailInputText().type(data.email).clear();
      institutionManageLocationObject
        .phoneInputText()
        .type(data.phoneNumber)
        .clear();
      institutionManageLocationObject
        .institutionCodeErrorMessage()
        .should("be.visible");
      institutionManageLocationObject
        .locationNameErrorMessage()
        .should("be.visible");
      institutionManageLocationObject
        .addressErrorMessage()
        .should("be.visible");
      institutionManageLocationObject.cityErrorMessage().should("be.visible");
      institutionManageLocationObject.postalErrorMessage().should("be.visible");
      institutionManageLocationObject.stateErrorMessage().should("be.visible");
      institutionManageLocationObject
        .countryErrorMessage()
        .should("be.visible");
      institutionManageLocationObject
        .firstNameErrorMessage()
        .should("be.visible");
      institutionManageLocationObject
        .lastNameErrorMessage()
        .should("be.visible");
      institutionManageLocationObject.emailErrorMessage().should("be.visible");
      institutionManageLocationObject
        .phoneNumberErrorMessage()
        .should("be.visible");
    });
  });

  it("Verify that submit button must be disabled if any input filled is erased", () => {
    cy.fixture("institutionManageLocationData").then((data) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      institutionManageLocationObject.manageLocationButton().click();
      institutionManageLocationObject.editLocationButton().click();
      cy.wait("@location");
      institutionManageLocationObject
        .institutionCode()
        .clear()
        .type(data.institutionCode);
      institutionManageLocationObject
        .locationName()
        .click()
        .clear()
        .type(data.locationName);
      institutionManageLocationObject.addressFirst().clear().type(data.address);
      institutionManageLocationObject.cityInputText().clear().type(data.city);
      institutionManageLocationObject
        .postalCode()
        .clear()
        .type(data.postalCode);
      institutionManageLocationObject.stateInputText().clear().type(data.state);
      institutionManageLocationObject
        .countryInputText()
        .clear()
        .type(data.country);
      institutionManageLocationObject
        .firstNameInputText()
        .clear()
        .type(data.firstName);
      institutionManageLocationObject
        .lastNameINputText()
        .clear()
        .type(data.lastName);
      institutionManageLocationObject.emailInputText().clear().type(data.email);
      institutionManageLocationObject
        .phoneInputText()
        .clear()
        .type(data.phoneNumber);
      institutionManageLocationObject.submitButton().should("be.enabled");
      institutionManageLocationObject.phoneInputText().clear();
      institutionManageLocationObject.submitButton().should("be.disabled");
    });
  });
});
