import LoginInstituteObject from "../../page-objects/institute-objects/LoginInstituteObject";
import DashboardInstituteObject from "../../page-objects/institute-objects/DashboardInstituteObject";
import InstitutionProfileObject from "../../page-objects/institute-objects/InstitutionProfileObject";

describe("Institute Profile", () => {
  const loginInstituteObject = new LoginInstituteObject();
  const dashboardInstituteObject = new DashboardInstituteObject();
  const institutionObject = new InstitutionProfileObject();

  const url = Cypress.env("instituteURL");
  const username = Cypress.env("bceid");
  const password = Cypress.env("password");

  beforeEach(() => {
    cy.visit(url);
    cy.intercept("GET", "**/bceid-account").as("bceidAccount");
    loginInstituteObject.loginWithBCEID().should("be.visible").click();
    loginInstituteObject.loginInWithBCEIDtext().should("be.visible");
    loginInstituteObject
      .bceidInputText()
      .type(username)
      .should("have.value", username);
    loginInstituteObject
      .passwordInputText()
      .type(password)
      .should("have.value", password);
    loginInstituteObject.continueButton().click();
    cy.wait("@bceidAccount");
  });

  it("Verify that user redirect to institute profile page", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
    institutionObject.institutionInformationText().should("be.visible");
  });

  it("Check that legal operating name text field should be disable or not", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
    institutionObject.legalOperatingNameInputText().should("be.disabled");
  });

  it("Clicking on the save button without filling out the required fields", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
    institutionObject.primaryEmailInputText().clear();
    cy.wait(2000);
    institutionObject.submitButton().click();
  });

  it(
    "Check that when user enter data only in non mandatory field and click on next section.",
    { retries: 4 },
    () => {
      dashboardInstituteObject.dashboardButton().click();
      dashboardInstituteObject.manageInstitutionButton().click();
      dashboardInstituteObject.locationVerifyText().should("be.visible");
      institutionObject.institutionDetailsButton().click();
      cy.reload();
      institutionObject.primaryEmailInputText().clear();
      institutionObject.primaryEmailInputText().clear();
      cy.wait(2000);
      institutionObject.submitButton().click();
      institutionObject.unexpectedErrorMessage().should("be.visible");
    }
  );

  it("Check when user enter data only in mandatory field then able to save the details or not.", () => {
    cy.fixture("institutionProfileData").then((data) => {
      dashboardInstituteObject.dashboardButton().click();
      dashboardInstituteObject.manageInstitutionButton().click();
      dashboardInstituteObject.locationVerifyText().should("be.visible");
      institutionObject.institutionDetailsButton().click();
      cy.wait(1000);
      institutionObject
        .primaryPhoneNumberInputText()
        .clear()
        .type(data.primaryPhoneNumber);
      cy.wait(1000);
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
        .firstNameInstituteInputText()
        .clear()
        .type(data.firstNameInstitute);
      institutionObject
        .lastNameInstituteInputText()
        .clear()
        .type(data.lastNameInstitute);
      institutionObject
        .emailInstituteInputText()
        .clear()
        .type(data.emailInstitute);
      institutionObject
        .phoneNumberInstituteInputText()
        .clear()
        .type(data.phoneNumberInstitute);
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
        .addressInstituteInputText()
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
