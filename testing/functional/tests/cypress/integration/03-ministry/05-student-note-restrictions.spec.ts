import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";
import StudentNoteRestrictionsObject from "../../page-objects/ministry-objects/StudentNoteRestrictionsObject";

describe("Ministry User Enters Student Note & Restrictions", () => {
  const ministryCustomCommand = new MinistryCustomCommand();
  const dashboardMinistryObject = new DashboardMinistryObject();
  const ministryUserViewsStudent = new MinistryUserViewsStudent();
  const studentNoteRestrictionsObject = new StudentNoteRestrictionsObject();

  const url = Cypress.env("ministryURL");

  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that the user is redirected to correct page of Search Students Section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    cy.url().should("contain", "/search-students");
  });

  it("Verify that the user is redirected to correct page of Student Restriction.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    cy.url().should("contain", "/restrictions");
  });

  it("Check that the ADD RESTRICTIONS button is visible in the Student Restrictions page.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    studentNoteRestrictionsObject.addRestrictionsButton().should("be.visible");
  });

  it("Verify that the ADD RESTRICTIONS button is clickable & that the dialog box opens in Student Restriction section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.addNewRestrictionsText().should("be.visible");
  });

  it("Check that error messages are displayed correctly in Student Add new restrictions dialog box.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.addNewRestrictionsText().should("be.visible");
    studentNoteRestrictionsObject.addRestrictionsDialogBox().click();
    studentNoteRestrictionsObject.categoryErrorMessage().should("be.visible");
    studentNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
  });

  it("Check that cancel button closes the dialog box in Student Restriction section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.cancelButton().click();
    studentNoteRestrictionsObject.allRestrictions().should("be.visible");
  });

  it("Check that all mandatory fields have been filled out in Student Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInStudent").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      cy.intercept("GET", "**/Verification").as("Verification");
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsStudent.firstNameText().should("be.visible");
      ministryUserViewsStudent.viewButtonFirstRow().click();
      ministryUserViewsStudent.studentDetailsText().should("be.visible");
      ministryUserViewsStudent.studentProfileText().should("be.visible");
      ministryUserViewsStudent.applicationsSectionsButton().click();
      ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      studentNoteRestrictionsObject
        .addRestrictionsButton()
        .should("be.visible")
        .click();
      cy.wait("@options-list");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.category)
        .type("{enter}");
      cy.wait("@Verification");
      studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      studentNoteRestrictionsObject.reasonErrorMessage().should("be.visible");
      studentNoteRestrictionsObject.clearButton().click();
      studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(3)
        .type(_testData.reason)
        .type("{enter}");
      studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      studentNoteRestrictionsObject.categoryErrorMessage().should("be.visible");
      studentNoteRestrictionsObject.clearButton().click();
    });
  });

  it("Verify that that the Reason dropdown should be empty without filling in the Category in Student Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInStudent").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      cy.intercept("GET", "**/Verification").as("Verification");
      cy.intercept("GET", "**/student/**").as("student");
      cy.intercept("GET", "**/studentRestriction/**").as("studentRestriction");
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsStudent.firstNameText().should("be.visible");
      ministryUserViewsStudent.viewButtonFirstRow().click();
      ministryUserViewsStudent.studentDetailsText().should("be.visible");
      ministryUserViewsStudent.studentProfileText().should("be.visible");
      ministryUserViewsStudent.applicationsSectionsButton().click();
      ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      studentNoteRestrictionsObject
        .addRestrictionsButton()
        .should("be.visible")
        .click();
      cy.wait("@options-list");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
      studentNoteRestrictionsObject.emptyDropdownMessage().should("be.visible");
    });
  });

  it("Verify that user able to add restrictions in Student Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInStudent").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      cy.intercept("GET", "**/Verification").as("Verification");
      cy.intercept("GET", "**/student/**").as("student");
      cy.intercept("GET", "**/studentRestriction/**").as("studentRestriction");
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsStudent.firstNameText().should("be.visible");
      ministryUserViewsStudent.viewButtonFirstRow().click();
      ministryUserViewsStudent.studentDetailsText().should("be.visible");
      ministryUserViewsStudent.studentProfileText().should("be.visible");
      ministryUserViewsStudent.applicationsSectionsButton().click();
      ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      studentNoteRestrictionsObject
        .addRestrictionsButton()
        .should("be.visible")
        .click();
      cy.wait("@options-list");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.category)
        .type("{enter}");
      cy.wait("@Verification");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(3)
        .type(_testData.reason)
        .type("{enter}");
      studentNoteRestrictionsObject.notesInputText().type(_testData.notes);
      studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      studentNoteRestrictionsObject
        .restrictionsAddedText()
        .should("be.visible");
      studentNoteRestrictionsObject.categoryButton().click();
      studentNoteRestrictionsObject.categoryButton().click();
      cy.wait("@student");
      studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
      cy.wait("@studentRestriction");
      studentNoteRestrictionsObject
        .categoryAssertion(_testData.category)
        .should("be.visible");
      studentNoteRestrictionsObject
        .reasonAssertion(_testData.reason)
        .should("be.visible");
    });
  });

  it(
    "Verify that user can't resolve restrictions without a resolution note in Student Restriction section.",
    { retries: 4 },
    () => {
      cy.fixture("ministryAddNewRestrictionsInStudent").then((_testData) => {
        cy.intercept("GET", "**/options-list").as("options-list");
        cy.intercept("GET", "**/Verification").as("Verification");
        cy.intercept("GET", "**/student/**").as("student");
        cy.intercept("GET", "**/studentRestriction/**").as(
          "studentRestriction"
        );
        ministryCustomCommand.loginMinistry();
        dashboardMinistryObject.dashboardText().should("be.visible");
        dashboardMinistryObject.searchStudentsText().click();
        ministryUserViewsStudent.givenNames().type("a");
        ministryUserViewsStudent.searchButton().eq(1).click();
        ministryUserViewsStudent.firstNameText().should("be.visible");
        ministryUserViewsStudent.viewButtonFirstRow().click();
        ministryUserViewsStudent.studentDetailsText().should("be.visible");
        ministryUserViewsStudent.studentProfileText().should("be.visible");
        ministryUserViewsStudent.applicationsSectionsButton().click();
        ministryUserViewsStudent
          .applicationSectionVerify()
          .should("be.visible");
        ministryUserViewsStudent.restrictionsSectionButton().click();
        ministryUserViewsStudent
          .restrictionsSectionVerify()
          .should("be.visible");
        studentNoteRestrictionsObject
          .addRestrictionsButton()
          .should("be.visible")
          .click();
        cy.wait("@options-list");
        studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
        studentNoteRestrictionsObject
          .restrictionsValue()
          .eq(1)
          .type(_testData.category)
          .type("{enter}");
        cy.wait("@Verification");
        studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
        studentNoteRestrictionsObject
          .restrictionsValue()
          .eq(3)
          .type(_testData.reason)
          .type("{enter}");
        studentNoteRestrictionsObject.notesInputText().type(_testData.notes);
        studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
        studentNoteRestrictionsObject
          .restrictionsAddedText()
          .should("be.visible");
        studentNoteRestrictionsObject.categoryButton().click();
        studentNoteRestrictionsObject.categoryButton().click();
        cy.wait("@student");
        studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
        cy.wait("@studentRestriction");
        studentNoteRestrictionsObject
          .categoryAssertion(_testData.category)
          .should("be.visible");
        studentNoteRestrictionsObject
          .reasonAssertion(_testData.reason)
          .should("be.visible");
        studentNoteRestrictionsObject.resolveRestrictionsButton().click();
        studentNoteRestrictionsObject
          .resolutionNoteRequired()
          .should("be.visible");
      });
    }
  );

  it("Verify that ministry users can resolve restrictions by entering resolution note in Student Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInStudent").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      cy.intercept("GET", "**/Verification").as("Verification");
      cy.intercept("GET", "**/student/**").as("student");
      cy.intercept("GET", "**/studentRestriction/**").as("studentRestriction");
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsStudent.firstNameText().should("be.visible");
      ministryUserViewsStudent.viewButtonFirstRow().click();
      ministryUserViewsStudent.studentDetailsText().should("be.visible");
      ministryUserViewsStudent.studentProfileText().should("be.visible");
      ministryUserViewsStudent.applicationsSectionsButton().click();
      ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      studentNoteRestrictionsObject
        .addRestrictionsButton()
        .should("be.visible")
        .click();
      cy.wait("@options-list");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.category)
        .type("{enter}");
      cy.wait("@Verification");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(2).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(3)
        .type(_testData.reason)
        .type("{enter}");
      studentNoteRestrictionsObject.notesInputText().type(_testData.notes);
      studentNoteRestrictionsObject.addRestrictionButtonDialogBox().click();
      studentNoteRestrictionsObject
        .restrictionsAddedText()
        .should("be.visible");
      studentNoteRestrictionsObject.categoryButton().click();
      studentNoteRestrictionsObject.categoryButton().click();
      cy.wait("@student");
      studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
      cy.wait("@studentRestriction");
      studentNoteRestrictionsObject
        .categoryAssertion(_testData.category)
        .should("be.visible");
      studentNoteRestrictionsObject
        .reasonAssertion(_testData.reason)
        .should("be.visible");
      studentNoteRestrictionsObject
        .resolutionNotesInputText()
        .type(_testData.resolutionNotes);
      studentNoteRestrictionsObject.resolveRestrictionsButton().click();
      studentNoteRestrictionsObject
        .restrictionsResolvedAssertion()
        .should("be.visible");
    });
  });

  it("Verify that the user is redirected to correct page of Note in Student Note section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.notesSectionButton().click();
    studentNoteRestrictionsObject.createNewNoteButton().should("be.visible");
  });

  it("Verify that the Create New Note button displays properly in Note in Student Note section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsStudent.firstNameText().should("be.visible");
    ministryUserViewsStudent.viewButtonFirstRow().click();
    ministryUserViewsStudent.studentDetailsText().should("be.visible");
    ministryUserViewsStudent.studentProfileText().should("be.visible");
    ministryUserViewsStudent.applicationsSectionsButton().click();
    ministryUserViewsStudent.applicationSectionVerify().should("be.visible");
    ministryUserViewsStudent.notesSectionButton().click();
    studentNoteRestrictionsObject.createNewNoteButton().should("be.visible");
  });

  it("Verify that error messages are displayed properly in the Note in Student Note section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchStudentsText().click();
    ministryUserViewsStudent.givenNames().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
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
    studentNoteRestrictionsObject.addNoteButton().click();
    studentNoteRestrictionsObject.noteTypeErrorMessage().should("be.visible");
    studentNoteRestrictionsObject.noteBodyErrorMessage().should("be.visible");
  });

  it("Verify that in the General section Created a note with General type, is it displaying correctly or not in Student Note section.", () => {
    cy.fixture("ministryAddNewNotesInStudent").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
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
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.noteTypeGeneral)
        .type("{enter}");
      studentNoteRestrictionsObject
        .noteBodyInputText()
        .type(_testData.noteBodyGeneral);
      studentNoteRestrictionsObject.addNoteButton().click();
      studentNoteRestrictionsObject
        .noteAddedSuccessfully()
        .should("be.visible");
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeGeneral
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyGeneral
      );
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeGeneral
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyGeneral
      );
    });
  });

  it("Verify that in the Restriction section Created a note with Restriction type, is it displaying correctly or not in Student Note section.", () => {
    cy.fixture("ministryAddNewNotesInStudent").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
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
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.noteTypeRestriction)
        .type("{enter}");
      studentNoteRestrictionsObject
        .noteBodyInputText()
        .type(_testData.noteBodyRestriction);
      studentNoteRestrictionsObject.addNoteButton().click();
      studentNoteRestrictionsObject
        .noteAddedSuccessfully()
        .should("be.visible");
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeRestriction
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyRestriction
      );
      studentNoteRestrictionsObject.restrictionsTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeRestriction
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyRestriction
      );
    });
  });

  it.skip("Verify that in the System Actions section Created a note with System Actions type, is it displaying correctly or not in Student Note section.", () => {
    cy.fixture("ministryAddNewNotesInStudent").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchStudentsText().click();
      ministryUserViewsStudent.givenNames().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
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
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.noteTypeSystem)
        .type("{enter}");
      studentNoteRestrictionsObject
        .noteBodyInputText()
        .type(_testData.noteBodySystem);
      studentNoteRestrictionsObject.addNoteButton().click();
      studentNoteRestrictionsObject
        .noteAddedSuccessfully()
        .should("be.visible");
      studentNoteRestrictionsObject.noteTypeAssertion(_testData.noteTypeSystem);
      studentNoteRestrictionsObject.noteTypeAssertion(_testData.noteBodySystem);
      studentNoteRestrictionsObject.systemActionsTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(_testData.noteTypeSystem);
      studentNoteRestrictionsObject.noteTypeAssertion(_testData.noteBodySystem);
    });
  });
});
