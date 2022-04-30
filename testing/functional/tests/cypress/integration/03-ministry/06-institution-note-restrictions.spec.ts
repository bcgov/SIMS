import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";
import DashboardMinistryObject from "../../page-objects/ministry-objects/DashboardMinistryObject";
import MinistryUserViewsInstitution from "../../page-objects/ministry-objects/MinistryUserViewsInstitution";
import MinistryUserViewsStudent from "../../page-objects/ministry-objects/MinistryUserViewsStudent";
import StudentNoteRestrictionsObject from "../../page-objects/ministry-objects/StudentNoteRestrictionsObject";

describe("Ministry User Enters Institution Note & Restrictions", () => {
  const ministryCustomCommand = new MinistryCustomCommand();
  const dashboardMinistryObject = new DashboardMinistryObject();
  const ministryUserViewsStudent = new MinistryUserViewsStudent();
  const ministryUserViewsInstitution = new MinistryUserViewsInstitution();

  const studentNoteRestrictionsObject = new StudentNoteRestrictionsObject();

  const url = Cypress.env("ministryURL");

  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that the user is redirected to correct page of Search Institutions Section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    cy.url().should("contain", "/search-institutions");
  });

  it("Verify that the user is redirected to correct page of Institution Restriction section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
  });

  it("Verify that the user is redirected to correct page of Note in Institution Note section .", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    ministryUserViewsStudent.notesSectionButton().click();
    ministryUserViewsStudent.notesSectionVerify().should("be.visible");
  });

  it("Check that the ADD RESTRICTIONS button is visible in the Restrictions page in Institution Restrictions section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    studentNoteRestrictionsObject.addRestrictionsButton().should("be.visible");
  });

  it("Check that the ADD RESTRICTIONS button is visible in the Restrictions page in Institution Restrictions section..", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.addNewRestrictionsText().should("be.visible");
  });

  it("Check that error messages are displayed correctly in Add new restrictions dialog box in Institution Restrictions section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
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

  it("Check that cancel button closes the dialog box in Institution Restriction section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    ministryUserViewsStudent.restrictionsSectionButton().click();
    ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
    studentNoteRestrictionsObject
      .addRestrictionsButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.addNewRestrictionsText().should("be.visible");
    studentNoteRestrictionsObject.cancelButton().click();
    studentNoteRestrictionsObject.allRestrictions().should("be.visible");
  });

  it("Check that all mandatory fields have been filled out in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      cy.intercept("GET", "**/Designation").as("Designation");
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      studentNoteRestrictionsObject
        .addRestrictionsButton()
        .should("be.visible")
        .click();
      studentNoteRestrictionsObject
        .addNewRestrictionsText()
        .should("be.visible");
      cy.wait("@options-list");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.category)
        .type("{enter}");
      cy.wait("@Designation");
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

  it("Verify that that the Reason dropdown should be empty without filling in the Category in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
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

  it("Verify that user able to add restrictions in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      cy.intercept("GET", "**/Designation").as("Designation");
      cy.intercept("GET", "**/institution/**").as("institution");
      cy.intercept("GET", "**/institutionRestriction/**").as(
        "institutionRestriction"
      );
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
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
      cy.wait("@Designation");
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
      cy.wait("@institution");
      studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
      cy.wait("@institutionRestriction");
      studentNoteRestrictionsObject
        .categoryAssertion(_testData.category)
        .should("be.visible");
      studentNoteRestrictionsObject
        .reasonAssertion(_testData.reason)
        .should("be.visible");
    });
  });

  it(
    "Verify that user can't resolve restrictions without a resolution note in Institution Restriction section.",
    { retries: 4 },
    () => {
      cy.fixture("ministryAddNewRestrictionsInInstitution").then(
        (_testData) => {
          cy.intercept("GET", "**/options-list").as("options-list");
          cy.intercept("GET", "**/Designation").as("Designation");
          cy.intercept("GET", "**/institution/**").as("institution");
          cy.intercept("GET", "**/institutionRestriction/**").as(
            "institutionRestriction"
          );
          ministryCustomCommand.loginMinistry();
          dashboardMinistryObject.dashboardText().should("be.visible");
          dashboardMinistryObject.searchInstitutionsText().click();
          ministryUserViewsInstitution.operatingNameInputText().type("a");
          ministryUserViewsStudent.searchButton().eq(1).click();
          ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
          ministryUserViewsStudent.restrictionsSectionButton().click();
          ministryUserViewsStudent
            .restrictionsSectionVerify()
            .should("be.visible");
          ministryUserViewsStudent.restrictionsSectionButton().click();
          ministryUserViewsStudent
            .restrictionsSectionVerify()
            .should("be.visible");
          studentNoteRestrictionsObject
            .addRestrictionsButton()
            .should("be.visible")
            .click();
          studentNoteRestrictionsObject
            .addNewRestrictionsText()
            .should("be.visible");
          cy.wait("@options-list");
          studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
          studentNoteRestrictionsObject
            .restrictionsValue()
            .eq(1)
            .type(_testData.category)
            .type("{enter}");
          cy.wait("@Designation");
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
          cy.wait("@institution");
          studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
          cy.wait("@institutionRestriction");
          studentNoteRestrictionsObject.resolveRestrictionsButton().click();
          studentNoteRestrictionsObject
            .resolutionNoteRequired()
            .should("be.visible");
        }
      );
    }
  );

  it("Verify that ministry users can resolve restrictions by entering resolution note in Institution Restriction section.", () => {
    cy.fixture("ministryAddNewRestrictionsInInstitution").then((_testData) => {
      cy.intercept("GET", "**/options-list").as("options-list");
      cy.intercept("GET", "**/Designation").as("Designation");
      cy.intercept("GET", "**/institution/**").as("institution");
      cy.intercept("GET", "**/institutionRestriction/**").as(
        "institutionRestriction"
      );
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      ministryUserViewsStudent.restrictionsSectionButton().click();
      ministryUserViewsStudent.restrictionsSectionVerify().should("be.visible");
      studentNoteRestrictionsObject
        .addRestrictionsButton()
        .should("be.visible")
        .click();
      studentNoteRestrictionsObject
        .addNewRestrictionsText()
        .should("be.visible");
      cy.wait("@options-list");
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.category)
        .type("{enter}");
      cy.wait("@Designation");
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
      cy.wait("@institution");
      studentNoteRestrictionsObject.firstRowButtonRestrictions().click();
      cy.wait("@institutionRestriction");
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

  it("Verify that the Create New Note button displays properly in Note in Institution Note section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.notesSectionButton().click();
    studentNoteRestrictionsObject.createNewNoteButton().should("be.visible");
  });

  it("Verify that error messages are displayed properly in the Note in Institution Note section.", () => {
    ministryCustomCommand.loginMinistry();
    dashboardMinistryObject.dashboardText().should("be.visible");
    dashboardMinistryObject.searchInstitutionsText().click();
    ministryUserViewsInstitution.operatingNameInputText().type("a");
    ministryUserViewsStudent.searchButton().eq(1).click();
    ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
    ministryUserViewsStudent.notesSectionButton().click();
    studentNoteRestrictionsObject
      .createNewNoteButton()
      .should("be.visible")
      .click();
    studentNoteRestrictionsObject.addNoteButton().click();
    studentNoteRestrictionsObject.noteTypeErrorMessage().should("be.visible");
    studentNoteRestrictionsObject.noteBodyErrorMessage().should("be.visible");
  });

  it("Verify that in the General section Created a note with General type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
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

  it("Verify that in the Restrictions section Created a note with Restrictions type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
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
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeRestriction
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyRestriction
      );
    });
  });

  it.skip("Verify that in the System Actions section Created a note with System type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
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
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(_testData.noteTypeSystem);
      studentNoteRestrictionsObject.noteTypeAssertion(_testData.noteBodySystem);
    });
  });

  it("Verify that in the Program section Created a note with Program type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
      ministryUserViewsStudent.notesSectionButton().click();
      studentNoteRestrictionsObject
        .createNewNoteButton()
        .should("be.visible")
        .click();
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.noteTypeProgram)
        .type("{enter}");
      studentNoteRestrictionsObject
        .noteBodyInputText()
        .type(_testData.noteBodyProgram);
      studentNoteRestrictionsObject.addNoteButton().click();
      studentNoteRestrictionsObject
        .noteAddedSuccessfully()
        .should("be.visible");
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeProgram
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyProgram
      );
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeProgram
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyProgram
      );
    });
  });

  it("Verify that in the Designation section Created a note with Designation type, is it displaying correctly or not in Institution Note section.", () => {
    cy.fixture("ministryAddNewNotesInInstitution").then((_testData) => {
      ministryCustomCommand.loginMinistry();
      dashboardMinistryObject.dashboardText().should("be.visible");
      dashboardMinistryObject.searchInstitutionsText().click();
      ministryUserViewsInstitution.operatingNameInputText().type("a");
      ministryUserViewsStudent.searchButton().eq(1).click();
      ministryUserViewsInstitution.viewButtonFirstRowInstitution().click();
      ministryUserViewsStudent.notesSectionButton().click();
      studentNoteRestrictionsObject
        .createNewNoteButton()
        .should("be.visible")
        .click();
      studentNoteRestrictionsObject.restrictionsDropdown().eq(0).click();
      studentNoteRestrictionsObject
        .restrictionsValue()
        .eq(1)
        .type(_testData.noteTypeDesignation)
        .type("{enter}");
      studentNoteRestrictionsObject
        .noteBodyInputText()
        .type(_testData.noteBodyDesignation);
      studentNoteRestrictionsObject.addNoteButton().click();
      studentNoteRestrictionsObject
        .noteAddedSuccessfully()
        .should("be.visible");
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeDesignation
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyDesignation
      );
      studentNoteRestrictionsObject.generalTabButton().click();
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteTypeDesignation
      );
      studentNoteRestrictionsObject.noteTypeAssertion(
        _testData.noteBodyDesignation
      );
    });
  });
});
