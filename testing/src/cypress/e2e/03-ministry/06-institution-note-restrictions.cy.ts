import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsInstitution from "../../page-objects/ministry-objects/MinistryUserViewsInstitution";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";
import InstitutionNoteRestrictionsObject from "../../page-objects/ministry-objects/InstitutionNoteRestrictionsObject";
import { notesInstitution } from "../../../data/dev/ministry-data/ministryNotesInstitution";
import { restrictionsInstitution } from "../../../data/dev/ministry-data/ministryRestrictionsInstitution";

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
  ministryUserViewsStudent.searchButton().click();
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
  intercept();
  restrictionSection();
  cy.focused();
  institutionNoteRestrictionsObject
    .addRestrictionsButton()
    .should("be.visible")
    .click();
  cy.wait("@options-list");
  institutionNoteRestrictionsObject.restrictionsDropdownCategory().click();
  institutionNoteRestrictionsObject
    .restrictionsValueCategory()
    .type(restrictionsInstitution.category)
    .type("{enter}");
  cy.wait("@Designation");
  institutionNoteRestrictionsObject.restrictionsDropdownReason().click();
  institutionNoteRestrictionsObject
    .restrictionsValueReason()
    .type(restrictionsInstitution.reason)
    .type("{enter}");
  cy.focused();
  institutionNoteRestrictionsObject
    .notesInputText()
    .type(restrictionsInstitution.notes);
  institutionNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
  institutionNoteRestrictionsObject
    .restrictionsAddedText()
    .should("be.visible");
  institutionNoteRestrictionsObject.categoryButton().click();
  institutionNoteRestrictionsObject.categoryButton().click();
  cy.wait("@institution");
  institutionNoteRestrictionsObject.firstRowButtonRestrictions().click();
  cy.wait("@institutionRestriction");
}

function createNewNote() {
  ministryCustomCommand.loginMinistry();
  dashboardMinistryObject.dashboardText().should("be.visible");
  dashboardMinistryObject.searchInstitutionsText().click();
  ministryUserViewsInstitution.operatingNameInputText().type("e");
  ministryUserViewsStudent.searchButton().click();
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
  institutionNoteRestrictionsObject.noteDropdown().click();
  institutionNoteRestrictionsObject.noteValue().type(noteType).type("{enter}");
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
    ministryUserViewsStudent.searchButton().click();
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
    intercept();
    addNewRestrictions();
    cy.wait("@options-list");
    institutionNoteRestrictionsObject.restrictionsDropdownCategory().click();
    institutionNoteRestrictionsObject
      .restrictionsValueCategory()
      .type(restrictionsInstitution.category)
      .type("{enter}");
    cy.wait("@Designation");
    institutionNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
    institutionNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
    institutionNoteRestrictionsObject.clearButton().click();
    institutionNoteRestrictionsObject.restrictionsDropdownReason().click();
    institutionNoteRestrictionsObject
      .restrictionsValueReason()
      .type(restrictionsInstitution.reason)
      .type("{enter}");
    institutionNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
    institutionNoteRestrictionsObject
      .categoryErrorMessage()
      .should("be.visible");
  });

  it("Verify that the Reason dropdown should be empty without filling in the Category in Institution Restriction section.", () => {
    intercept();
    restrictionSection();
    institutionNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    cy.wait("@options-list");
    institutionNoteRestrictionsObject.restrictionsDropdownReason().click();
    institutionNoteRestrictionsObject
      .emptyDropdownMessage()
      .should("be.visible");
  });

  it.skip("Verify that user able to add restrictions in Institution Restriction section.", () => {
    institutionRestrictions();
    institutionNoteRestrictionsObject
      .categoryAssertion(restrictionsInstitution.category)
      .should("be.visible");
    institutionNoteRestrictionsObject
      .reasonAssertion(restrictionsInstitution.reason)
      .should("be.visible");
  });

  it.skip("Verify that user can't resolve restrictions without a resolution note in Institution Restriction section.", () => {
    institutionRestrictions();
    institutionNoteRestrictionsObject.resolveRestrictionsButton().click();
    institutionNoteRestrictionsObject
      .resolutionNoteRequired()
      .should("be.visible");
  });

  it.skip("Verify that ministry users can resolve restrictions by entering resolution note in Institution Restriction section.", () => {
    institutionRestrictions();
    institutionNoteRestrictionsObject
      .categoryAssertion(restrictionsInstitution.category)
      .should("be.visible");
    institutionNoteRestrictionsObject
      .reasonAssertion(restrictionsInstitution.reason)
      .should("be.visible");
    institutionNoteRestrictionsObject
      .resolutionNotesInputText()
      .type(restrictionsInstitution.resolutionNotes);
    institutionNoteRestrictionsObject.resolveRestrictionsButton().click();
    institutionNoteRestrictionsObject
      .restrictionsResolvedAssertion()
      .should("be.visible");
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
    noteAdded(
      notesInstitution.noteTypeGeneral,
      notesInstitution.noteBodyGeneral
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeGeneral
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyGeneral
    );
    institutionNoteRestrictionsObject.generalTabButton().click();
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeGeneral
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyGeneral
    );
  });

  it("Verify that in the Restrictions section Created a note with Restrictions type, is it displaying correctly or not in Institution Note section.", () => {
    noteAdded(
      notesInstitution.noteTypeRestriction,
      notesInstitution.noteBodyRestriction
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeRestriction
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyRestriction
    );
    institutionNoteRestrictionsObject.generalTabButton().click();
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeRestriction
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyRestriction
    );
  });

  it.skip("Verify that in the System Actions section Created a note with System type, is it displaying correctly or not in Institution Note section.", () => {
    noteAdded(notesInstitution.noteTypeSystem, notesInstitution.noteBodySystem);
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeSystem
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodySystem
    );
    institutionNoteRestrictionsObject.generalTabButton().click();
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeSystem
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodySystem
    );
  });

  it("Verify that in the Program section Created a note with Program type, is it displaying correctly or not in Institution Note section.", () => {
    noteAdded(
      notesInstitution.noteTypeProgram,
      notesInstitution.noteBodyProgram
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeProgram
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyProgram
    );
    institutionNoteRestrictionsObject.generalTabButton().click();
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeProgram
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyProgram
    );
  });

  it("Verify that in the Designation section Created a note with Designation type, is it displaying correctly or not in Institution Note section.", () => {
    noteAdded(
      notesInstitution.noteTypeDesignation,
      notesInstitution.noteBodyDesignation
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeDesignation
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyDesignation
    );
    institutionNoteRestrictionsObject.generalTabButton().click();
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteTypeDesignation
    );
    institutionNoteRestrictionsObject.noteTypeAssertion(
      notesInstitution.noteBodyDesignation
    );
  });
});
