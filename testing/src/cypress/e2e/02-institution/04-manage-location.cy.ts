import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageLocationObject from "../../page-objects/Institution-objects/ManageLocationObject";
import InstitutionHelperActions from "./common-helper-functions.cy";
import data from "./data/manage-location.json";
const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionManageLocationObject = new ManageLocationObject();
const institutionHelperActions = new InstitutionHelperActions();

function intercept() {
  cy.intercept("GET", "**/location/**").as("location");
}

function loginAndClickOnManageInstitution(){
  institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
}

function loginAndClickOnEditLocation(){
  loginAndClickOnManageInstitution();
  intercept();
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.editLocationButton().click();
    cy.wait("@location");
}

function loginAndClickOnAddNewLocation(){
  loginAndClickOnManageInstitution()
  institutionManageLocationObject.addNewLocationButton().click();
}

describe("'Manage Location' - Fields and Titles", () => {
  beforeEach(() => {    
    loginAndClickOnManageInstitution();
  });

  it("Verify that user is redirected to institution manage location page", () => {
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    institutionManageLocationObject.manageLocationButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    dashboardInstitutionObject.locationsList().should("be.visible");
  });

  it("Verify that user is redirected to edit page of institution manage location", () => {
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.editLocationButton().click();
    cy.url().should("contain", "/edit-institution-location");
  });

  it("Verify that user is redirected to edit some of the fields", () => {
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.editLocationButton().click();
    institutionManageLocationObject.editLocationMessage().should("be.visible");
    institutionManageLocationObject.locationNameText().should("be.visible");
    institutionManageLocationObject.institutionCode().should("be.visible");
    institutionManageLocationObject.address1Text().should("be.visible");
    institutionManageLocationObject.address2Text().should("be.visible");
    institutionManageLocationObject.countryText().should("be.visible");
    institutionManageLocationObject.provinceText().should("be.visible");
    institutionManageLocationObject.cityText().should("be.visible");
    institutionManageLocationObject.postalCodeText().should("be.visible");
    institutionManageLocationObject.primaryContactText().should("be.visible");
    institutionManageLocationObject.firstNameText().should("be.visible");
    institutionManageLocationObject.lastNameText().should("be.visible");
    institutionManageLocationObject.phoneNumberText().should("be.visible");
    institutionManageLocationObject.emailText().should("be.visible");
  });

  it("Verify that is redirected to 'Add New Location' page", () => {
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.addNewLocationButton().click();
    institutionManageLocationObject.addLocationMessage().should("be.visible");
    institutionManageLocationObject.locationNameText().should("be.visible");
    institutionManageLocationObject.institutionCode().should("be.visible");
    institutionManageLocationObject.address1Text().should("be.visible");
    institutionManageLocationObject.address2Text().should("be.visible");
    institutionManageLocationObject.countryText().should("be.visible");
    institutionManageLocationObject.cityText().should("be.visible");
    institutionManageLocationObject.primaryContactText().should("be.visible");
    institutionManageLocationObject.firstNameText().should("be.visible");
    institutionManageLocationObject.lastNameText().should("be.visible");
    institutionManageLocationObject.phoneNumberText().should("be.visible");
    institutionManageLocationObject.emailText().should("be.visible");
  });
});

describe("'Edit Location' page inline error and validations", () => {
  before(() => {   
    loginAndClickOnEditLocation();
  });

  it("Verify that error messages are displayed when mandatory fields are not filled out", () => {
    institutionManageLocationObject.firstNameInputText().clear();
    institutionManageLocationObject.lastNameInputText().clear();
    institutionManageLocationObject.emailInputText().clear();
    institutionManageLocationObject.phoneInputText().clear();
    cy.contains("First name is required");
    cy.contains("Last name is required");
    cy.contains("Email is required");
    cy.contains("Phone number is required");
  });

  it("Verify that email field does not accept invalid email formats", () => {
    data.invalidData.emailAddress.forEach((element: string) => {
      institutionManageLocationObject.emailInputText().clear().type(element);
      cy.contains("Email must be a valid email.");
    });
  });

  it("Verify that email field accepts valid email formats", () => {
    data.validData.emailAddress.forEach((element: string) => {
      institutionManageLocationObject.emailInputText().clear().type(element);
      cy.contains("Email must be a valid email.").should("not.exist");
    });
  });

  it("Verify that phone number field does not accept numbers below 10 and above 20", () => {
    data.invalidData.phoneNumberBelow10.forEach((element: string) => {
      institutionManageLocationObject.phoneInputText().clear().type(element);
      cy.contains("Phone number must have at least 10 characters.").should(
        "exist"
      );
    });    
    data.invalidData.phoneNumberAbove20.forEach((element: string) => {
      institutionManageLocationObject.phoneInputText().clear().type(element);
      cy.contains("Phone number must have no more than 20 characters.").should(
        "exist"
      );
    });
  });

  it("Verify that phone number field accepts valid number formats", () => {
    data.validData.phoneNumber.forEach((element: string) => {
      institutionManageLocationObject.phoneInputText().clear().type(element);
      cy.contains("Phone number must have no more than 20 characters.").should(
        "not.exist"
      );
      cy.contains("Phone number must have at least 10 characters.").should(
        "not.exist"
      );
    });
  });
});

describe("'Add New Location' inline errors validation", () => {
  before(() => {    
    loginAndClickOnAddNewLocation();
  });

  it("All mandatory fields - and inline error validations", () => {
    institutionManageLocationObject.submitButton().click();
    cy.contains("Please fix the following errors before submitting.").should(
      "exist"
    );
    cy.contains("Institution code is required").should("exist");
    cy.contains("Address 1 is required").should("exist");
    cy.contains("Country is required").should("exist");
    cy.contains("City is required").should("exist");
    cy.contains("First name is required").should("exist");
    cy.contains("Last name is required").should("exist");
    cy.contains("Email is required").should("exist");
    cy.contains("Phone number is required").should("exist");
    cy.contains(
      "Please check the form and correct all errors before submitting."
    ).should("exist");
  });

  it("Verify that location name should accept aplha-numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (element: string) => {
        institutionManageLocationObject.locationName().clear().type(element);
        cy.contains("Location name must").should("not.exist");
        cy.contains("Location name is").should("not.exist");
      }
    );
  });

  it("Verify that location name should not accept more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((element: string) => {
      institutionManageLocationObject.locationName().clear().type(element);
      cy.contains(
        "Location name must have no more than 100 characters."
      ).should("exist");
    });
  });

  it("Verify that institution code should accept only alphabets", () => {
    data.invalidData.institutionCodeNonAplhabets.forEach((element: string) => {
      institutionManageLocationObject.institutionCode().clear().type(element);
      cy.contains("Institution code does not match the pattern [A-Z]*").should(
        "exist"
      );
    });
    data.validData.institutionCode.forEach((element: string) => {
      institutionManageLocationObject.institutionCode().clear().type(element);
      cy.contains("Institution code does not match the pattern [A-Z]*").should(
        "not.exist"
      );
    });
  });

  it("Verify that institution code should accept only 4 chars", () => {
    data.invalidData.institutionCodeBelow4.forEach((element: string) => {
      institutionManageLocationObject.institutionCode().clear().type(element);
      cy.contains("Institution code must have at least 4 characters.").should(
        "exist"
      );
    });
    data.invalidData.institutionCodeAbove4.forEach((element: string) => {
      institutionManageLocationObject.institutionCode().clear().type(element);
      cy.contains(
        "Institution code must have no more than 4 characters."
      ).should("exist");
    });
  });

  it("Verify that Address 1 and Address 2 should not have more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((element: string) => {
      institutionManageLocationObject.addressLine1().clear().type(element);
      cy.contains("Address 1 must have no more than 100 characters.").should(
        "exist"
      );
      institutionManageLocationObject.addressLine2().clear().type(element);
      cy.contains("Address 2 must have no more than 100 characters.").should(
        "exist"
      );
    });
  });

  it("Verify that Address 1 and Address 2 should accept more alpha numeric and special", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (element: string) => {
        institutionManageLocationObject.addressLine1().clear().type(element);
        cy.contains("Address 1 must have ").should("not.exist");
        institutionManageLocationObject.addressLine2().clear().type(element);
        cy.contains("Address 2 must have ").should("not.exist");
      }
    );
  });

  it("Verify that city field should accept alpha numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (element: string) => {
        institutionManageLocationObject.cityInputText().clear().type(element);
        cy.contains("City must have ").should("not.exist");
      }
    );
  });
  it("Verify that city field should not accept more than chars 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((element: string) => {
      institutionManageLocationObject.cityInputText().clear().type(element);
      cy.contains("City must have no more than 100 characters.").should(
        "exist"
      );
    });
  });
});

describe("Country drop-down items and provinces", () => {
  beforeEach(() => {    
    loginAndClickOnAddNewLocation()
    institutionManageLocationObject.countryDropDownMenu().click();
  });

  it("Verify that Country dropdown should have two items - Canada and Other", () => {
    institutionManageLocationObject
      .countryCanadaFromDropDownMenu()
      .should("have.text", "Canada");
    institutionManageLocationObject
      .countryOtherFromDropDownMenu()
      .should("have.text", "Other");
  });

  it("Verify that selecting Canada should display available Provinces and Postal code", () => {
    institutionManageLocationObject.countryCanadaFromDropDownMenu().click();
    institutionManageLocationObject.provinceDropDownMenu().click();
    institutionManageLocationObject.provinceABFromDropDown().should("exist");
    institutionManageLocationObject.provinceBCFromDropDown().should("exist");
    institutionManageLocationObject.provinceMBFromDropDown().should("exist");
    institutionManageLocationObject.provinceNBFromDropDown().should("exist");
    institutionManageLocationObject.provinceNLFromDropDown().should("exist");
    institutionManageLocationObject.provinceNSFromDropDown().should("exist");
    institutionManageLocationObject.provinceONFromDropDown().should("exist");
    institutionManageLocationObject.provinceQCFromDropDown().should("exist");
    institutionManageLocationObject.provinceNTFromDropDown().should("exist");
    institutionManageLocationObject.provinceYUFromDropDown().should("exist");
    institutionManageLocationObject.provinceNUFromDropDown().should("exist");
    institutionManageLocationObject.provinceSKFromDropDown().should("exist");
    institutionManageLocationObject
      .canadaPostalCode()
      .should("exist")
      .should("have.attr", "placeholder", "___ ___");
  });

  it("Verify that selecting Other Country should display field to enter country and postal code format changes", () => {
    institutionManageLocationObject.countryOtherFromDropDownMenu().click();
    institutionManageLocationObject.otherCountryInputText().should("exist");
    institutionManageLocationObject
      .otherCountryInputText()
      .should("have.attr", "placeholder", "Enter your country");
    institutionManageLocationObject.otherPostalCode().should("exist");
  });

  it("Verify that selecting 'Other' Country field should accept alpha numeric chars", () => {
    institutionManageLocationObject.countryOtherFromDropDownMenu().click();
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (element: string) => {
        institutionManageLocationObject
          .otherCountryInputText()
          .clear()
          .type(element);
        cy.get("Other country must").should("not.equal");
      }
    );
  });

  it("Verify that selecting 'Other' Country field should not accept more than 100 chars", () => {
    institutionManageLocationObject.countryOtherFromDropDownMenu().click();
    data.invalidData.stringWithMoreThan100Chars.forEach((element: string) => {
      institutionManageLocationObject
        .otherCountryInputText()
        .clear()
        .type(element);
      cy.get("Other country must").should("not.equal");
    });
  });
});

describe("Primary Contact Information Validation", () => {
  beforeEach(() => {   
    loginAndClickOnAddNewLocation();    
  });
  it("Verify that FirstName should accept alpha numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (element: string) => {
        institutionManageLocationObject
          .firstNameInputText()
          .clear()
          .type(element);
        cy.contains("First name must ").should("not.exist");
      }
    );
  });

  it("Verify that FirstName should not accept more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((element: string) => {
      institutionManageLocationObject
        .firstNameInputText()
        .clear()
        .type(element);
      cy.contains("First name must ").should("not.exist");
    });
  });

  it("Verify that LastName should accept alpha numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (element: string) => {
        institutionManageLocationObject
          .lastNameInputText()
          .clear()
          .type(element);
        cy.contains("Last name must ").should("not.exist");
      }
    );
  });

  it("Verify that LastName should not accept more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((element: string) => {
      institutionManageLocationObject.lastNameInputText().clear().type(element);
      cy.contains("Last name must ").should("not.exist");
    });
  });

  it("Verify that email field does not accept invalid emails", () => {
    data.invalidData.emailAddress.forEach((element: string) => {
      institutionManageLocationObject.emailInputText().clear().type(element);
      cy.contains("Email must be a valid email.");
    });
  });

  it("Verify that email field accepts valid emails", () => {
    data.validData.emailAddress.forEach((element: string) => {
      institutionManageLocationObject.emailInputText().clear().type(element);
      cy.contains("Email must be a valid email.").should("not.exist");
    });
  });

  it("Verify that phone number field does not accept numbers below 10 and above 20", () => {
    data.invalidData.phoneNumberBelow10.forEach((element: string) => {
      institutionManageLocationObject.phoneInputText().clear().type(element);
      cy.contains("Phone number must have at least 10 characters.").should(
        "exist"
      );
    });
    data.invalidData.phoneNumberAbove20.forEach((element: string) => {
      institutionManageLocationObject.phoneInputText().clear().type(element);
      cy.contains("Phone number must have no more than 20 characters.").should(
        "exist"
      );
    });
  });

  it("Verify that phone number field accepts valid numbers", () => {
    data.validData.phoneNumber.forEach((element: string) => {
      institutionManageLocationObject.phoneInputText().clear().type(element);
      cy.contains("Phone number must have no more than 20 characters.").should(
        "not.exist"
      );
      cy.contains("Phone number must have at least 10 characters.").should(
        "not.exist"
      );
    });
  });
});
