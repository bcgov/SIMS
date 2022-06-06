import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsInstitution from "../../page-objects/ministry-objects/MinistryUserViewsInstitution";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";
import InstitutionNoteRestrictionsObject from "../../page-objects/ministry-objects/InstitutionNoteRestrictionsObject";

const ministryCustomCommand = new MinistryCustomCommand();
const dashboardMinistryObject = new DashboardMinistryObject();
const ministryUserViewsStudent = new MinistryUserViewsStudent();
const ministryUserViewsInstitution = new MinistryUserViewsInstitution();
const institutionNoteRestrictionsObject =
  new InstitutionNoteRestrictionsObject();
const url = Cypress.env("ministryURL");

function intercept() {
  cy.intercept("GET", "**/options-list").as("options-list");
  cy.intercept("GET", "**/Designation").as("Designation");
  cy.intercept("GET", "**/institution/**").as("institution");
  cy.intercept("GET", "**/institutionRestriction/**").as(
    "institutionRestriction"
  );
}

function restrictionSection() {
  ministryCustomCommand.loginMinistry();
  dashboardMinistryObject.dashboardText().should("be.visible");
  dashboardMinistryObject.searchInstitutionsText().click();
  ministryUserViewsInstitution.operatingNameInputText().type("e");
  ministryUserViewsStudent.searchButton().eq(1).click();
  ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
  ministryUserViewsStudent.restrictionsSectionButton().click();
  ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
  ministryUserViewsStudent.restrictionsSectionButton().click();
  ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
}

function addNewRestrictions() {
  restrictionSection();
  institutionNoteRestrictionsObject
    .addRestrictionsButton()
    .should("be.visible")
    .click();
  institutionNoteRestrictionsObject
    .addNewRestrictionsText()
    .should("be.visible");
}

function institutionRestrictions() {
  cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
    intercept();
    restrictionSection();
    cy.focused();
    institutionNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    cy.wait("@options-list");
    institutionNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
    institutionNoteRestrictionsObject
      .restrictionsValue()
      .eq(1)
      .type(testData.category)
      .type("{enter}");
    cy.wait("@Designation");
    institutionNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
    cy.focused();
    institutionNoteRestrictionsObject
      .restrictionsValue()
      .eq(3)
      .type(testData.reason)
      .type("{enter}");
    cy.focused();
    institutionNoteRestrictionsObject.notesInputText().type(testData.notes);
    institutionNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
    institutionNoteRestrictionsObject
      .restrictionsAddedText()
      .should("be.visible");
    institutionNoteRestrictionsObject.categoryButton().click();
    institutionNoteRestrictionsObject.categoryButton().click();
    cy.wait("@institution");
    institutionNoteRestrictionsObject.firstRowButtonRestrictions().click();
    cy.wait("@institutionRestriction");
  });
}

function createNewNote() {
  ministryCustomCommand.loginMinistry();
  dashboardMinistryObject.dashboardText().should("be.visible");
  dashboardMinistryObject.searchInstitutionsText().click();
  ministryUserViewsInstitution.operatingNameInputText().type("e");
  ministryUserViewsStudent.searchButton().eq(1).click();
  ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
  ministryUserViewsStudent.notesSectionButton().click();
  institutionNoteRestrictionsObject.createNewNoteButton().should("be.visible");
}

function noteAdded(noteType: any, noteBody: any) {
  createNewNote();
  institutionNoteRestrictionsObject
    .createNewNoteButton()
    .should("be.visible")
    .click();
  institutionNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
  institutionNoteRestrictionsObject
    .restrictionsValue()
    .eq(1)
    .type(noteType)
    .type("{enter}");
  institutionNoteRestrictionsObject.noteBodyInputText().type(noteBody);
  institutionNoteRestrictionsObject.addNoteButton().click();
  institutionNoteRestrictionsObject
    .noteAddedSuccessfully()
    .should("be.visible");
}

describe("Ministry User Enters Institution Note & Restrictions", () => {
  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that the user is redirected to correct page of Search Institutions Section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("e");
    ministryUserViewsStudent.searchButton().eq(1).click();
    cy.url().should("contain", "/search-institutions");
  });

  it("Verify that the user is redirected to correct page of Institution Restriction section.", () => {
    restrictionSection();
  });

  it("Verify that the user is redirected to correct page of Note in Institution Note section .", () => {
    restrictionSection();
    ministryUserViewsStudent.notesSectionButton().click();
    ministryUserViewsStudent.notesSectionVerify().should("be.visible");
  });

  it("Check that the ADD RESTRICTIONS button is visible in the Restrictions page in Institution Restrictions section.", () => {
    restrictionSection();
    institutionNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible");
  });

  it("Check that the ADD RESTRICTIONS button is visible in the Restrictions page in Institution Restrictions section..", () => {
    addNewRestrictions();
  });

  it("Check that error messages are displayed correctly in Add new restrictions dialog box in Institution Restrictions section.", () => {
    addNewRestrictions();
    institutionNoteRestrictionsObject.addRestrictionsDialogBox().click();
    institutionNoteRestrictionsObject
      .categoryErrorMessage()
      .should("be.visible");
    institutionNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
  });

  it("Check that cancel button closes the dialog box in Institution Restriction section.", () => {
    addNewRestrictions();
    institutionNoteRestrictionsObject.cancelButton().click();
    institutionNoteRestrictionsObject.allRestrictions().should("be.visible");
  });

  it("Check that all mandatory fields have been filled out in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
      intercept();
      addNewRestrictions();
      cy.wait("@options-list");
      institutionNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      institutionNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(testData.category)
        .type("{enter}");
      cy.wait("@Designation");
      institutionNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      institutionNoteRestrictionsObject
        .reasonErrorMessage()
        .should("be.visible");
      institutionNoteRestrictionsObject.clearButton().click();
      institutionNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
      institutionNoteRestrictionsObject
        .restrictionsValue()
        .eq(3)
        .type(testData.reason)
        .type("{enter}");
      institutionNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      institutionNoteRestrictionsObject
        .categoryErrorMessage()
        .should("be.visible");
    });
  });

  it("Verify that the Reason dropdown should be empty without filling in the Category in Institution Restriction section.", () => {
    intercept();
    restrictionSection();
    institutionNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    cy.wait("@options-list");
    institutionNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
    institutionNoteRestrictionsObject
      .emptyDropdownMessage()
      .should("be.visible");
  });

  it.skip("Verify that user able to add restrictions in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
      institutionRestrictions();
      institutionNoteRestrictionsObject
        .categoryAssertion(testData.category)
        .should("be.visible");
      institutionNoteRestrictionsObject
        .reasonAssertion(testData.reason)
        .should("be.visible");
    });
  });

  it.skip("Verify that user can't resolve restrictions without a resolution note in Institution Restriction section.", () => {
    institutionRestrictions();
    institutionNoteRestrictionsObject.resolveRestrictionsButton().click();
    institutionNoteRestrictionsObject
      .resolutionNoteRequired()
      .should("be.visible");
  });

  it.skip("Verify that ministry users can resolve restrictions by entering resolution note in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
      institutionRestrictions();
      institutionNoteRestrictionsObject
        .categoryAssertion(testData.category)
        .should("be.visible");
      institutionNoteRestrictionsObject
        .reasonAssertion(testData.reason)
        .should("be.visible");
      institutionNoteRestrictionsObject
        .resolutionNotesInputText()
        .type(testData.resolutionNotes);
      institutionNoteRestrictionsObject.resolveRestrictionsButton().click();
      institutionNoteRestrictionsObject
        .restrictionsResolvedAssertion()
        .should("be.visible");
    });
  });

  it("Verify that the Create New Note button displays properly in Note in Institution Note section.", () => {
    createNewNote();
  });

  it("Verify that error messages are displayed properly in the Note in Institution Note section.", () => {
    createNewNote();
    institutionNoteRestrictionsObject
      .createNewNoteButton()
      .should("be.visible")
      .click();
    institutionNoteRestrictionsObject.addNoteButton().click();
    institutionNoteRestrictionsObject
      .noteTypeErrorMessage()
      .should("be.visible");
    institutionNoteRestrictionsObject
      .noteBodyErrorMessage()
      .should("be.visible");
  });

  it("Verify that in the General section Created a note with General type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeGeneral, testData.noteBodyGeneral);
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeGeneral
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyGeneral
      );
      institutionNoteRestrictionsObject.generalTabButton().click();
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeGeneral
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyGeneral
      );
    });
  });

  it("Verify that in the Restrictions section Created a note with Restrictions type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeRestriction, testData.noteBodyRestriction);
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeRestriction
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyRestriction
      );
      institutionNoteRestrictionsObject.generalTabButton().click();
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeRestriction
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyRestriction
      );
    });
  });

  it.skip("Verify that in the System Actions section Created a note with System type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeSystem, testData.noteBodySystem);
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeSystem
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodySystem
      );
      institutionNoteRestrictionsObject.generalTabButton().click();
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeSystem
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodySystem
      );
    });
  });

  it("Verify that in the Program section Created a note with Program type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeProgram, testData.noteBodyProgram);
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeProgram
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyProgram
      );
      institutionNoteRestrictionsObject.generalTabButton().click();
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeProgram
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyProgram
      );
    });
  });

  it("Verify that in the Designation section Created a note with Designation type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeDesignation, testData.noteBodyDesignation);
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeDesignation
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyDesignation
      );
      institutionNoteRestrictionsObject.generalTabButton().click();
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeDesignation
      );
      institutionNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyDesignation
      );
    });
  });
});
