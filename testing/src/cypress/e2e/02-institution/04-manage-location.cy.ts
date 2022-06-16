import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageLocationObject from "../../page-objects/Institution-objects/ManageLocationObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import { manageLocation } from "../../../data/dev/institution-data/institutionManageLocation";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionManageLocationObject = new ManageLocationObject();
const institutionCustomCommand = new InstitutionCustomCommand();
const url = Cypress.env("institutionURL");

function manageInstitution() {
  dashboardInstitutionObject.dashboardButton().click();
  dashboardInstitutionObject.manageInstitutionButton().click();
}

function intercept() {
  cy.intercept("GET", "**/location/**").as("location");
}

function institutionCode() {
  intercept();
  manageInstitution();
  institutionManageLocationObject.manageLocationButton().click();
  institutionManageLocationObject.editLocationButton().click();
  cy.wait("@location");
  institutionManageLocationObject.institutionCode().should("be.disabled");
}

function institutionInputText() {
  institutionCode();
  institutionManageLocationObject.locationName().should("be.disabled");
  institutionManageLocationObject.addressFirst().should("be.disabled");
  institutionManageLocationObject.cityInputText().should("be.disabled");
  institutionManageLocationObject.countryInputText().should("be.disabled");
}

describe("Manage Locations", () => {
  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it("Verify that user redirect to institution manage location page", () => {
    manageInstitution();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionManageLocationObject.manageLocationButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
  });

  it("Verify that user redirect to edit page of institution manage location", () => {
    manageInstitution();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionManageLocationObject.manageLocationButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionManageLocationObject.editLocationButton().click();
    cy.url().should("contain", "/edit-institution-location");
  });

  it("Verify that edit button is working or not", () => {
    manageInstitution();
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.editLocationButton().click();
    institutionManageLocationObject.editLocationMessage().should("be.visible");
  });

  it("Verify that by clicking on Add New Location button redirects to appropriate page or not", () => {
    manageInstitution();
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.addNewLocationButton().click();
    institutionManageLocationObject.addLocationMessage().should("be.visible");
  });

  it("Verify that without filling mandatory fields, submit button must be disabled", () => {
    manageInstitution();
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.editLocationButton().click();
  });

  it("Verify that after filling all details, submit button must be enabled", () => {
    institutionInputText();
    institutionManageLocationObject
      .firstNameInputText()
      .clear()
      .type(manageLocation.firstName);
    institutionManageLocationObject
      .lastNameINputText()
      .clear()
      .type(manageLocation.lastName);
    institutionManageLocationObject
      .emailInputText()
      .clear()
      .type(manageLocation.email);
    cy.focused();
    institutionManageLocationObject
      .phoneInputText()
      .clear()
      .type(manageLocation.phoneNumber);
  });

  it("Verify that user have proper error messages when mandatory fields are not filled out", () => {
    institutionInputText();
    institutionManageLocationObject
      .firstNameInputText()
      .type(manageLocation.firstName)
      .clear();
    institutionManageLocationObject
      .lastNameINputText()
      .type(manageLocation.lastName)
      .clear();
    institutionManageLocationObject
      .emailInputText()
      .type(manageLocation.email)
      .clear();
    institutionManageLocationObject
      .phoneInputText()
      .type(manageLocation.phoneNumber)
      .clear();
    cy.contains("First name is required");
    cy.contains("Last name is required");
    cy.contains("Email is required");
  });
});
