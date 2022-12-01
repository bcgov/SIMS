import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import ManageLocationObject, {
  Provinces,
} from "../../page-objects/Institution-objects/ManageLocationObject";

import data from "../data/institution/manage-location.json";
import Authorization, {
  ClientId,
} from "../../custom-command/common/authorization";
import ManageInstitutionObject from "../../page-objects/Institution-objects/ManageInstitutionObject";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionManageLocationObject = new ManageLocationObject();
const institutionHelperActions = new InstitutionHelperActions();
const manageInstitutionObject = new ManageInstitutionObject();
function loginAndClickOnManageInstitution() {
  institutionHelperActions.loginIntoInstitutionSingleLocation();
  dashboardInstitutionObject.manageInstitutionButton().click();
}

const enum SideBarMenuItems {
  ManageProfile = "Manage Profile",
  ManageLocations = "Manage Locations",
  ManageDesignation = "Manage Designations",
  ManageUsers = "Manage Users",
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

function verifyLocationAndContactDetails() {
  institutionManageLocationObject.institutionCode().should("be.visible");
  institutionManageLocationObject.address1().should("be.visible");
  institutionManageLocationObject.address2().should("be.visible");
  institutionManageLocationObject.country().should("be.visible");
  institutionManageLocationObject.city().should("be.visible");
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

function createInstitutionLocation(
  uniqeId: string,
  institutionCode: string,
  phoneNumber: string
) {
  institutionManageLocationObject
    .locationName()
    .clear()
    .type(uniqeId)
    .should("have.value", uniqeId);
  institutionManageLocationObject
    .institutionCode()
    .clear()
    .type(institutionCode)
    .should("have.value", institutionCode);
  institutionManageLocationObject
    .addressLine1()
    .clear()
    .type(`Addrline1-${uniqeId}`)
    .should("have.value", `Addrline1-${uniqeId}`);
  institutionManageLocationObject
    .addressLine2()
    .clear()
    .type(`Addrline2-${uniqeId}`)
    .should("have.value", `Addrline2-${uniqeId}`);
  institutionManageLocationObject.countryDropDownMenu().click();
  institutionManageLocationObject.countryCanadaFromDropDownMenu().click();
  institutionManageLocationObject.provinceDropDownMenu().click();
  institutionManageLocationObject
    .getProvinceFromDropdown(Provinces.Alberta)
    .click();
  institutionManageLocationObject
    .cityInputText()
    .type(`city-${uniqeId}`)
    .should("have.value", `city-${uniqeId}`);
  institutionManageLocationObject
    .canadaPostalCode()
    .type("A1A2A3")
    .should("have.value", "A1A 2A3");
  institutionManageLocationObject
    .firstNameInputText()
    .type(`fname-${uniqeId}`)
    .should("have.value", `fname-${uniqeId}`);
  institutionManageLocationObject
    .lastNameInputText()
    .type(`lname-${uniqeId}`)
    .should("have.value", `lname-${uniqeId}`);
  institutionManageLocationObject
    .emailInputText()
    .type(`${uniqeId}@gov.test`)
    .should("have.value", `${uniqeId}@gov.test`);
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
  /**
  Edit Location
   */
  before(() => {
    loginAndClickOnEditLocation("Vancouver");
  });

  it("Verify the location details (non-editable) when on the Edit view of the institution location", () => {
    institutionManageLocationObject
      .locationName()
      .should("be.visible")
      .should("have.attr", "disabled", "disabled");
    institutionManageLocationObject
      .institutionCode()
      .should("be.visible")
      .should("have.attr", "disabled", "disabled");
    institutionManageLocationObject
      .address1()
      .should("be.visible")
      .should("have.attr", "disabled", "disabled");
    institutionManageLocationObject
      .address2()
      .should("be.visible")
      .should("have.attr", "disabled", "disabled");
    institutionManageLocationObject
      .country()
      .should("be.visible")
      .should("have.attr", "disabled", "disabled");
    institutionManageLocationObject
      .city()
      .should("be.visible")
      .should("have.attr", "disabled", "disabled");
    institutionManageLocationObject
      .canadaPostalCode()
      .should("be.visible")
      .should("have.attr", "disabled", "disabled");
  });

  it("Verify the location details (editable) when on the Edit view of the institution location", () => {
    institutionManageLocationObject.primaryContactText().should("be.visible");
    institutionManageLocationObject.firstNameText().should("be.visible");
    institutionManageLocationObject
      .firstNameInputText()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject.lastNameText().should("be.visible");
    institutionManageLocationObject
      .lastNameInputText()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject.emailText().should("be.visible");
    institutionManageLocationObject
      .emailInputText()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject.phoneNumberText().should("be.visible");
    institutionManageLocationObject
      .phoneInputText()
      .should("be.visible")
      .should("not.be.disabled");
  });

  it("Verify that “First name” is a mandatory field when editing a location primary contact details", () => {
    institutionManageLocationObject.firstNameInputText().clear();
    institutionManageLocationObject.submitButton().click();
    institutionManageLocationObject
      .firstNameIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “First name” should not accept more than 100 chars when editing a location primary contact details", () => {
    institutionManageLocationObject
      .firstNameInputText()
      .clear()
      .type(data.invalidData.stringWithMoreThan100Chars);
    institutionManageLocationObject
      .firstNameIsMoreThan100CharsErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Last name” is a mandatory field when editing a location primary contact details", () => {
    institutionManageLocationObject.lastNameInputText().clear();
    institutionManageLocationObject.submitButton().click();
    institutionManageLocationObject
      .lastNameIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Last name” should not accept more than 100 chars when editing a location primary contact details", () => {
    institutionManageLocationObject
      .lastNameInputText()
      .clear()
      .type(data.invalidData.stringWithMoreThan100Chars);
    institutionManageLocationObject
      .lastNameIsMoreThan100CharsErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Email” is a mandatory field when editing a location primary contact details", () => {
    institutionManageLocationObject.emailInputText().clear();
    institutionManageLocationObject.submitButton().click();
    institutionManageLocationObject
      .emailIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Email” should not accept more than 100 chars when editing a location primary contact details", () => {
    institutionManageLocationObject
      .emailInputText()
      .clear()
      .type(data.invalidData.stringWithMoreThan100Chars);
    institutionManageLocationObject
      .emailIsMoreThan100CharsErrorMessage()
      .should("be.visible");
  });

  it("Verify the “Email” field should accept only valid formatted emails", () => {
    verifyInvalidEmailFormatsAreNotAllowed();
  });

  it("Verify that “Phone number” is a mandatory field when editing a location primary contact details", () => {
    institutionManageLocationObject.phoneInputText().clear();
    institutionManageLocationObject
      .phoneNumberIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Phone number” should not accept more than 20 numbers when editing a location primary contact details", () => {
    verifyPhoneNumberFieldNotAcceptNumBelow10Above20();
  });

  it("Verify that “Phone number” should not accept any alphabets when editing a location primary contact details", () => {
    verifyPhoneNumberFieldAcceptNumBetween10And20();
  });

  it("Verify that clicking on “Manage locations” back button will navigate the user back ", () => {
    institutionManageLocationObject.manageLocationsBackButton().click();
    institutionManageLocationObject.manageLocationHeader().should("be.visible");
  });
});

describe("Manage Location", () => {
  /**
  add location
   */
  before("", () => {
    loginAndClickOnManageInstitution();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageLocations);
    institutionManageLocationObject.addLocationButton().click();
  });

  it("Verify the location details (editable) when on the Add new location view ", () => {
    institutionManageLocationObject
      .locationName()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject
      .institutionCode()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject
      .address1()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject
      .address2()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject
      .country()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject
      .city()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject
      .canadaPostalCode()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject.primaryContactText().should("be.visible");
    institutionManageLocationObject.firstNameText().should("be.visible");
    institutionManageLocationObject
      .firstNameInputText()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject.lastNameText().should("be.visible");
    institutionManageLocationObject
      .lastNameInputText()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject.emailText().should("be.visible");
    institutionManageLocationObject
      .emailInputText()
      .should("be.visible")
      .should("not.be.disabled");
    institutionManageLocationObject.phoneNumberText().should("be.visible");
    institutionManageLocationObject
      .phoneInputText()
      .should("be.visible")
      .should("not.be.disabled");
  });

  it("Verify that location name should accept aplha-numeric and special chars when on the Add new location view", () => {
    data.validData.stringsWithAlphaNumericSpecialChars.forEach(
      (text: string) => {
        institutionManageLocationObject.locationName().clear().type(text);
        cy.contains("Location name must").should("not.exist");
        cy.contains("Location name is").should("not.exist");
      }
    );
  });

  it("Verify that location name should not accept more than 100 chars when on the Add new location view", () => {
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject.locationName().clear().type(text);
      cy.contains(
        "Location name must have no more than 100 characters."
      ).should("be.visible");
    });
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

  it("Verify that Address 1 and Address 2 should not have more than 100 chars when on the Add new location view", () => {
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

    it("Verify that “First name” is a mandatory field when editing a location primary contact details", () => {
      institutionManageLocationObject.firstNameInputText().clear();
      institutionManageLocationObject.submitButton().click();
      institutionManageLocationObject
        .firstNameIsRequiredErrorMessage()
        .should("be.visible");
    });

    it("Verify that “First name” should not accept more than 100 chars when editing a location primary contact details", () => {
      institutionManageLocationObject
        .firstNameInputText()
        .clear()
        .type(data.invalidData.stringWithMoreThan100Chars);
      institutionManageLocationObject
        .firstNameIsMoreThan100CharsErrorMessage()
        .should("be.visible");
    });

    it("Verify that “Last name” is a mandatory field when editing a location primary contact details", () => {
      institutionManageLocationObject.lastNameInputText().clear();
      institutionManageLocationObject.submitButton().click();
      institutionManageLocationObject
        .lastNameIsRequiredErrorMessage()
        .should("be.visible");
    });

    it("Verify that “Last name” should not accept more than 100 chars when editing a location primary contact details", () => {
      institutionManageLocationObject
        .lastNameInputText()
        .clear()
        .type(data.invalidData.stringWithMoreThan100Chars);
      institutionManageLocationObject
        .lastNameIsMoreThan100CharsErrorMessage()
        .should("be.visible");
    });

    it("Verify that “Email” is a mandatory field when editing a location primary contact details", () => {
      institutionManageLocationObject.emailInputText().clear();
      institutionManageLocationObject.submitButton().click();
      institutionManageLocationObject
        .emailIsRequiredErrorMessage()
        .should("be.visible");
    });

    it("Verify that “Email” should not accept more than 100 chars when editing a location primary contact details", () => {
      institutionManageLocationObject
        .emailInputText()
        .clear()
        .type(data.invalidData.stringWithMoreThan100Chars);
      institutionManageLocationObject
        .emailIsMoreThan100CharsErrorMessage()
        .should("be.visible");
    });

    it("Verify the “Email” field should accept only valid formatted emails", () => {
      verifyInvalidEmailFormatsAreNotAllowed();
    });

    it("Verify that “Phone number” is a mandatory field when editing a location primary contact details", () => {
      institutionManageLocationObject.phoneInputText().clear();
      institutionManageLocationObject
        .phoneNumberIsRequiredErrorMessage()
        .should("be.visible");
    });

    it("Verify that “Phone number” should not accept more than 20 numbers when editing a location primary contact details", () => {
      verifyPhoneNumberFieldNotAcceptNumBelow10Above20();
    });

    it("Verify that “Phone number” should not accept any alphabets when editing a location primary contact details", () => {
      verifyPhoneNumberFieldAcceptNumBetween10And20();
    });
  });

  it("Verify that “First name” is a mandatory field when adding a location primary contact details", () => {
    institutionManageLocationObject.firstNameInputText().clear();
    institutionManageLocationObject.submitButton().click();
    institutionManageLocationObject
      .firstNameIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “First name” should not accept more than 100 chars when adding a location primary contact details", () => {
    institutionManageLocationObject
      .firstNameInputText()
      .clear()
      .type(data.invalidData.stringWithMoreThan100Chars);
    institutionManageLocationObject
      .firstNameIsMoreThan100CharsErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Last name” is a mandatory field when adding a location primary contact details", () => {
    institutionManageLocationObject.lastNameInputText().clear();
    institutionManageLocationObject.submitButton().click();
    institutionManageLocationObject
      .lastNameIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Last name” should not accept more than 100 chars when adding a location primary contact details", () => {
    institutionManageLocationObject
      .lastNameInputText()
      .clear()
      .type(data.invalidData.stringWithMoreThan100Chars);
    institutionManageLocationObject
      .lastNameIsMoreThan100CharsErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Email” is a mandatory field when adding a location primary contact details", () => {
    institutionManageLocationObject.emailInputText().clear();
    institutionManageLocationObject.submitButton().click();
    institutionManageLocationObject
      .emailIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Email” should not accept more than 100 chars when adding a location primary contact details", () => {
    institutionManageLocationObject
      .emailInputText()
      .clear()
      .type(data.invalidData.stringWithMoreThan100Chars);
    institutionManageLocationObject
      .emailIsMoreThan100CharsErrorMessage()
      .should("be.visible");
  });

  it("Verify the “Email” field should accept only valid formatted emails when adding a location", () => {
    verifyInvalidEmailFormatsAreNotAllowed();
  });

  it("Verify that “Phone number” is a mandatory field when adding a location primary contact details", () => {
    institutionManageLocationObject.phoneInputText().clear();
    institutionManageLocationObject
      .phoneNumberIsRequiredErrorMessage()
      .should("be.visible");
  });

  it("Verify that “Phone number” should not accept more than 20 numbers when adding a location primary contact details", () => {
    verifyPhoneNumberFieldNotAcceptNumBelow10Above20();
  });

  it("Verify that “Phone number” should not accept any alphabets when adding a location primary contact details", () => {
    verifyPhoneNumberFieldAcceptNumBetween10And20();
  });

  it("Verify that clicking on “Manage locations” back button will navigate the user back ", () => {
    institutionManageLocationObject.manageLocationsBackButton().click();
    institutionManageLocationObject.manageLocationHeader().should("be.visible");
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
    data.invalidData.stringWithMoreThan100Chars.forEach((text: string) => {
      institutionManageLocationObject
        .otherCountryInputText()
        .clear()
        .type(text);
      cy.get("Other country must").should("not.equal");
    });
  });
});

describe("Add New Location and update for the institution", () => {
  let token: string;
  const uniqeId1 = institutionHelperActions.getUniqueId();
  const uniqeId2 = institutionHelperActions.getUniqueId();
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
    createInstitutionLocation(uniqeId1, institutionCode, phoneNumber);
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    cy.contains(`fname-${uniqeId1}`).scrollIntoView().should("be.visible");
    cy.contains(`lname-${uniqeId1}`).scrollIntoView().should("be.visible");
    cy.contains(`${uniqeId1}@gov.test`).scrollIntoView().should("be.visible");
  });

  it("Update institution primary contact details", () => {
    const institutionCode = institutionHelperActions.getRandomInstitutionCode();
    createInstitutionLocation(uniqeId2, institutionCode, phoneNumber);
    dashboardInstitutionObject.allLocationsText().should("be.visible");
    cy.intercept("GET", "**/location/**").as("location");
    cy.contains(uniqeId2).parents(".v-row").children().contains("Edit").click();
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
