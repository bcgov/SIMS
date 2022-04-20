import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionProfileObject from "../../page-objects/Institution-objects/InstitutionProfileObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

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
    institutionObject.institutionInformationText().should("be.visible");
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
    institutionObject.primaryEmailInputText().clear();
    cy.wait("@institution");
    institutionObject.submitButton().click();
  });

  it(
    "Check that when user enter data only in non mandatory field and click on next section.",
    { retries: 4 },
    () => {
      cy.intercept("GET", "**/institution").as("institution");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      dashboardInstitutionObject.locationVerifyText().should("be.visible");
      institutionObject.institutionDetailsButton().click();
      cy.reload();
      institutionObject.primaryEmailInputText().clear();
      institutionObject.primaryEmailInputText().clear();
      cy.wait("@institution");
      institutionObject.submitButton().click();
      institutionObject.unexpectedErrorMessage().should("be.visible");
    }
  );

  it("Check when user enter data only in mandatory field then able to save the details or not.", () => {
    cy.fixture("institutionProfileData").then((data) => {
      cy.intercept("GET", "**/institution").as("institution");
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      dashboardInstitutionObject.locationVerifyText().should("be.visible");
      institutionObject.institutionDetailsButton().click();
      cy.wait("@institution");
      institutionObject
        .primaryPhoneNumberInputText()
        .clear()
        .type(data.primaryPhoneNumber);

      institutionObject.primaryEmailInputText().clear().type(data.primaryEmail);
      institutionObject
        .institutionWebsiteInputText()
        .clear()
        .type(data.institutionWebsite);
      institutionObject.institutionRegulationBodyDropdown().click();
      institutionObject
        .institutionRegulationBodyDropdownInputType()
        .eq(1)
        .type("ITA")
        .type("{enter}");
      institutionObject.establishedDate("2022-08-01");
      institutionObject
        .firstNameInstitutionInputText()
        .clear()
        .type(data.firstNameInstitution);
      institutionObject
        .lastNameInstitutionInputText()
        .clear()
        .type(data.lastNameInstitution);
      institutionObject
        .emailInstitutionInputText()
        .clear()
        .type(data.emailInstitution);
      institutionObject
        .phoneNumberInstitutionInputText()
        .clear()
        .type(data.phoneNumberInstitution);
      institutionObject
        .firstNameAuthorizedInputText()
        .clear()
        .type(data.firstNameAuthorized);
      institutionObject
        .lastNameAuthorizedInputText()
        .clear()
        .type(data.lastNameAuthorized);
      institutionObject
        .emailAuthorizedInputText()
        .clear()
        .type(data.emailAuthorized);
      institutionObject
        .phoneNumberAuthorizedInputText()
        .clear()
        .type(data.phoneNumberAuthorized);
      institutionObject
        .addressInstitutionInputText()
        .clear()
        .type(data.addressInput);
      institutionObject.cityInputText().clear().type(data.cityInput);
      institutionObject.postalInputText().clear().type(data.postalInput);
      institutionObject.provinceInputText().clear().type(data.postalInput);
      institutionObject.countryInputText().clear().type(data.countryInput);
      institutionObject.submitButton().click();
    });
  });
});
