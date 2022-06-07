import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";
import StudentNoteRestrictionsObject from "../../page-objects/ministry-objects/StudentNoteRestrictionsObject";

const ministryCustomCommand = new MinistryCustomCommand();
const dashboardMinistryObject = new DashboardMinistryObject();
const ministryUserViewsStudent = new MinistryUserViewsStudent();
const studentNoteRestrictionsObject = new StudentNoteRestrictionsObject();
const url = Cypress.env("ministryURL");

function intercept() {
  cy.intercept("GET", "**/options-list").as("options-list");
  cy.intercept("GET", "**/Verification").as("Verification");
  cy.intercept("GET", "**/student/**").as("student");
  cy.intercept("GET", "**/studentRestriction/**").as("studentRestriction");
}

function searchStudents() {
  ministryCustomCommand.loginMinistry();
  dashboardMinistryObject.dashboardText().should("be.visible");
  dashboardMinistryObject.searchStudentsText().click();
  ministryUserViewsStudent.givenNames().type("a");
  ministryUserViewsStudent.searchButton().eq(1).click();
  cy.url().should("contain", "/search-students");
}

function restrictions() {
  searchStudents();
  ministryUserViewsStudent.firstNameText().should("be.visible");
  ministryUserViewsStudent.viewButtonFirstRow().click();
  ministryUserViewsStudent.studentDetailsText().should("be.visible");
  ministryUserViewsStudent.studentProfileText().should("be.visible");
  ministryUserViewsStudent.applicationsSectionsButton().click();
  ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
  ministryUserViewsStudent.restrictionsSectionButton().click();
  ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
  cy.url().should("contain", "/restrictions");
}

function resolutionNote() {
  cy.fixture("ministryAddNewRestrictionsInStudent").then((testData) => {
    intercept();
    restrictions();
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
    cy.wait("@Verification");
    studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
    studentNoteRestrictionsObject
      .restrictionsValue()
      .eq(3)
      .type(testData.reason)
      .type("{enter}");
    studentNoteRestrictionsObject.notesInputText().type(testData.notes);
    studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
    studentNoteRestrictionsObject.restrictionsAddedText().should("be.visible");
    studentNoteRestrictionsObject.categoryButton().click();
    studentNoteRestrictionsObject.categoryButton().click();
    cy.wait("@student");
    studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
    cy.wait("@studentRestriction");
    studentNoteRestrictionsObject
      .categoryAssertion(testData.category)
      .should("be.visible");
    studentNoteRestrictionsObject
      .reasonAssertion(testData.reason)
      .should("be.visible");
    cy.focused();
  });
}

function noteSection() {
  ministryUserViewsStudent.firstNameText().should("be.visible");
  ministryUserViewsStudent.viewButtonFirstRow().click();
  ministryUserViewsStudent.studentDetailsText().should("be.visible");
  ministryUserViewsStudent.studentProfileText().should("be.visible");
  ministryUserViewsStudent.applicationsSectionsButton().click();
  ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
  ministryUserViewsStudent.notesSectionButton().click();
  studentNoteRestrictionsObject.createNewNoteButton().should("be.visible");
}

function addNewRestrictions() {
  restrictions();
  studentNoteRestrictionsObject
    .addRestrictionsButton()
    .should("be.visible")
    .click();
  studentNoteRestrictionsObject.addNewRestrictionsText().should("be.visible");
}

function createNote(noteType: any, noteBody: any) {
  searchStudents();
  ministryUserViewsStudent.firstNameText().should("be.visible");
  ministryUserViewsStudent.viewButtonFirstRow().click();
  ministryUserViewsStudent.studentDetailsText().should("be.visible");
  ministryUserViewsStudent.studentProfileText().should("be.visible");
  ministryUserViewsStudent.applicationsSectionsButton().click();
  ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
  ministryUserViewsStudent.notesSectionButton().click();
  studentNoteRestrictionsObject
    .createNewNoteButton()
    .should("be.visible")
    .click();
  cy.focused();
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

describe("Ministry User Enters Student Note & Restrictions", () => {
  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that the user is redirected to correct page of Search Students Section.", () => {
    searchStudents();
  });

  it("Verify that the user is redirected to correct page of Student Restriction.", () => {
    restrictions();
  });

  it("Check that the ADD RESTRICTIONS button is visible in the Student Restrictions page.", () => {
    restrictions();
    studentNoteRestrictionsObject.addRestrictionsButton().should("be.visible");
  });

  it("Verify that the ADD RESTRICTIONS button is clickable & that the dialog box opens in Student Restriction section.", () => {
    addNewRestrictions();
  });

  it("Check that error messages are displayed correctly in Student Add new restrictions dialog box.", () => {
    addNewRestrictions();
    studentNoteRestrictionsObject.addRestrictionsDialogBox().click();
    studentNoteRestrictionsObject.categoryErrorMessage().should("be.visible");
    studentNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
  });

  it("Check that cancel button closes the dialog box in Student Restriction section.", () => {
    restrictions();
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.cancelButton().click();
    studentNoteRestrictionsObject.allRestrictions().should("be.visible");
  });

  it("Check that all mandatory fields have been filled out in Student Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInStudent").then((testData) => {
      intercept();
      restrictions();
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
      cy.wait("@Verification");
      studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      studentNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
      studentNoteRestrictionsObject.clearButton().click();
      studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(3)
        .type(testData.reason)
        .type("{enter}");
      studentNoteRestrictionsObject
        .addRestrictionButtonDialogBox()
        .should("be.visible")
        .click();
      studentNoteRestrictionsObject.categoryErrorMessage().should("be.visible");
      studentNoteRestrictionsObject.clearButton().click();
    });
  });

  it("Verify that the Reason dropdown should be empty without filling in the Category in Student Restriction section.", () => {
    intercept();
    restrictions();
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    cy.wait("@options-list");
    studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
    studentNoteRestrictionsObject.emptyDropdownMessage().should("be.visible");
  });

  it("Verify that user able to add restrictions in Student Restriction section.", () => {
    resolutionNote();
  });

  it("Verify that user can't resolve restrictions without a resolution note in Student Restriction section.", () => {
    resolutionNote();
    studentNoteRestrictionsObject.resolveRestrictionsButton().click();
    studentNoteRestrictionsObject.resolutionNoteRequired().should("be.visible");
  });

  it("Verify that ministry users can resolve restrictions by entering resolution note in Student Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInStudent").then((testData) => {
      resolutionNote();
      studentNoteRestrictionsObject
        .resolutionNotesInputText()
        .type(testData.resolutionNotes);
      studentNoteRestrictionsObject.resolveRestrictionsButton().click();
      studentNoteRestrictionsObject
        .restrictionsResolvedAssertion()
        .should("be.visible");
    });
  });

  it("Verify that the user is redirected to correct page of Note in Student Note section.", () => {
    searchStudents();
    noteSection();
  });

  it("Verify that the Create New Note button displays properly in Note in Student Note section.", () => {
    searchStudents();
    cy.focused().click();
    noteSection();
  });

  it("Verify that error messages are displayed properly in the Note in Student Note section.", () => {
    searchStudents();
    noteSection();
    studentNoteRestrictionsObject.createNewNoteButton().click();
    studentNoteRestrictionsObject.addNoteButton().click();
    studentNoteRestrictionsObject.noteTypeErrorMessage().should("be.visible");
    studentNoteRestrictionsObject.noteBodyErrorMessage().should("be.visible");
  });

  it("Verify that in the General section Created a note with General type, is it displaying correctly or not in Student Note section.", () => {
    cy.fixture("ministryAddNewNotesInStudent").then((testData) => {
      createNote(testData.noteTypeGeneral, testData.noteBodyGeneral);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeGeneral);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodyGeneral);
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeGeneral);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodyGeneral);
    });
  });

  it("Verify that in the Restriction section Created a note with Restriction type, is it displaying correctly or not in Student Note section.", () => {
    cy.fixture("ministryAddNewNotesInStudent").then((testData) => {
      createNote(testData.noteTypeRestriction, testData.noteBodyRestriction);
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeRestriction
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyRestriction
      );
      studentNoteRestrictionsObject.restrictionsTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteTypeRestriction
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        testData.noteBodyRestriction
      );
    });
  });

  it.skip("Verify that in the System Actions section Created a note with System Actions type, is it displaying correctly or not in Student Note section.", () => {
    cy.fixture("ministryAddNewNotesInStudent").then((testData) => {
      createNote(testData.noteTypeSystem, testData.noteBodySystem);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeSystem);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodySystem);
      studentNoteRestrictionsObject.systemActionsTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteTypeSystem);
      studentNoteRestrictionsObject.noteTypeAssertion(testData.noteBodySystem);
    });
  });
});
