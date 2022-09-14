import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageLocationObject from "../../page-objects/Institution-objects/ManageLocationObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import data from "../data/institution/manage-location.json";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionManageLocationObject = new ManageLocationObject();
const institutionHelperActions = new InstitutionHelperActions();

function loginAndClickOnManageInstitution() {
  institutionHelperActions.loginIntoInstitutionSingleLocation();
  dashboardInstitutionObject.dashboardButton().click();
  dashboardInstitutionObject.manageInstitutionButton().click();
}

function loginAndClickOnEditLocation() {
  loginAndClickOnManageInstitution();
  cy.intercept("GET", "**/location/**").as("location");
  institutionManageLocationObject.manageLocationButton().click();
  institutionManageLocationObject.editLocationButton().click();
  cy.wait("@location");
}

function loginAndClickOnAddNewLocation() {
  loginAndClickOnManageInstitution();
  institutionManageLocationObject.addNewLocationButton().click();
}

function verifyLocationAndContactDetails() {
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
}

function verifyInvalidEmailFormatsAreNotAllowed() {
  data.invalidData.emailAddress.forEach((text: string) => {
    institutionManageLocationObject.emailInputText().clear().type(text);
    cy.contains("Email must be a valid email.").should("be.visible");
  });
}

function verifyValidEmailFormatsAreAllowed() {
  data.validData.emailAddress.forEach((text: string) => {
    institutionManageLocationObject.emailInputText().clear().type(text);
    cy.contains("Email must be a valid email.").should("not.exist");
  });
}

function verifyPhoneNumberFieldNotAcceptNumBelow10Above20() {
  data.invalidData.phoneNumberBelow10.forEach((text: string) => {
    institutionManageLocationObject.phoneInputText().clear().type(text);
    cy.contains("Phone number must have at least 10 characters.").should(
      "be.visible"
    );
  });
  data.invalidData.phoneNumberAbove20.forEach((text: string) => {
    institutionManageLocationObject.phoneInputText().clear().type(text);
    cy.contains("Phone number must have no more than 20 characters.").should(
      "be.visible"
    );
  });
}

function verifyPhoneNumberFieldAcceptNumBetween10And20() {
  data.validData.phoneNumber.forEach((text: string) => {
    institutionManageLocationObject.phoneInputText().clear().type(text);
    cy.contains("Phone number must have no more than 20 characters.").should(
      "not.exist"
    );
    cy.contains("Phone number must have at least 10 characters.").should(
      "not.exist"
    );
  });
}

describe("[Institution Manage Location] - Fields and Titles", () => {
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
    verifyLocationAndContactDetails();
  });

  it("Verify that is redirected to 'Add New Location' page", () => {
    institutionManageLocationObject.manageLocationButton().click();
    institutionManageLocationObject.addNewLocationButton().click();
    institutionManageLocationObject.addLocationMessage().should("be.visible");
    verifyLocationAndContactDetails();
  });
});

describe("[Institution Manage Location] - 'Edit Location' page inline error and validations", () => {
  before(() => {
    loginAndClickOnEditLocation();
  });

  it("Verify that error messages are displayed when mandatory fields are not filled out", () => {
    institutionManageLocationObject.firstNameInputText().clear();
    cy.contains("First name is required").should("be.visible");
    institutionManageLocationObject.lastNameInputText().clear();
    cy.contains("Last name is required").should("be.visible");
    institutionManageLocationObject.emailInputText().clear();
    cy.contains("Email is required").should("be.visible");
    institutionManageLocationObject.phoneInputText().clear();
    cy.contains("Phone number is required").should("be.visible");
  });

  it("Verify that email field does not accept invalid email formats", () => {
    verifyInvalidEmailFormatsAreNotAllowed();
  });

  it("Verify that email field accepts valid email formats", () => {
    verifyValidEmailFormatsAreAllowed();
  });

  it("Verify that phone number field does not accept numbers below 10 and above 20", () => {
    verifyPhoneNumberFieldNotAcceptNumBelow10Above20();
  });

  it("Verify that phone number field accepts valid number formats", () => {
    verifyPhoneNumberFieldAcceptNumBetween10And20();
  });
});

describe("[Institution Manage Location] - 'Add New Location' inline errors validation", () => {
  before(() => {
    loginAndClickOnAddNewLocation();
  });

  it("All mandatory fields - and inline error validations", () => {
    institutionManageLocationObject.submitButton().click();
    cy.contains("Please fix the following errors before submitting.").should(
      "be.visible"
    );
    cy.contains("Institution code is required").should("be.visible");
    cy.contains("Address 1 is required").should("be.visible");
    cy.contains("Country is required").should("be.visible");
    cy.contains("City is required").should("be.visible");
    cy.contains("First name is required").should("be.visible");
    cy.contains("Last name is required").should("be.visible");
    cy.contains("Email is required").should("be.visible");
    cy.contains("Phone number is required").should("be.visible");
    cy.contains(
      "Please check the form and correct all errors before submitting."
    ).should("be.visible");
  });

  it("Verify that location name should accept aplha-numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.locationName().clear().type(text);
        cy.contains("Location name must").should("not.exist");
        cy.contains("Location name is").should("not.exist");
      }
    );
  });

  it("Verify that location name should not accept more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject.locationName().clear().type(text);
      cy.contains(
        "Location name must have no more than 100 characters."
      ).should("be.visible");
    });
  });

  it("Verify that institution code should accept only alphabets", () => {
    data.invalidData.institutionCodeNonAplhabets.forEach((text: string) => {
      institutionManageLocationObject.institutionCode().clear().type(text);
      cy.contains("Institution code does not match the pattern [A-Z]*").should(
        "be.visible"
      );
    });
    data.validData.institutionCode.forEach((text: string) => {
      institutionManageLocationObject.institutionCode().clear().type(text);
      cy.contains("Institution code does not match the pattern [A-Z]*").should(
        "not.exist"
      );
    });
  });

  it("Verify that institution code should accept only 4 chars", () => {
    data.invalidData.institutionCodeBelow4.forEach((text: string) => {
      institutionManageLocationObject.institutionCode().clear().type(text);
      cy.contains("Institution code must have at least 4 characters.").should(
        "be.visible"
      );
    });
    data.invalidData.institutionCodeAbove4.forEach((text: string) => {
      institutionManageLocationObject.institutionCode().clear().type(text);
      cy.contains(
        "Institution code must have no more than 4 characters."
      ).should("be.visible");
    });
  });

  it("Verify that Address 1 and Address 2 should not have more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject.addressLine1().clear().type(text);
      cy.contains("Address 1 must have no more than 100 characters.").should(
        "be.visible"
      );
      institutionManageLocationObject.addressLine2().clear().type(text);
      cy.contains("Address 2 must have no more than 100 characters.").should(
        "be.visible"
      );
    });
  });

  it("Verify that Address 1 and Address 2 should accept more alpha numeric and special", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.addressLine1().clear().type(text);
        cy.contains("Address 1 must have ").should("not.exist");
        institutionManageLocationObject.addressLine2().clear().type(text);
        cy.contains("Address 2 must have ").should("not.exist");
      }
    );
  });

  it("Verify that city field should accept alpha numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.cityInputText().clear().type(text);
        cy.contains("City must have ").should("not.exist");
      }
    );
  });
  it("Verify that city field should not accept more than chars 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject.cityInputText().clear().type(text);
      cy.contains("City must have no more than 100 characters.").should(
        "be.visible"
      );
    });
  });
});

describe("[Institution Manage Location] - Country drop-down items and provinces", () => {
  beforeEach(() => {
    loginAndClickOnAddNewLocation();
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
    institutionManageLocationObject
      .provinceABFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceBCFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceMBFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceNBFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceNLFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceNSFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceONFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceQCFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceNTFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceYUFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceNUFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .provinceSKFromDropDown()
      .should("be.visible");
    institutionManageLocationObject
      .canadaPostalCode()
      .should("be.visible")
      .should("have.attr", "placeholder", "___ ___");
  });

  it("Verify that selecting Other Country should display field to enter country and postal code format changes", () => {
    institutionManageLocationObject.countryOtherFromDropDownMenu().click();
    institutionManageLocationObject
      .otherCountryInputText()
      .should("be.visible");
    institutionManageLocationObject
      .otherCountryInputText()
      .should("have.attr", "placeholder", "Enter your country");
    institutionManageLocationObject.otherPostalCode().should("be.visible");
  });

  it("Verify that selecting 'Other' Country field should accept alpha numeric chars", () => {
    institutionManageLocationObject.countryOtherFromDropDownMenu().click();
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject
          .otherCountryInputText()
          .clear()
          .type(text);
        cy.get("Other country must").should("not.equal");
      }
    );
  });

  it("Verify that selecting 'Other' Country field should not accept more than 100 chars", () => {
    institutionManageLocationObject.countryOtherFromDropDownMenu().click();
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject
        .otherCountryInputText()
        .clear()
        .type(text);
      cy.get("Other country must").should("not.equal");
    });
  });
});

describe("[Institution Manage Location] - Primary Contact Information Validation", () => {
  beforeEach(() => {
    loginAndClickOnAddNewLocation();
  });
  it("Verify that FirstName should accept alpha numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.firstNameInputText().clear().type(text);
        cy.contains("First name must ").should("not.exist");
      }
    );
  });

  it("Verify that FirstName should not accept more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject.firstNameInputText().clear().type(text);
      cy.contains("First name must ").should("not.exist");
    });
  });

  it("Verify that LastName should accept alpha numeric and special chars", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.lastNameInputText().clear().type(text);
        cy.contains("Last name must ").should("not.exist");
      }
    );
  });

  it("Verify that LastName should not accept more than 100 chars", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject.lastNameInputText().clear().type(text);
      cy.contains("Last name must ").should("not.exist");
    });
  });

  it("Verify that email field does not accept invalid emails", () => {
    verifyInvalidEmailFormatsAreNotAllowed();
  });

  it("Verify that email field accepts valid emails", () => {
    verifyValidEmailFormatsAreAllowed();
  });

  it("Verify that phone number field does not accept numbers below 10 and above 20", () => {
    verifyPhoneNumberFieldNotAcceptNumBelow10Above20();
  });

  it("Verify that phone number field accepts valid numbers", () => {
    verifyPhoneNumberFieldAcceptNumBetween10And20();
  });
});

describe("[Institution Manage Location] - Add New Location and update for the institution", () => {
  const uniqeId1 = institutionHelperActions.getUniqueId();
  const name1 = `test-${uniqeId1}`;
  const institutionCode = "ASKN";
  const canadaPostalCode = "A1A2A3";
  const phoneNumber = "1236549871";

  before(() => {
    loginAndClickOnAddNewLocation();
  });

  it("Create new institution location", () => {
    institutionManageLocationObject
      .locationName()
      .clear()
      .type(`location-${name1}`)
      .should("have.value", `location-${name1}`);
    institutionManageLocationObject
      .institutionCode()
      .clear()
      .type(institutionCode)
      .should("have.value", institutionCode);
    institutionManageLocationObject
      .addressLine1()
      .clear()
      .type(`Addrline1-${name1}`)
      .should("have.value", `Addrline1-${name1}`);
    institutionManageLocationObject
      .addressLine2()
      .clear()
      .type(`Addrline2-${name1}`)
      .should("have.value", `Addrline2-${name1}`);
    institutionManageLocationObject.countryDropDownMenu().click();
    institutionManageLocationObject.countryCanadaFromDropDownMenu().click();
    institutionManageLocationObject.provinceDropDownMenu().click();
    institutionManageLocationObject.provinceABFromDropDown().click();
    institutionManageLocationObject
      .cityInputText()
      .type(`city-${name1}`)
      .should("have.value", `city-${name1}`);
    institutionManageLocationObject
      .canadaPostalCode()
      .type(canadaPostalCode)
      .should("have.value", "A1A 2A3");
    institutionManageLocationObject
      .firstNameInputText()
      .type(`fname-${name1}`)
      .should("have.value", `fname-${name1}`);
    institutionManageLocationObject
      .lastNameInputText()
      .type(`lname-${name1}`)
      .should("have.value", `lname-${name1}`);
    institutionManageLocationObject
      .emailInputText()
      .type(`${name1}@gov.test`)
      .should("have.value", `${name1}@gov.test`);
    institutionManageLocationObject
      .phoneInputText()
      .type(phoneNumber)
      .should("have.value", phoneNumber);
    institutionManageLocationObject.submitButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    cy.contains(`fname-${name1}`).should("be.visible");
    cy.contains(`lname-${name1}`).should("be.visible");
    cy.contains(`${name1}@gov.test`).should("be.visible");
  });

  it("Update institution primary contact details", () => {
    cy.wait(2);
    cy.intercept("GET", "**/location/**").as("location");
    cy.contains(`location-`)
      .parents(".v-row")
      .children()
      .contains("Edit")
      .click();
    cy.wait("@location");
    const uniqeId = institutionHelperActions.getUniqueId();
    const name = `test-${uniqeId}`;
    const phoneNumber = "1236549000";
    institutionManageLocationObject
      .firstNameInputText()
      .clear()
      .type(`fname-${name}`)
      .should("have.value", `fname-${name}`);
    institutionManageLocationObject
      .lastNameInputText()
      .clear()
      .type(`lname-${name}`)
      .should("have.value", `lname-${name}`);
    institutionManageLocationObject
      .emailInputText()
      .clear()
      .type(`${name}@gov.test`)
      .should("have.value", `${name}@gov.test`);
    institutionManageLocationObject
      .phoneInputText()
      .clear()
      .type(phoneNumber)
      .should("have.value", phoneNumber);
    institutionManageLocationObject.submitButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    cy.contains(`fname-${name}`).should("be.visible");
    cy.contains(`lname-${name}`).should("be.visible");
    cy.contains(`${name}@gov.test`).should("be.visible");
    cy.contains("1236549000").should("be.visible");
  });
});
