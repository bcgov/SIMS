import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionProfileObject from "../../page-objects/Institution-objects/InstitutionProfileObject";
import { profileData } from "../../../data/dev/institution-data/institutionProfileData";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import ManageInstitutionObject, {
  SideBarMenuItems,
} from "../../page-objects/Institution-objects/ManageInstitutionObject";
import { Provinces } from "../../page-objects/Institution-objects/ManageLocationObject";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const institutionObject = new InstitutionProfileObject();
const institutionHelperActions = new InstitutionHelperActions();
const manageInstitutionObject = new ManageInstitutionObject();

describe("Institution Manage Profile", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageProfile);
  });

  it("Verify that clicking on Manage Profile should navigate “My Profile Page”", () => {
    institutionObject.manageProfileButton().click();
    dashboardInstitutionObject
      .manageInstitutionProfileHeader()
      .should("be.visible");
  });

  it("Verify “Manage Institution Profile” should contain institution profile details", () => {
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.legalOperatingNameInputText()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.operatingName()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.institutionType()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.establishedDate()
    );
    institutionObject
      .institutionRegulatingBody()
      .should("have.attr", "disabled");
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.primaryEmailInputText()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.primaryPhoneNumberInputText()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.institutionWebsiteInputText()
    );
  });

  it.only("Verify “Manage Institution Profile” should contain institution contact details", () => {
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.firstNameInstitutionInputText()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.lastNameInstitutionInputText()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.emailInstitutionInputText()
    );
    institutionObject.verifyThatElementIsVisibleAndIsEnabled(
      institutionObject.phoneNumberInstitutionInputText()
    );
  });

  it("Verify “Manage Institution Profile” should contain institution mailing address details", () => {
    institutionObject
      .addressInstitutionInputText()
      .should("be.visible")
      .should("not.have.class", "is-invalid");
    institutionObject.countryInput().children().should("have.attr", "value");
    institutionObject
      .cityInputText()
      .should("be.visible")
      .should("not.have.class", "is-invalid");
    institutionObject.postalInputText().should("have.attr", "value");
  });

  it("Make sure enable fields are editable and disable fields are not.", () => {
    institutionObject
      .addressInstitutionInputText()
      .clear()
      .type(profileData.addressInput);
    institutionObject.cityInputText().clear().type(profileData.cityInput);
    institutionObject.countryInputText().click();
    institutionObject.countrySearchInputText(profileData.countryInput);

    institutionObject.provinceInputText().click({ force: true });
    institutionObject
      .provinceSearchInputText(profileData.provinceState)
      .type("{enter}");
    institutionObject.postalInputText().clear().type(profileData.postalInput);
  });

  it("Verify that address line 1 should be a mandatory field", () => {
    institutionObject.verifyThatFieldShouldNotBeEmpty(
      institutionObject.addressInstitutionInputText(),
      "Address line 1"
    );
  });

  it("Verify that address line 1 should not be more than 100 chars", () => {
    institutionObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionObject.cityInputText(),
      "City"
    );
  });

  it("Verify that city should be a mandatory field", () => {
    institutionObject.verifyThatFieldShouldNotBeEmpty(
      institutionObject.cityInputText(),
      "City"
    );
  });

  it("Verify that city should not be more than 100 chars", () => {
    institutionObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionObject.addressInstitutionInputText(),
      "City"
    );
  });

  it("Verify that country field is a drop down and contains two values", () => {
    const countryOptions = ["Canada", "other"];
    institutionObject.countryInputText().click();
    countryOptions.forEach((country) => {
      institutionObject.verifyTheDropDownOptionsAreVisible(
        institutionObject.countryDropdownMenu(),
        country
      );
    });
  });

  it("Verify that selecting Canada from country dropdown makes the pre-populate the provinces available", () => {
    institutionObject.countryInputText().click({ force: true });
    institutionObject.countrySearchInputText(profileData.countryInput);
    institutionObject.provinceInputText().click();
    const provinceIds = Object.values(Provinces);
    for (let i = 0; i < provinceIds.length; i++) {
      institutionObject.provinceSearchInputText(Object.keys(Provinces)[i]);
      institutionObject.verifyTheDropDownOptionsAreVisible(
        institutionObject.provinceDropdownMenu(),
        provinceIds[i]
      );
    }
  });

  it("Verify that selecting Other from country dropdown enables the user to input a different Country", () => {
    institutionObject.countryInputText().click({ force: true });
    institutionObject.countrySearchInputText("Other");
    institutionObject.otherCountryInputText().should("be.visible");
    institutionObject.verifyThatFieldShouldNotBeEmpty(
      institutionObject.otherCountryInputText(),
      "Other Country"
    );
    institutionObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      institutionObject.otherCountryInputText(),
      "Other Country"
    );
  });
});
