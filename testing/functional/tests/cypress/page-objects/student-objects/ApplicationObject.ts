export default class ApplicationObject {

    clickOnDraftStatus() {
        cy.get('//tbody/tr/td[5]').each(($el, index, $list) => {

            if ($el.text() === 'Draft') {
                $el.click()
            }
        })
    }

    applicationButton() {
        return cy.xpath("//button[normalize-space()='Applications']").should('be.visible').click()
    }

    verifyApplicationText() {
        return cy.contains('My Applications').should('be.visible')
    }

    startNewApplicationButton() {
        return cy.contains('Start New Application').should('be.visible').click()
    }

    //<StartRegion----------------------------Start New Application------------------------------>
    verifyStartNewApplicationText() {
        return cy.contains('Select an application to begin').should('be.visible')
    }

    startApplicationStudyYearDisableButton() {
        return cy.xpath("//button[@disabled='disabled']").should('be.visible')
    }

    selectStudyYearDropdown() {
        cy.fixture('newApplicationForm').then((testData) => {
            cy.get('.form-group').eq(1).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testData.selectStudyYear).type('{enter}')
        })
        cy.wait(2000)
    }

    startApplicationStudyYearEnableButton() {
        return cy.xpath("//button[@disabled='disabled']").should('not.exist')
    }

    removedButton() {
        return cy.xpath("//button[normalize-space()='Remove item']").click()
    }

    //Alert message in "Already In Progress" 
    applicationAlreadyInProgressText() {
        cy.contains('Application already in progress').should('be.visible')
        cy.get('.v-card-actions > .v-btn').click()
    }

    //Start Application 
    startApplicationTuitionWaiverButton() {
        return cy.xpath("//button[@name='data[startApplication1]']").click()
    }
    startApplicationBCloanForgivenessProgramButton() {
        return cy.xpath("//button[@name='data[startApplication2]']").click()
    }
    startApplicationPacificLeaderLoanForgivenessButton() {
        return cy.xpath("//button[@name='data[startApplication4]']").click()
    }
    startApplicationInterestFreeStatusButton() {
        return cy.xpath("//button[@name='data[startApplication3]']").click()
    }

    //<EndRegion----------------------------Start New Application------------------------------>

    //<StartRegion--------------------------Draft Status------------------------------------->

    draftApplication() {
        cy.wait(2000)
        cy.xpath("(//button[@type='button'])[8]").click()
        cy.contains('Let’s get started on your application').should('be.visible')
    }

    NextSectionButton() {
        cy.wait(1000)
        cy.contains('Next section').click()
    }

    PreviousSectionButton() {
        cy.wait(1000)
        cy.contains('Previous section').click()
    }

    errorMsgTxtForSchoolAttending() {
        cy.wait(1000)
        cy.contains('The school I will be attending is required').should('be.visible')
        cy.get('.form-control.ui.fluid.selection.dropdown.is-invalid').should('be.visible')
    }

    WelcomeText() {
        return cy.contains('Let’s get started on your application').should('be.visible')
    }

    WelcomeButton() {
        //Welcome Btn
        cy.get(':nth-child(1) > .page-link').click()
    }

    mySchoolIsNotListedCheckbox() {
        cy.xpath("//input[@type='checkbox']").check()
    }

    checkboxAlertMessage() {
        cy.contains("Your institution may not be designated by StudentAid BC").should('be.visible')
        cy.wait(1000)
    }

    uncheckAlertMessage() {
        cy.contains("My school isn't listed").click()
        cy.wait(1000)
    }

    checkboxAlertMessageNotExist() {
        cy.contains("Your institution may not be designated by StudentAid BC").should('not.exist')
        cy.wait(1000)
    }

    schoolIWillBeAttendingDropdown() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('.form-group').eq(1).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testData.schoolIWillBeAttending).type('{enter}')
        })
        cy.wait(2000)
    }

    schoolIWillBeAttendingDropdown2() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('.form-group').eq(1).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testData.schoolIWillBeAttending2).type('{enter}')
        })
        cy.wait(2000)
    }

    howWillYouAttendProgramDropdown() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('.form-group').eq(4).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(1).click({ force: true }).type(testData.howWillYouAttendProgram).type('{enter}')
        })
        cy.wait(2000)
    }

    howWillYouAttendProgramDropdown2() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('.form-group').eq(4).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(1).click({ force: true }).type(testData.howWillYouAttendProgram2).type('{enter}')
        })
        cy.wait(2000)
    }

    programIWillBeAttendingDropdown() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('.form-group').eq(6).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(2).click({ force: true }).type(testData.programIWillBeAttendingDropdown).type('{enter}')
        })
        cy.wait(2000)
    }

    programIWillBeAttendingDropdown2() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('.form-group').eq(6).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(2).click({ force: true }).type(testData.programIWillBeAttendingDropdown2).type('{enter}')
        })
        cy.wait(2000)
    }

    myStudyPeriodIsNotListedCheckbox() {
        cy.get('#eoslne6-offeringnotListed').check()
    }

    studyStartDate() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('#eqnahab > [ref="element"] > .input-group > .input').type(testData.studyStartDate)
        })
        cy.wait(2000)
    }

    studyEndDate() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('#eyw0exi > [ref="element"] > .input-group > .input').type(testData.studyEndDate)
        })
        cy.wait(2000)
    }

    inputStudentNumber() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('#ek8w4hn-studentNumber').type(testData.studentNumber)
        })
        cy.wait(2000)
    }

    inputStudentNumber2() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('#ek8w4hn-studentNumber').type(testData.studentNumber2)
        })
        cy.wait(2000)
    }

    incorrectStudentNumber() {
        cy.get('#ek8w4hn-studentNumber').type("SDPLETW3543543FSFSD")
        cy.contains("Student number must have no more than 12 characters.").should('be.visible')
    }

    programOfferingDropdown() {
        cy.fixture('draftApplicationData').then((testData) => {
            cy.xpath("//div[@id='eb4inb']//div[@class='form-control ui fluid selection dropdown']").click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(3).click({ force: true }).type(testData.programOffering).type('{enter}')
        })
        cy.wait(2000)
    }
    //<EndRegion--------------------------Draft Status------------------------------------->

    ProgramPageText() {
        //Dropdown selection
        cy.fixture('draftApplicationData').then((testData) => {
            cy.get('.fa').eq(0).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testData.searchForYourSchool).type('{enter}')
        })
    }

}
