import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionProfileObject from "../../page-objects/Institution-objects/InstitutionProfileObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Institution Profile", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const institutionObject = new InstitutionProfileObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("instituteURL");

  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it("Verify that user redirect to institute profile page", () => {
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
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionObject.institutionDetailsButton().click();
    institutionObject.primaryEmailInputText().clear();
    cy.wait(2000);
    institutionObject.submitButton().click();
  });

  it(
    "Check that when user enter data only in non mandatory field and click on next section.",
    { retries: 4 },
    () => {
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      dashboardInstitutionObject.locationVerifyText().should("be.visible");
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
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      dashboardInstitutionObject.locationVerifyText().should("be.visible");
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
