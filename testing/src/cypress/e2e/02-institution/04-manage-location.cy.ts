import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import ManageLocationObject, {
  Provinces,
} from "../../page-objects/Institution-objects/ManageLocationObject";

import data from "../data/institution/manage-location.json";
import Authorization, {
  ClientId,
} from "../../custom-command/common/authorization";
import ManageInstitutionObject, {
  SideBarMenuItems,
} from "../../page-objects/Institution-objects/ManageInstitutionObject";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionManageLocationObject = new ManageLocationObject();
const institutionHelperActions = new InstitutionHelperActions();
const manageInstitutionObject = new ManageInstitutionObject();

function loginAndClickOnManageInstitution() {
  institutionHelperActions.loginIntoInstitutionSingleLocation();
  dashboardInstitutionObject.manageInstitutionButton().click();
}

function loginAndClickOnEditLocation(locationName: string) {
  loginAndClickOnManageInstitution();
  cy.intercept("GET", "**/location/**").as("location");
  manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageLocations);
  institutionManageLocationObject.editLocationButton(locationName).click();
  cy.wait("@location");
}

function loginAndClickOnAddNewLocation() {
  loginAndClickOnManageInstitution();
  institutionManageLocationObject.addLocationButton().click();
}

function verifyThatFieldShouldNotBeEmpty(
  element: Cypress.Chainable<JQuery<HTMLElement>>,
  errorMessage: Cypress.Chainable<undefined>
) {
  element.clear();
  institutionManageLocationObject.submitButton().click();
  errorMessage.should("be.visible");
}

function verifyThatElementIsVisibleAndDisabled(
  element: Cypress.Chainable<JQuery<HTMLElement>>
) {
  element.should("be.visible").should("have.attr", "disabled", "disabled");
}

function verifyThatElementIsVisibleAndEnabled(
  element: Cypress.Chainable<JQuery<HTMLElement>>
) {
  element.should("be.visible").should("not.be.disabled");
}

function verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
  element: Cypress.Chainable<JQuery<HTMLElement>>,
  errorMessage: Cypress.Chainable<undefined>,
  noOfCharsToBeValidated: number
) {
  if (noOfCharsToBeValidated == 100) {
    element.clear().type(data.invalidData.stringWithMoreThan100Chars);
    errorMessage.should("be.visible");
  }
}

function verifyContactDetailsAreVisibleAndEnabled() {
  institutionManageLocationObject.primaryContactText().should("be.visible");
  institutionManageLocationObject.firstNameText().should("be.visible");
  verifyThatElementIsVisibleAndEnabled(
    institutionManageLocationObject.firstNameInputText()
  );
  institutionManageLocationObject.lastNameText().should("be.visible");
  verifyThatElementIsVisibleAndEnabled(
    institutionManageLocationObject.lastNameInputText()
  );
  institutionManageLocationObject.emailText().should("be.visible");
  verifyThatElementIsVisibleAndEnabled(
    institutionManageLocationObject.emailInputText()
  );
  institutionManageLocationObject.phoneNumberText().should("be.visible");
  verifyThatElementIsVisibleAndEnabled(
    institutionManageLocationObject.phoneInputText()
  );
}

/**
 * Checks for valid format of emails are allowed
 * Checks for invalid format emails are not not allowed
 */
function verifyEmailInputFieldValidations() {
  data.invalidData.emailAddress.forEach((text: string) => {
    institutionManageLocationObject.emailInputText().clear().type(text);
    cy.contains("Email must be a valid email.").should("be.visible");
  });
  data.validData.emailAddress.forEach((text: string) => {
    institutionManageLocationObject.emailInputText().clear().type(text);
    cy.contains("Email must be a valid email.").should("not.exist");
  });
}

/**
 * Validates first name, last name, email and phone number
 */
function verifyPrimaryContactDetailsAreMandatory() {
  verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.firstNameInputText(),
    institutionManageLocationObject.firstNameIsRequiredErrorMessage()
  );
  verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.lastNameInputText(),
    institutionManageLocationObject.lastNameIsRequiredErrorMessage()
  );
  verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.emailInputText(),
    institutionManageLocationObject.emailIsRequiredErrorMessage()
  );
  verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.phoneInputText(),
    institutionManageLocationObject.phoneNumberIsRequiredErrorMessage()
  );
}

function verifyNoInputFieldsAcceptMoreThan100Chars(createView: boolean) {
  const noOfCharsForValidations = 100;
  if (createView) {
    verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.locationName(),
      institutionManageLocationObject.locationMoreThan100CharsErrorMessage(),
      noOfCharsForValidations
    );
    verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.address1(),
      institutionManageLocationObject.address1MoreThan100CharsErrorMessage(),
      noOfCharsForValidations
    );
    verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.address2(),
      institutionManageLocationObject.address2MoreThan100CharsErrorMessage(),
      noOfCharsForValidations
    );
    verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.cityInputText(),
      institutionManageLocationObject.cityMoreThan100CharsErrorMessage(),
      noOfCharsForValidations
    );
  }

  verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
    institutionManageLocationObject.firstNameInputText(),
    institutionManageLocationObject.firstNameIsMoreThan100CharsErrorMessage(),
    noOfCharsForValidations
  );

  verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
    institutionManageLocationObject.lastNameInputText(),
    institutionManageLocationObject.lastNameIsMoreThan100CharsErrorMessage(),
    noOfCharsForValidations
  );

  verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
    institutionManageLocationObject.emailInputText(),
    institutionManageLocationObject.emailIsMoreThan100CharsErrorMessage(),
    noOfCharsForValidations
  );
}

/**
 * Validates that phone number field does not accept > 20 chars and not accept any chars
 * and only accept between 10 and 20 numbers
 */
function verifyPhoneNumberFieldValidations() {
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

function createInstitutionLocation(
  uniqueId: string,
  institutionCode: string,
  phoneNumber: string
) {
  institutionManageLocationObject
    .locationName()
    .clear()
    .type(uniqueId)
    .should("have.value", uniqueId);
  institutionManageLocationObject
    .institutionCode()
    .clear()
    .type(institutionCode)
    .should("have.value", institutionCode);
  institutionManageLocationObject
    .address1()
    .clear()
    .type(`Addrline1-${uniqueId}`)
    .should("have.value", `Addrline1-${uniqueId}`);
  institutionManageLocationObject
    .address2()
    .clear()
    .type(`Addrline2-${uniqueId}`)
    .should("have.value", `Addrline2-${uniqueId}`);
  institutionManageLocationObject.countryDropDownMenu().click();
  institutionManageLocationObject.countryCanadaFromDropDownMenu().click();
  institutionManageLocationObject.provinceDropDownMenu().click();
  institutionManageLocationObject
    .getProvinceFromDropdown(Provinces.Alberta)
    .click();
  institutionManageLocationObject
    .cityInputText()
    .type(`city-${uniqueId}`)
    .should("have.value", `city-${uniqueId}`);
  institutionManageLocationObject
    .canadaPostalCode()
    .type("A1A2A3")
    .should("have.value", "A1A 2A3");
  institutionManageLocationObject
    .firstNameInputText()
    .type(`fname-${uniqueId}`)
    .should("have.value", `fname-${uniqueId}`);
  institutionManageLocationObject
    .lastNameInputText()
    .type(`lname-${uniqueId}`)
    .should("have.value", `lname-${uniqueId}`);
  institutionManageLocationObject
    .emailInputText()
    .type(`${uniqueId}@gov.test`)
    .should("have.value", `${uniqueId}@gov.test`);
  institutionManageLocationObject
    .phoneInputText()
    .type(phoneNumber)
    .should("have.value", phoneNumber);
  institutionManageLocationObject.submitButton().click();
}

describe("Manage Location", () => {
  before(() => {
    loginAndClickOnManageInstitution();
  });
  beforeEach(() => {
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageLocations);
  });

  it("Verify that user is redirected to institution manage location page", () => {
    institutionManageLocationObject.manageLocationHeader().should("be.visible");
  });

  it("Verify that all the institution locations are displayed", () => {
    institutionManageLocationObject.getInstitutionsList().should("eq", 2);
  });

  it("Verify that User is able to click on edit for an existing institution", () => {
    institutionManageLocationObject.editLocationButton("Vancouver").click();
    cy.url().should("contain", "/edit-institution-location");
    institutionManageLocationObject.editLocationHeader().should("be.visible");
  });
});

describe("Manage Location", () => {
  // Edit location test cases
  before(() => {
    loginAndClickOnEditLocation("Vancouver");
  });

  it("Verify the location details (non-editable) when on the Edit view of the institution location", () => {
    verifyThatElementIsVisibleAndDisabled(
      institutionManageLocationObject.locationName()
    );
    verifyThatElementIsVisibleAndDisabled(
      institutionManageLocationObject.institutionCode()
    );
    verifyThatElementIsVisibleAndDisabled(
      institutionManageLocationObject.address1()
    );
    verifyThatElementIsVisibleAndDisabled(
      institutionManageLocationObject.address2()
    );
    verifyThatElementIsVisibleAndDisabled(
      institutionManageLocationObject.country()
    );
    verifyThatElementIsVisibleAndDisabled(
      institutionManageLocationObject.city()
    );
    verifyThatElementIsVisibleAndDisabled(
      institutionManageLocationObject.canadaPostalCode()
    );
  });

  it("Verify the location details (editable) when on the Edit view of the institution location", () => {
    verifyContactDetailsAreVisibleAndEnabled();
  });

  it("Verify that primary contact details are mandatory when editing a institution location", () => {
    verifyPrimaryContactDetailsAreMandatory();
  });

  it("Verify that primary contact details should not accept more than 100 chars when editing a institution location", () => {
    verifyNoInputFieldsAcceptMoreThan100Chars(false);
  });

  it("Verify the “Email” field should accept only valid formatted emails", () => {
    verifyEmailInputFieldValidations();
  });

  it("Verify that “Phone number” should have proper validations when editing a location primary contact details", () => {
    verifyPhoneNumberFieldValidations();
  });

  it("Verify that clicking on “Manage locations” back button will navigate the user back ", () => {
    institutionManageLocationObject.manageLocationsBackButton().click();
    institutionManageLocationObject.manageLocationHeader().should("be.visible");
  });
});

describe("Manage Location", () => {
  // Add location test cases
  before(() => {
    loginAndClickOnManageInstitution();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageLocations);
    institutionManageLocationObject.addLocationButton().click();
  });

  it("Verify that location details are mandatory when adding a new location", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.locationName(),
      institutionManageLocationObject.locationNameErrorMessage()
    );
  });

  it("Verify the location details (editable) when on the Add new location view ", () => {
    verifyThatElementIsVisibleAndEnabled(
      institutionManageLocationObject.locationName()
    );
    verifyThatElementIsVisibleAndEnabled(
      institutionManageLocationObject.institutionCode()
    );
    verifyThatElementIsVisibleAndEnabled(
      institutionManageLocationObject.address1()
    );
    verifyThatElementIsVisibleAndEnabled(
      institutionManageLocationObject.address2()
    );
    verifyThatElementIsVisibleAndEnabled(
      institutionManageLocationObject.country()
    );
    verifyThatElementIsVisibleAndEnabled(
      institutionManageLocationObject.city()
    );
    verifyThatElementIsVisibleAndEnabled(
      institutionManageLocationObject.canadaPostalCode()
    );
    verifyContactDetailsAreVisibleAndEnabled();
  });

  it("Verify that location name should accept alpha-numeric and special chars when on the Add new location view", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.locationName().clear().type(text);
        cy.contains("Location name must").should("not.exist");
        cy.contains("Location name is").should("not.exist");
      }
    );
  });

  it("Verify that location name should not accept more than 100 chars when on the Add new location view", () => {
    /**
    Location Name
    Address1 and Address2
    City
     */
    verifyNoInputFieldsAcceptMoreThan100Chars(true);
  });

  it("Verify that institution code is mandatory when adding a new location", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.institutionCode(),
      institutionManageLocationObject.institutionCodeErrorMessage()
    );
  });

  it("Verify that institution code should accept only alphabets when on the Add new location view", () => {
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

  it("Verify that institution code should accept only 4 chars when on the Add new location view", () => {
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

  it("Verify that address1  is mandatory when adding a new location", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.address1(),
      institutionManageLocationObject.address1ErrorMessage()
    );
  });

  it("Verify that Address 1 and Address 2 should accept more alpha numeric and special", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.address1().clear().type(text);
        cy.contains("Address 1 must have ").should("not.exist");
        institutionManageLocationObject.address2().clear().type(text);
        cy.contains("Address 2 must have ").should("not.exist");
      }
    );
  });

  it("Verify that city is mandatory when adding a new location", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.city(),
      institutionManageLocationObject.cityErrorMessage()
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

  it("Verify that “First name” is a mandatory field when editing a location primary contact details", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.firstNameInputText(),
      institutionManageLocationObject.firstNameIsRequiredErrorMessage()
    );
  });

  it("Verify that “Last name” is a mandatory field when editing a location primary contact details", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.lastNameInputText(),
      institutionManageLocationObject.lastNameIsRequiredErrorMessage()
    );
  });

  it("Verify that “Email” is a mandatory field when editing a location primary contact details", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.emailInputText(),
      institutionManageLocationObject.emailIsRequiredErrorMessage()
    );
  });

  it("Verify the “Email” field should accept only valid formatted emails", () => {
    verifyEmailInputfieldsValidations();
  });

  it("Verify that “Phone number” is a mandatory field when editing a location primary contact details", () => {
    verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.phoneInputText(),
      institutionManageLocationObject.phoneNumberIsRequiredErrorMessage()
    );
  });

  it("Verify that “Phone number” should not accept more than 20 numbers when editing a location primary contact details", () => {
    verifyPhoneNumberFieldValidations();
  });

  it("Verify that “Phone number” should not accept any alphabets when editing a location primary contact details", () => {
    verifyPhoneNumberFieldValidations();
  });
});

describe("Manage Location", () => {
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
      .getProvinceFromDropdown(Provinces.Alberta)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.BritishColumbia)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.Manitoba)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.NewBrunswick)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.NewFoundlandAndLabrador)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.NorthernTerritories)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.NovaScotia)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.Quebec)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.NorthernTerritories)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.Yukon)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.Nunavut)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .getProvinceFromDropdown(Provinces.Saskatchewan)
      .scrollIntoView()
      .should("be.visible");
    institutionManageLocationObject
      .canadaPostalCode()
      .scrollIntoView()
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
    institutionManageLocationObject
      .otherCountryInputText()
      .clear()
      .type(data.invalidData.stringWithMoreThan100Chars);
    cy.get("Other country must").should("not.exist");
  });
});

describe("Add New Location and update for the institution", () => {
  let token: string;
  const uniqueId1 = institutionHelperActions.getUniqueId();
  const uniqueId2 = institutionHelperActions.getUniqueId();
  const phoneNumber = "1236549871";
  const USERNAME = institutionHelperActions.getUserNameForAPITest();
  const PASSWORD = institutionHelperActions.getUserPasswordForAPITest();
  const TOKEN_URL = institutionHelperActions.getAPIURLForKeyCloakToken();

  before(async () => {
    const authorizer = new Authorization();
    token = await authorizer.getAuthToken(
      USERNAME,
      PASSWORD,
      ClientId.Institution,
      TOKEN_URL
    );
  });

  beforeEach(() => {
    loginAndClickOnAddNewLocation();
  });

  it("Create new institution location", async () => {
    const institutionCode =
      await institutionHelperActions.getUniqueInstitutionCode(token);
    createInstitutionLocation(uniqueId1, institutionCode, phoneNumber);
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    cy.contains(`fname-${uniqueId1}`).scrollIntoView().should("be.visible");
    cy.contains(`lname-${uniqueId1}`).scrollIntoView().should("be.visible");
    cy.contains(`${uniqueId1}@gov.test`).scrollIntoView().should("be.visible");
  });

  it("Update institution primary contact details", () => {
    const institutionCode = institutionHelperActions.getRandomInstitutionCode();
    createInstitutionLocation(uniqueId2, institutionCode, phoneNumber);
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    cy.intercept("GET", "**/location/**").as("location");
    cy.contains(uniqueId2)
      .parents(".v-row")
      .children()
      .contains("Edit")
      .click();
    cy.wait("@location");
    const updateuniqeId = institutionHelperActions.getUniqueId();
    const name = `test-${updateuniqeId}`;
    const updatePhoneNumber = "1236549000";
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
      .type(updatePhoneNumber)
      .should("have.value", updatePhoneNumber);
    institutionManageLocationObject.submitButton().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    cy.contains(`fname-${name}`).scrollIntoView().should("be.visible");
    cy.contains(`lname-${name}`).scrollIntoView().should("be.visible");
    cy.contains(`${name}@gov.test`).scrollIntoView().should("be.visible");
    cy.contains("1236549000").scrollIntoView().should("be.visible");
  });
});
