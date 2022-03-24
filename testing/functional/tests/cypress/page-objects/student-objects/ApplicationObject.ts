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
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .click({ force: true })
        .type(testData.selectStudyYear)
        .type("{enter}");
    });
    cy.wait(2000);
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
    return cy.get(".form-check-input");
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
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .click({ force: true })
        .type(testData.schoolIWillBeAttending)
        .type("{enter}");
    });
    cy.wait(2000);
  }

  schoolIWillBeAttendingDropdown2() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(1).click({ force: true });
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .click({ force: true })
        .type(testData.schoolIWillBeAttending2)
        .type("{enter}");
    });
    cy.wait(2000);
  }

  howWillYouAttendProgramDropdown() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(4).click({ force: true });
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .eq(1)
        .click({ force: true })
        .type(testData.howWillYouAttendProgram)
        .type("{enter}");
    });
    cy.wait(2000);
  }

  howWillYouAttendProgramDropdown2() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(4).click({ force: true });
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .eq(1)
        .click({ force: true })
        .type(testData.howWillYouAttendProgram2)
        .type("{enter}");
    });
    cy.wait(2000);
  }

  programIWillBeAttendingDropdown() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(6).click({ force: true });
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .eq(2)
        .click({ force: true })
        .type(testData.programIWillBeAttendingDropdown)
        .type("{enter}");
    });
    cy.wait(2000);
  }

  programIWillBeAttendingDropdown2() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get(".form-group").eq(6).click({ force: true });
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .eq(2)
        .click({ force: true })
        .type(testData.programIWillBeAttendingDropdown2)
        .type("{enter}");
    });
    cy.wait(2000);
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
    cy.wait(2000);
  }

  studyEndDate() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get('#eyw0exi > [ref="element"] > .input-group > .input').type(
        testData.studyEndDate
      );
    });
    cy.wait(2000);
  }

  inputStudentNumber() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get("#ek8w4hn-studentNumber").type(testData.studentNumber);
    });
    cy.wait(2000);
  }

  inputStudentNumber2() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.get("#ek8w4hn-studentNumber").type(testData.studentNumber2);
    });
    cy.wait(2000);
  }

  incorrectStudentNumber() {
    return cy.get("#ek8w4hn-studentNumber");
  }

  incorrectStudentNumberText() {
    return cy.contains("Student number must have no more than 12 characters.");
  }

  programOfferingDropdown() {
    cy.fixture("draftApplicationData").then((testData) => {
      cy.xpath(
        "//div[@id='eb4inb']//div[@class='form-control ui fluid selection dropdown']"
      ).click({ force: true });
      cy.wait(1000);
      cy.get(".choices__input.choices__input--cloned")
        .eq(3)
        .click({ force: true })
        .type(testData.programOffering)
        .type("{enter}");
    });
    cy.wait(2000);
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
