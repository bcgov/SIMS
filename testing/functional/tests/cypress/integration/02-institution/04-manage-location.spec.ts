import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageLocationObject from "../../page-objects/Institution-objects/ManageLocationObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Manage Locations", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const instituteManageLocationObject = new ManageLocationObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("institutionURL");

  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it("Verify that user redirect to institute manage location page", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    instituteManageLocationObject.manageLocationButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
  });

  it("Verify that user redirect to edit page of institute manage location", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    instituteManageLocationObject.manageLocationButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    instituteManageLocationObject.editLocationButton().click();
    cy.url().should("contain", "/edit-institution-location");
  });

  it("Verify that edit button is working or not", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    instituteManageLocationObject.manageLocationButton().click();
    instituteManageLocationObject.editLocationButton().click();
    instituteManageLocationObject
      .additionalInstituteLocationMessage()
      .should("be.visible");
  });

  it("Verify that by clicking on Start New Application button redirects to appropriate page or not", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    instituteManageLocationObject.manageLocationButton().click();
    instituteManageLocationObject.addNewLocationButton().click();
    instituteManageLocationObject
      .additionalInstituteLocationMessage()
      .should("be.visible");
  });

  it("Verify that without filling mandatory fields, submit button must be disabled", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    instituteManageLocationObject.manageLocationButton().click();
    instituteManageLocationObject.editLocationButton().click();
    instituteManageLocationObject.submitButton().should("be.disabled");
  });

  it("Verify that after filling all details, submit button must be enabled", () => {
    cy.fixture("institutionManageLocationData").then((data) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      instituteManageLocationObject.manageLocationButton().click();
      instituteManageLocationObject.editLocationButton().click();
      cy.wait("@location");
      instituteManageLocationObject
        .institutionCode()
        .clear()
        .type(data.institutionCode);
      instituteManageLocationObject
        .locationName()
        .click()
        .clear()
        .type(data.locationName);
      instituteManageLocationObject.addressFirst().clear().type(data.address);
      instituteManageLocationObject.cityInputText().clear().type(data.city);
      instituteManageLocationObject.postalCode().clear().type(data.postalCode);
      instituteManageLocationObject.stateInputText().clear().type(data.state);
      instituteManageLocationObject
        .countryInputText()
        .clear()
        .type(data.country);
      instituteManageLocationObject
        .firstNameInputText()
        .clear()
        .type(data.firstName);
      instituteManageLocationObject
        .lastNameINputText()
        .clear()
        .type(data.lastName);
      instituteManageLocationObject.emailInputText().clear().type(data.email);
      instituteManageLocationObject
        .phoneInputText()
        .clear()
        .type(data.phoneNumber);
      instituteManageLocationObject.submitButton().should("be.enabled");
    });
  });

  it("Verify that user have proper error messages when mandatory fields are not filled out", () => {
    cy.fixture("institutionManageLocationData").then((data) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      instituteManageLocationObject.manageLocationButton().click();
      instituteManageLocationObject.editLocationButton().click();
      cy.wait("@location");
      instituteManageLocationObject
        .institutionCode()
        .type(data.institutionCode)
        .clear();
      instituteManageLocationObject
        .locationName()
        .click()
        .type(data.locationName)
        .clear();
      instituteManageLocationObject.addressFirst().type(data.address).clear();
      instituteManageLocationObject.cityInputText().type(data.city).clear();
      instituteManageLocationObject.postalCode().type(data.postalCode).clear();
      instituteManageLocationObject.stateInputText().type(data.state).clear();
      instituteManageLocationObject
        .countryInputText()
        .type(data.country)
        .clear();
      instituteManageLocationObject
        .firstNameInputText()
        .type(data.firstName)
        .clear();
      instituteManageLocationObject
        .lastNameINputText()
        .type(data.lastName)
        .clear();
      instituteManageLocationObject.emailInputText().type(data.email).clear();
      instituteManageLocationObject
        .phoneInputText()
        .type(data.phoneNumber)
        .clear();
      instituteManageLocationObject
        .instituteCodeErrorMessage()
        .should("be.visible");
      instituteManageLocationObject
        .locationNameErrorMessage()
        .should("be.visible");
      instituteManageLocationObject.addressErrorMessage().should("be.visible");
      instituteManageLocationObject.cityErrorMessage().should("be.visible");
      instituteManageLocationObject.postalErrorMessage().should("be.visible");
      instituteManageLocationObject.stateErrorMessage().should("be.visible");
      instituteManageLocationObject.countryErrorMessage().should("be.visible");
      instituteManageLocationObject
        .firstNameErrorMessage()
        .should("be.visible");
      instituteManageLocationObject.lastNameErrorMessage().should("be.visible");
      instituteManageLocationObject.emailErrorMessage().should("be.visible");
      instituteManageLocationObject
        .phoneNumberErrorMessage()
        .should("be.visible");
    });
  });

  it("Verify that submit button must be disabled if any input filled is erased", () => {
    cy.fixture("institutionManageLocationData").then((data) => {
      cy.intercept("GET", "**/location/**").as("location");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      instituteManageLocationObject.manageLocationButton().click();
      instituteManageLocationObject.editLocationButton().click();
      cy.wait("@location");
      instituteManageLocationObject
        .institutionCode()
        .clear()
        .type(data.institutionCode);
      instituteManageLocationObject
        .locationName()
        .click()
        .clear()
        .type(data.locationName);
      instituteManageLocationObject.addressFirst().clear().type(data.address);
      instituteManageLocationObject.cityInputText().clear().type(data.city);
      instituteManageLocationObject.postalCode().clear().type(data.postalCode);
      instituteManageLocationObject.stateInputText().clear().type(data.state);
      instituteManageLocationObject
        .countryInputText()
        .clear()
        .type(data.country);
      instituteManageLocationObject
        .firstNameInputText()
        .clear()
        .type(data.firstName);
      instituteManageLocationObject
        .lastNameINputText()
        .clear()
        .type(data.lastName);
      instituteManageLocationObject.emailInputText().clear().type(data.email);
      instituteManageLocationObject
        .phoneInputText()
        .clear()
        .type(data.phoneNumber);
      instituteManageLocationObject.submitButton().should("be.enabled");
      instituteManageLocationObject.phoneInputText().clear();
      instituteManageLocationObject.submitButton().should("be.disabled");
    });
  });
});
