import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"
import LoginObject from "../../page-objects/student-objects/LoginObject"
import ApplicationObject from "../../page-objects/student-objects/ApplicationObject"

describe("Application Page", () => {

    const welcomeObject = new WelcomeObject()
    const loginObject = new LoginObject()
    const applicationObject = new ApplicationObject()

    const username = Cypress.env('cardSerialNumber')
    const password = Cypress.env('passcode')

    before("Login", () => {
        cy.visit("/")
        cy.wait(2000)
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.cardSerialNumberContinueButton()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.passcodeContinueButton()
        loginObject.verifyLoggedInText()
    })

    it("Verify that user able to redirect to Application Page", () => {
        applicationObject.applicationButton()
        applicationObject.verifyApplicationText()
    })

    it("Verify that Start New Application button must be present on the page & clickable", () => {
        applicationObject.startNewApplicationButton()
        applicationObject.verifyStartNewApplicationText()
        cy.go('back')
    })

    it("Verify that Start Application button must be disable if study year not selected in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.startNewApplicationButton()
        applicationObject.startApplicationStudyYearDisableButton()
    })

    it("Verify that Start Application button must be enable if study year selected in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.startNewApplicationButton()
        applicationObject.startApplicationStudyYearDisableButton()
        applicationObject.selectStudyYearDropdown()
        applicationObject.startApplicationStudyYearEnableButton()
    })

    it("Verify that Start Application button must be disable if selected study year is removed in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.startNewApplicationButton()
        applicationObject.selectStudyYearDropdown()
        applicationObject.startApplicationStudyYearEnableButton()
        applicationObject.removedButton()
        applicationObject.startApplicationStudyYearDisableButton()
    })

    it("Verify that Start Application button must be clickable in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.startNewApplicationButton()
        applicationObject.startApplicationStudyYearDisableButton()
        applicationObject.selectStudyYearDropdown()
        applicationObject.startApplicationStudyYearEnableButton()

        //Info:- On click -> Alert in progress popup open
        applicationObject.startApplicationTuitionWaiverButton()
        applicationObject.applicationAlreadyInProgressText()

        applicationObject.startApplicationBCloanForgivenessProgramButton()
        applicationObject.applicationAlreadyInProgressText()

        applicationObject.startApplicationPacificLeaderLoanForgivenessButton()
        applicationObject.applicationAlreadyInProgressText()

        applicationObject.startApplicationInterestFreeStatusButton()
        applicationObject.applicationAlreadyInProgressText()

    })

    it("By clicking on edit button it redirects to Welcome Page in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
    })

    it("By clicking on Next Section button from Welcome Page it redirects to Program Page in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
    })

    it("Check without selecting any mandatory fields in Program section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
        applicationObject.NextSectionButton()
        applicationObject.errorMsgTxtForSchoolAttending()
    })

    it("Verify that user must be redirect to previous form by selecting Previous section button in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
        applicationObject.WelcomeButton()
        applicationObject.NextSectionButton()
        applicationObject.PreviousSectionButton()
        applicationObject.WelcomeText()
    })

    it("Verify that user able to check the checkbox in Program section in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
        applicationObject.mySchoolIsNotListedCheckbox()
        applicationObject.checkboxAlertMessage()
    })

    it("Verify that user able to uncheck the checkbox in Program section in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
        applicationObject.mySchoolIsNotListedCheckbox()
        applicationObject.uncheckAlertMessage()
        applicationObject.checkboxAlertMessageNotExist()
    })

    it("Verify that user able to edit all details in Program page in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
        applicationObject.schoolIWillBeAttendingDropdown()
        applicationObject.howWillYouAttendProgramDropdown()
        applicationObject.inputStudentNumber()
    })

    it("Verify that Student number must have no more than 12 characters in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
        applicationObject.incorrectStudentNumber()
    })

    it("Verify that user enter data in mandatory fields to save program in application form.", () => {
        applicationObject.applicationButton()
        applicationObject.draftApplication()
        applicationObject.NextSectionButton()
        applicationObject.schoolIWillBeAttendingDropdown2()
        applicationObject.howWillYouAttendProgramDropdown2()
        applicationObject.programIWillBeAttendingDropdown2()
        applicationObject.inputStudentNumber2()
    })

})