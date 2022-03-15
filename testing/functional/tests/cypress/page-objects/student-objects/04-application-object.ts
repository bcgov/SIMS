import cypress from "cypress"

class application {

    clickOnDraftStatus() {
        cy.get('//tbody/tr/td[5]').each(($el, index, $list) => {

            if ($el.text() === 'Draft') {
                $el.click()
            }
        })
    }

    applicationBtn() {
        return cy.xpath("//button[normalize-space()='Applications']").should('be.visible').click()
    }

    verifyApplicationTxt() {
        return cy.contains('My Applications').should('be.visible')
    }

    startNewApplicationBtn() {
        return cy.contains('Start New Application').should('be.visible').click()
    }

    //<StartRegion----------------------------Start New Application------------------------------>
    verifyStartNewApplicationTxt() {
        return cy.contains('Select an application to begin').should('be.visible')
    }

    startApplicationStudyYearDisableBtn() {
        return cy.xpath("//button[@disabled='disabled']").should('be.visible')
    }

    selectStudyYearDropdownValue() {
        cy.fixture('newApplicationForm').then((testdata) => {
            cy.get('.form-group').eq(1).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testdata.selectStudyYear).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    startApplicationStudyYearEnableBtn() {
        return cy.xpath("//button[@disabled='disabled']").should('not.exist')
    }

    removedBtn() {
        return cy.xpath("//button[normalize-space()='Remove item']").click()
    }

    //Alert message in "Already In Progress" 
    applicationAlreadyInProgressTxt() {
        cy.contains('Application already in progress').should('be.visible')
        cy.get('.v-card-actions > .v-btn').click()
        return
    }

    //Start Application 
    startApplicationTuitionWaiverBtn() {
        return cy.xpath("//button[@name='data[startApplication1]']").click()
    }
    startApplicationBCloanForgivenessProgramBtn() {
        return cy.xpath("//button[@name='data[startApplication2]']").click()
    }
    startApplicationPacificLeaderLoanForgivenessBtn() {
        return cy.xpath("//button[@name='data[startApplication4]']").click()
    }
    startApplicationInterestFreeStatusBtn() {
        return cy.xpath("//button[@name='data[startApplication3]']").click()
    }

    //<EndRegion----------------------------Start New Application------------------------------>

    //<StartRegion--------------------------Draft Status------------------------------------->

    draftApplication() {
        cy.wait(2000)
        cy.xpath("(//button[@type='button'])[8]").click()
        cy.contains('Let’s get started on your application').should('be.visible')
        return
    }

    NextSectionBtn() {
        cy.wait(1000)
        cy.contains('Next section').click()
        return
    }

    PreviousSectionBtn() {
        cy.wait(1000)
        cy.contains('Previous section').click()
        return
    }

    errorMsgTxtForSchoolAttending() {
        cy.wait(1000)
        cy.contains('The school I will be attending is required').should('be.visible')
        cy.get('.form-control.ui.fluid.selection.dropdown.is-invalid').should('be.visible')
    }

    WelcomeTxt() {
        return cy.contains('Let’s get started on your application').should('be.visible')
    }

    WelcomeBtn() {
        //Welcome Btn
        cy.get(':nth-child(1) > .page-link').click()
    }

    mySchoolIsNotListedCheckbox() {
        cy.xpath("//input[@type='checkbox']").check()
    }

    checkboxAlertMsg() {
        cy.contains("Your institution may not be designated by StudentAid BC").should('be.visible')
        cy.wait(1000)
    }

    uncheckAlertMsg() {
        cy.contains("My school isn't listed").click()
        cy.wait(1000)
    }

    checkboxAlertMsgNotExist() {
        cy.contains("Your institution may not be designated by StudentAid BC").should('not.exist')
        cy.wait(1000)
    }

    schoolIWillBeAttendingDropdownValue() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('.form-group').eq(1).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testdata.schoolIWillBeAttending).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    schoolIWillBeAttendingDropdownValue2() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('.form-group').eq(1).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testdata.schoolIWillBeAttending2).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    howWillYouAttendProgramDropdownValue() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('.form-group').eq(4).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(1).click({ force: true }).type(testdata.howWillYouAttendProgram).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    howWillYouAttendProgramDropdownValue2() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('.form-group').eq(4).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(1).click({ force: true }).type(testdata.howWillYouAttendProgram2).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    programIWIllBeAttendingDropdownValue() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('.form-group').eq(6).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(2).click({ force: true }).type(testdata.programIWIllBeAttendingDropdownValue).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    programIWIllBeAttendingDropdownValue2() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('.form-group').eq(6).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(2).click({ force: true }).type(testdata.programIWIllBeAttendingDropdownValue2).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    myStudyPeriodIsNotListedCheckbox() {
        cy.get('#eoslne6-offeringnotListed').check()
    }

    studyStartDate() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('#eqnahab > [ref="element"] > .input-group > .input').type(testdata.studyStartDate)
        })
        cy.wait(2000)
        return
    }

    studyEndDate() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('#eyw0exi > [ref="element"] > .input-group > .input').type(testdata.studyEndDate)
        })
        cy.wait(2000)
        return
    }

    inputStudentNumber() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('#ek8w4hn-studentNumber').type(testdata.studentNumber)
        })
        cy.wait(2000)
        return
    }

    inputStudentNumber2() {
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('#ek8w4hn-studentNumber').type(testdata.studentNumber2)
        })
        cy.wait(2000)
        return
    }

    incorrectStudentNumber(){
        cy.get('#ek8w4hn-studentNumber').type("SDPLETW3543543FSFSD")
        cy.contains("Student number must have no more than 12 characters.").should('be.visible')
    }

    programOfferingDropdownValue(){
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.xpath("//div[@id='eb4inb']//div[@class='form-control ui fluid selection dropdown']").click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").eq(3).click({ force: true }).type(testdata.programOffering).type('{enter}')
        })
        cy.wait(2000)
        return
    }

    //


    //Working....
    ProgramPageTxt() {
        //Dropdown selection
        cy.fixture('draftApplicationData').then((testdata) => {
            cy.get('.fa').eq(0).click({ force: true })
            cy.wait(1000)
            cy.get(".choices__input.choices__input--cloned").click({ force: true }).type(testdata.searchForYourSchool).type('{enter}')
            return
        })
        return
    }

}

export default application