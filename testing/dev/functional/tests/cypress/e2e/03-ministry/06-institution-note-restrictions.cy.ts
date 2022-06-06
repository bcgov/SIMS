import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsInstitution from "../../page-objects/ministry-objects/MinistryUserViewsInstitution";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";
import StudentNoteRestrictionsObject from "../../page-objects/ministry-objects/StudentNoteRestrictionsObject";

const ministryCustomCommand = new MinistryCustomCommand();
const dashboardMinistryObject = new DashboardMinistryObject();
const ministryUserViewsStudent = new MinistryUserViewsStudent();
const ministryUserViewsInstitution = new MinistryUserViewsInstitution();
const studentNoteRestrictionsObject = new StudentNoteRestrictionsObject();
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
  studentNoteRestrictionsObject
    .addRestrictionsButton()
    .should("be.visible")
    .click();
  studentNoteRestrictionsObject.addNewRestrictionsText().should("be.visible");
}

function institutionRestrictions() {
  cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
    intercept();
    restrictionSection();
    cy.focused();
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    cy.wait("@options-list");
    studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
    studentNoteRestrictionsObject
      .restrictionsValue()
      .eq(1)
      .type(testData.category)
      .type("{enter}");
    cy.wait("@Designation");
    studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
    cy.focused();
    studentNoteRestrictionsObject
      .restrictionsValue()
      .eq(3)
      .type(testData.reason)
      .type("{enter}");
    cy.focused();
    studentNoteRestrictionsObject.notesInputText().type(testData.notes);
    studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
    studentNoteRestrictionsObject.restrictionsAddedText().should("be.visible");
    studentNoteRestrictionsObject.categoryButton().click();
    studentNoteRestrictionsObject.categoryButton().click();
    cy.wait("@institution");
    studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
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
  studentNoteRestrictionsObject.createNewNoteButton().should("be.visible");
}

function noteAdded(noteType: any, noteBody: any) {
  createNewNote();
  studentNoteRestrictionsObject
    .createNewNoteButton()
    .should("be.visible")
    .click();
  studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
  studentNoteRestrictionsObject
    .restrictionsValue()
    .eq(1)
    .type(noteType)
    .type("{enter}");
  studentNoteRestrictionsObject.noteBodyInputText().type(noteBody);
  studentNoteRestrictionsObject.addNoteButton().click();
  studentNoteRestrictionsObject.noteAddedSuccessfully().should("be.visible");
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
    studentNoteRestrictionsObject.addRestrictionsButton().should("be.visible");
  });

  it("Check that the ADD RESTRICTIONS button is visible in the Restrictions page in Institution Restrictions section..", () => {
    addNewRestrictions();
  });

  it("Check that error messages are displayed correctly in Add new restrictions dialog box in Institution Restrictions section.", () => {
    addNewRestrictions();
    studentNoteRestrictionsObject.addRestrictionsDialogBox().click();
    studentNoteRestrictionsObject.categoryErrorMessage().should("be.visible");
    studentNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
  });

  it("Check that cancel button closes the dialog box in Institution Restriction section.", () => {
    addNewRestrictions();
    studentNoteRestrictionsObject.cancelButton().click();
    studentNoteRestrictionsObject.allRestrictions().should("be.visible");
  });

  it("Check that all mandatory fields have been filled out in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
      intercept();
      addNewRestrictions();
      cy.wait("@options-list");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(testData.category)
        .type("{enter}");
      cy.wait("@Designation");
      studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      studentNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
      studentNoteRestrictionsObject.clearButton().click();
      studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(3)
        .type(testData.reason)
        .type("{enter}");
      studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      studentNoteRestrictionsObject.categoryErrorMessage().should("be.visible");
    });
  });

  it("Verify that the Reason dropdown should be empty without filling in the Category in Institution Restriction section.", () => {
    intercept();
    restrictionSection();
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    cy.wait("@options-list");
    studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
    studentNoteRestrictionsObject.emptyDropdownMessage().should("be.visible");
  });

  it.skip("Verify that user able to add restrictions in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
      institutionRestrictions();
      studentNoteRestrictionsObject
        .categoryAssertion(testData.category)
        .should("be.visible");
      studentNoteRestrictionsObject
        .reasonAssertion(testData.reason)
        .should("be.visible");
    });
  });

  it.skip("Verify that user can't resolve restrictions without a resolution note in Institution Restriction section.", () => {
    institutionRestrictions();
    studentNoteRestrictionsObject.resolveRestrictionsButton().click();
    studentNoteRestrictionsObject.resolutionNoteRequired().should("be.visible");
  });

  it.skip("Verify that ministry users can resolve restrictions by entering resolution note in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((testData) => {
      institutionRestrictions();
      studentNoteRestrictionsObject
        .categoryAssertion(testData.category)
        .should("be.visible");
      studentNoteRestrictionsObject
        .reasonAssertion(testData.reason)
        .should("be.visible");
      studentNoteRestrictionsObject
        .resolutionNotesInputText()
        .type(testData.resolutionNotes);
      studentNoteRestrictionsObject.resolveRestrictionsButton().click();
      studentNoteRestrictionsObject
        .restrictionsResolvedAssertion()
        .should("be.visible");
    });
  });

  it("Verify that the Create New Note button displays properly in Note in Institution Note section.", () => {
    createNewNote();
  });

  it("Verify that error messages are displayed properly in the Note in Institution Note section.", () => {
    createNewNote();
    studentNoteRestrictionsObject
      .createNewNoteButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.addNoteButton().click();
    studentNoteRestrictionsObject.noteTypeErrorMessage().should("be.visible");
    studentNoteRestrictionsObject.noteBodyErrorMessage().should("be.visible");
  });

  it("Verify that in the General section Created a note with General type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeGeneral, testData.noteBodyGeneral);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeGeneral);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodyGeneral);
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeGeneral);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodyGeneral);
    });
  });

  it("Verify that in the Restrictions section Created a note with Restrictions type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeRestriction, testData.noteBodyRestriction);
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeRestriction
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyRestriction
      );
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeRestriction
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyRestriction
      );
    });
  });

  it.skip("Verify that in the System Actions section Created a note with System type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeSystem, testData.noteBodySystem);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeSystem);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodySystem);
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeSystem);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodySystem);
    });
  });

  it("Verify that in the Program section Created a note with Program type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeProgram, testData.noteBodyProgram);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeProgram);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodyProgram);
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeProgram);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodyProgram);
    });
  });

  it("Verify that in the Designation section Created a note with Designation type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((testData) => {
      noteAdded(testData.noteTypeDesignation, testData.noteBodyDesignation);
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeDesignation
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyDesignation
      );
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeDesignation
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyDesignation
      );
    });
  });
});
