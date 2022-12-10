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
import { profileData } from "../../../data/dev/institution-data/institutionProfileData";
import InstitutionProfileObject from "../../page-objects/Institution-objects/InstitutionProfileObject";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionManageLocationObject = new ManageLocationObject();
const institutionHelperActions = new InstitutionHelperActions();
const manageInstitutionObject = new ManageInstitutionObject();
const institutionObject = new InstitutionProfileObject();

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

function verifyContactDetailsAreVisibleAndEnabled() {
  institutionManageLocationObject.primaryContactText().should("be.visible");
  institutionManageLocationObject.firstNameText().should("be.visible");
  institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
    institutionManageLocationObject.firstNameInputText(),
    true
  );
  institutionManageLocationObject.lastNameText().should("be.visible");
  institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
    institutionManageLocationObject.lastNameInputText(),
    true
  );
  institutionManageLocationObject.emailText().should("be.visible");
  institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
    institutionManageLocationObject.emailInputText(),
    true
  );
  institutionManageLocationObject.phoneNumberText().should("be.visible");
  institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
    institutionManageLocationObject.phoneInputText(),
    true
  );
}

/**
 * Checks for valid format of emails are allowed.
 * Checks for invalid format emails are not not allowed.
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
 * Validates first name, last name, email and phone number that they are mandatory and are * * not empty.
 */
function verifyPrimaryContactDetailsAreMandatory() {
  institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.firstNameInputText(),
    "First Name"
  );
  institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.lastNameInputText(),
    "Last Name"
  );
  institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.emailInputText(),
    "Email"
  );
  institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
    institutionManageLocationObject.phoneInputText(),
    "Phone Number"
  );
}

function verifyNoInputFieldsAcceptMoreThan100Chars(createView: boolean) {
  const noOfCharsForValidations = 100;
  if (createView) {
    institutionManageLocationObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.locationName(),
      "Location name",
      noOfCharsForValidations
    );
    institutionManageLocationObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.address1(),
      "Address 1",
      noOfCharsForValidations
    );
    institutionManageLocationObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.address2(),
      "Address 2",
      noOfCharsForValidations
    );
    institutionManageLocationObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionManageLocationObject.cityInputText(),
      "City",
      noOfCharsForValidations
    );
  }
  institutionManageLocationObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
    institutionManageLocationObject.firstNameInputText(),
    "First name",
    noOfCharsForValidations
  );
  institutionManageLocationObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
    institutionManageLocationObject.lastNameInputText(),
    "Last name",
    noOfCharsForValidations
  );
}

/**
 * Validates that phone number field does not accept > 20 chars and not accept any chars
 * and only accept between 10 and 20 numbers.
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
    institutionManageLocationObject
      .getInstitutionsList()
      .should("have.length", 1);
  });

  it("Verify that User is able to click on edit for an existing institution", () => {
    institutionManageLocationObject.editLocationButton("Vancouver").click();
    cy.url().should("contain", "/edit-institution-location");
    institutionManageLocationObject.editLocationHeader().should("be.visible");
  });
});

describe("Manage Location", () => {
  // This section contains tests cases for "Edit" existing location view
  before(() => {
    loginAndClickOnEditLocation("Vancouver");
  });

  it("Verify the location details (non-editable) when on the Edit view of the institution location", () => {
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled;
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.locationName()
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.institutionCode()
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.address1()
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.address2()
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.country()
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.city()
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
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
  // This section contains tests cases for "Add" new location view
  before(() => {
    loginAndClickOnManageInstitution();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageLocations);
    institutionManageLocationObject.addLocationButton().click();
  });

  it("Verify that location details are mandatory when adding a new location", () => {
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.locationName(),
      "Location name"
    );
  });

  it("Verify the location details (editable) when on the Add new location view ", () => {
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.locationName(),
      true
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.institutionCode(),
      true
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.address1(),
      true
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.address2(),
      true
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.country(),
      true
    );
    institutionManageLocationObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionManageLocationObject.city(),
      true
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
    verifyNoInputFieldsAcceptMoreThan100Chars(true);
  });

  it("Verify that institution code is mandatory when adding a new location", () => {
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.institutionCode(),
      "Institution code"
    );
  });

  it("Verify that institution code should accept only alphabets when on the Add new location view", () => {
    data.invalidData.institutionCodeNonAlphabets.forEach((text: string) => {
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
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.address1(),
      "Address1"
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
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.city(),
      "City"
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
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.firstNameInputText(),
      "First name"
    );
  });

  it("Verify that “Last name” is a mandatory field when editing a location primary contact details", () => {
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.lastNameInputText(),
      "Last name"
    );
  });

  it("Verify that “Email” is a mandatory field when editing a location primary contact details", () => {
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.emailInputText(),
      "Email"
    );
  });

  it("Verify the “Email” field should accept only valid formatted emails", () => {
    verifyEmailInputFieldValidations();
  });

  it("Verify that “Phone number” is a mandatory field when editing a location primary contact details", () => {
    institutionManageLocationObject.verifyThatFieldShouldNotBeEmpty(
      institutionManageLocationObject.phoneInputText(),
      "Phone Number"
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
  before(() => {
    loginAndClickOnManageInstitution();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageLocations);
    institutionManageLocationObject.addLocationButton().click();
  });

  beforeEach(() => {
    institutionManageLocationObject.countryDropDownMenu().click();
  });

  afterEach(() => {
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
    institutionManageLocationObject.countrySearchInputText("Canada");
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
    institutionManageLocationObject.countrySearchInputText("Other");
    institutionManageLocationObject
      .otherCountryInputText()
      .should("be.visible");
    institutionManageLocationObject
      .otherCountryInputText()
      .should("have.attr", "placeholder", "Enter your country");
    institutionManageLocationObject.otherPostalCode().should("be.visible");
  });

  it("Verify that selecting 'Other' Country field should accept alpha numeric chars", () => {
    institutionManageLocationObject.countrySearchInputText("Other");
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
    institutionManageLocationObject.countrySearchInputText("Other");

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
