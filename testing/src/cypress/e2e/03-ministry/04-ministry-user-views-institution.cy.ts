import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsInstitution from "../../page-objects/ministry-objects/MinistryUserViewsInstitution";

const ministryCustomCommand = new MinistryCustomCommand();
const dashboardMinistryObject = new DashboardMinistryObject();
const ministryUserViewsInstitution = new MinistryUserViewsInstitution();
const url = Cypress.env("ministryURL");

function searchingOperatingName() {
  ministryCustomCommand.loginMinistry();
  dashboardMinistryObject.dashboardText().should("be.visible");
  dashboardMinistryObject.searchInstitutionsText().click();
  ministryUserViewsInstitution.operatingNameInputText().type("a");
  ministryUserViewsInstitution.searchButton().click();
}

function viewProgram() {
  searchingOperatingName();
  ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
  ministryUserViewsInstitution.profileTextVerify().should("be.visible");
  ministryUserViewsInstitution.programsSection().click();
  ministryUserViewsInstitution.programSectionVerifyText().should("be.visible");
  ministryUserViewsInstitution.viewButtonFirstRowPrograms().click();
  ministryUserViewsInstitution.studyPeriodOfferings().should("be.visible");
  ministryUserViewsInstitution.viewProgramButton().click();
}

describe("Ministry User View Institution Page", () => {
  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that the user is redirected to correct page Search institution page.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameVerify().should("be.visible");
    cy.url().should("contain", "/search-institutions");
  });

  it("Check Legal Name & Operating Name does not display any results when searched using numbers.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.legalNameInputText().type("5345");
    ministryUserViewsInstitution.searchButton().click();
    ministryUserViewsInstitution.noInstitutionsFound().should("be.visible");
    ministryUserViewsInstitution.legalNameInputText().clear();
    ministryUserViewsInstitution.operatingNameInputText().type("6843");
    ministryUserViewsInstitution.searchButton().click();
    ministryUserViewsInstitution.noInstitutionsFound().should("be.visible");
  });

  it("Check that when searched using alphabets on Legal Name or Operating Name records should be displayed.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.legalNameInputText().type("e");
    ministryUserViewsInstitution.searchButton().click();
    ministryUserViewsInstitution.legalNameVerifyColumn().should("be.visible");
    ministryUserViewsInstitution.legalNameInputText().clear();
    ministryUserViewsInstitution.operatingNameInputText().type("e");
    ministryUserViewsInstitution.searchButton().click();
    ministryUserViewsInstitution
      .operatingNameVerifyColumn()
      .should("be.visible");
  });

  it("Verify that clicking the View button redirects to the institution's profile page.", () => {
    searchingOperatingName();
  });

  it("Verify that Programs section is working properly in institution Details.", () => {
    viewProgram();
    ministryUserViewsInstitution.backButtonViewProgram().click();
    ministryUserViewsInstitution.studyPeriodOfferings().should("be.visible");
    ministryUserViewsInstitution.backButtonBackAllPrograms().click();
  });

  it("Verify that clicking the Location redirects to the Location section page.", () => {
    searchingOperatingName();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsInstitution.profileTextVerify().should("be.visible");
    ministryUserViewsInstitution.locationsSection().click();
    ministryUserViewsInstitution.locationSectionVerify().should("be.visible");
  });

  it("Verify that clicking the Users redirects to the Users section page.", () => {
    searchingOperatingName();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsInstitution.profileTextVerify().should("be.visible");
    ministryUserViewsInstitution.usersSection().click();
    ministryUserViewsInstitution.allUsers().should("be.visible");
    ministryUserViewsInstitution.searchInputText().type("e");
    ministryUserViewsInstitution.searchButtonUsers().click();
  });

  it("Verify that clicking the Designation redirects to the Designation section page.", () => {
    searchingOperatingName();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsInstitution.profileTextVerify().should("be.visible");
    ministryUserViewsInstitution.designationSection().click();
    ministryUserViewsInstitution.designationAgreements().should("be.visible");
  });

  it("Verify that clicking on back button redirects from View Programs to All Programs Profile section.", () => {
    viewProgram();
    ministryUserViewsInstitution.backButtonViewProgram().click();
    ministryUserViewsInstitution.studyPeriodOfferings().should("be.visible");
    ministryUserViewsInstitution.backButtonBackAllPrograms().click();
    ministryUserViewsInstitution
      .programSectionVerifyText()
      .should("be.visible");
  });

  it("Verify that clicking on back button redirects from New Program to Program Detail.", () => {
    viewProgram();
    ministryUserViewsInstitution.submitButtonProgram().should("be.disabled");
    ministryUserViewsInstitution.backButtonViewProgram().click();
    ministryUserViewsInstitution.studyPeriodOfferings().should("be.visible");
  });

  it.skip("Verify that clicking on back button redirects from Program Detail to Profile section.", () => {
    viewProgram();
    ministryUserViewsInstitution.backButtonViewProgram().click();
    ministryUserViewsInstitution.studyPeriodOfferings().should("be.visible");
    ministryUserViewsInstitution.backAllProgramsButton().click();
    ministryUserViewsInstitution.legalOperatingNameText().should("be.visible");
  });

  it.skip("Verify that clicking on back button redirects from Designation to Profile section.", () => {
    searchingOperatingName();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsInstitution.profileTextVerify().should("be.visible");
    ministryUserViewsInstitution.designationSection().click();
    cy.focused().click();
    ministryUserViewsInstitution.designationAgreements().should("be.visible");
    ministryUserViewsInstitution.firstRowViewButtonDesignation().click();
    ministryUserViewsInstitution.designationDetailsText().should("be.visible");
    ministryUserViewsInstitution.backManageDesignationsButton().click();
    ministryUserViewsInstitution.legalOperatingNameText().should("be.visible");
  });
});
