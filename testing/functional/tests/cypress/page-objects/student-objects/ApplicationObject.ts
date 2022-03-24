export default class ApplicationObject {
  clickOnDraftStatus() {
    cy.get("//tbody/tr/td[5]").each(($el, index, $list) => {
      if ($el.text() === "Draft") {
        $el.click();
      }
    });
  }

  applicationButton() {
    return cy.xpath("//button[normalize-space()='Applications']");
  }

  verifyApplicationText() {
    return cy.contains("My Applications");
  }

  startNewApplicationButton() {
    return cy.contains("Start New Application");
  }

  //<StartRegion----------------------------Start New Application------------------------------>
  verifyStartNewApplicationText() {
    return cy.contains("Select an application to begin");
  }

  startApplicationStudyYearDisableButton() {
    return cy.xpath("//button[@disabled='disabled']");
  }

  selectStudyYearDropdown() {
    cy.fixture("newApplicationForm").then((testData) => {
      cy.get(".form-group").eq(1).click({ force: true });
      cy.wait(2000);
      cy.get(".choices__input.choices__input--cloned")
        .click({ force: true })
        .type(testData.selectStudyYear)
        .type("{enter}");
    });
  }

  startApplicationStudyYearEnableButton() {
    return cy.xpath("//button[@disabled='disabled']");
  }

  removedButton() {
    return cy.xpath("//button[normalize-space()='Remove item']");
  }

  //Alert message in "Already In Progress"
  applicationAlreadyInProgressText() {
    return cy.contains("Application already in progress");
  }

  applicationAlreadyInProgressTextCard() {
    return cy.get(".v-card-actions > .v-btn");
  }

  //Start Application
  startApplicationTuitionWaiverButton() {
    return cy.xpath("//button[@name='data[startApplication1]']");
  }
  startApplicationBCloanForgivenessProgramButton() {
    return cy.xpath("//button[@name='data[startApplication2]']").click();
  }
  startApplicationPacificLeaderLoanForgivenessButton() {
    return cy.xpath("//button[@name='data[startApplication4]']").click();
  }
  startApplicationInterestFreeStatusButton() {
    return cy.xpath("//button[@name='data[startApplication3]']").click();
  }

  //<EndRegion----------------------------Start New Application------------------------------>

  //<StartRegion--------------------------Draft Status------------------------------------->

  draftApplication() {
    return cy.get(":nth-child(1) > .svg-inline--fa > path");
  }

  draftApplicationVerifyText() {
    return cy.contains("Let’s get started on your application");
  }

  nextSectionButton() {
    return cy.get(":nth-child(3) > .ml-auto > .v-btn");
  }

  previousSectionButton() {
    return cy.contains("Previous section");
  }

  errorMsgTxtForSchoolAttending() {
    return cy.contains("The school I will be attending is required");
  }

  selectionDropdownInvalid() {
    cy.get(".form-control.ui.fluid.selection.dropdown.is-invalid");
  }

  welcomeText() {
    return cy.contains("Let’s get started on your application");
  }

  welcomeButton() {
    return cy.get(":nth-child(1) > .page-link");
  }

  mySchoolIsNotListedCheckbox() {
    return cy.get(".form-check-input", { timeout: 5000 });
  }

  checkboxAlertMessage() {
    return cy.contains(
      "Your institution may not be designated by StudentAid BC"
    );
  }

  uncheckAlertMessage() {
    return cy.contains("My school isn't listed");
  }

  schoolIWillBeAttendingDropdown() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(1).click({ force: true });
      cy.get(".choices__input.choices__input--cloned")
        .click({ force: true })
        .type(testData.schoolIWillBeAttending)
        .type("{enter}");
    });
  }

  schoolIWillBeAttendingDropdown2() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group", { timeout: 3000 }).eq(1).click({ force: true });
      cy.get(".choices__input.choices__input--cloned", { timeout: 3000 })
        .click({ force: true })
        .type(testData.schoolIWillBeAttending2)
        .type("{enter}");
    });
  }

  howWillYouAttendProgramDropdown() {
    cy.intercept("GET", "**/options-list").as("optionListHowWillYou");
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(4).click({ force: true });
      cy.wait("@optionListHowWillYou");
      cy.get(".choices__input.choices__input--cloned")
        .eq(1)
        .click({ force: true })
        .type(testData.howWillYouAttendProgram)
        .type("{enter}", { timeout: 2000 });
    });
  }

  howWillYouAttendProgramDropdown2() {
    cy.intercept("GET", "**/options-list").as("optionListHowWillYou2");
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(4).click({ force: true });
      cy.wait("@optionListHowWillYou2");
      cy.get(".choices__input.choices__input--cloned")
        .eq(1)
        .click({ force: true })
        .type(testData.howWillYouAttendProgram2)
        .type("{enter}", { timeout: 2000 });
    });
  }

  programIWillBeAttendingDropdown() {
    cy.intercept("GET", "**/options-list").as("optionListProgramIWill");
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(6).click({ force: true });
      cy.wait("@optionListProgramIWill");
      cy.get(".choices__input.choices__input--cloned")
        .eq(2)
        .click({ force: true })
        .type(testData.programIWillBeAttendingDropdown)
        .type("{enter}", { timeout: 2000 });
    });
  }

  programIWillBeAttendingDropdown2() {
    cy.intercept("GET", "**/options-list").as("optionListProgramIWill2");
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(6).click({ force: true });
      cy.wait("@optionListProgramIWill2");
      cy.get(".choices__input.choices__input--cloned")
        .eq(2)
        .click({ force: true })
        .type(testData.programIWillBeAttendingDropdown2)
        .type("{enter}", { timeout: 2000 });
    });
  }

  myStudyPeriodIsNotListedCheckbox() {
    return cy.get("#eoslne6-offeringnotListed");
  }

  programName() {
    return cy.get("#ek2u9li-programName");
  }

  programDescription() {
    return cy.get("e1w8o5a-programDescription");
  }

  studyStartDate() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get('#eqnahab > [ref="element"] > .input-group > .input').type(
        testData.studyStartDate
      );
    });
  }

  studyEndDate() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get('#eyw0exi > [ref="element"] > .input-group > .input').type(
        testData.studyEndDate
      );
    });
  }

  inputStudentNumber() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get("#ek8w4hn-studentNumber").type(testData.studentNumber);
    });
  }

  inputStudentNumber2() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get("#ek8w4hn-studentNumber").type(testData.studentNumber2);
    });
  }

  incorrectStudentNumber() {
    return cy.get("#ek8w4hn-studentNumber");
  }

  incorrectStudentNumberText() {
    return cy.contains("Student number must have no more than 12 characters.");
  }

  programOfferingDropdown() {
    cy.intercept("GET", "**/options-list").as("programOffering");
    cy.fixture("draftApplicationData").then((testData) => {
      cy.xpath(
        "//div[@id='eb4inb']//div[@class='form-control ui fluid selection dropdown']"
      ).click({ force: true });
      cy.wait("@programOffering");
      cy.get(".choices__input.choices__input--cloned")
        .eq(3)
        .click({ force: true })
        .type(testData.programOffering)
        .type("{enter}", { timeout: 2000 });
    });
  }
  //<EndRegion--------------------------Draft Status------------------------------------->

  programPageText() {
    //Dropdown selection
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".fa").eq(0).click({ force: true });
      cy.get(".choices__input.choices__input--cloned")
        .click({ force: true })
        .type(testData.searchForYourSchool)
        .type("{enter}");
    });
  }
}
