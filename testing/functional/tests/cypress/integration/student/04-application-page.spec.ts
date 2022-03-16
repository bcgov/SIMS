import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"
import LoginObject from "../../page-objects/student-objects/LoginObject"
import ApplicationObject from "../../page-objects/student-objects/ApplicationObject"

describe("Application Page", () => {

    const Welcome = new WelcomeObject()
    const Login = new LoginObject()
    const Application = new ApplicationObject()

    const username = Cypress.env('cardSerialNumber')
    const password = Cypress.env('passcode')

    before("Login", () => {
        cy.visit("/")
        cy.wait(2000)
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.cardSerialNumberContinuebtn()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.passcodeContinurBtn()
        Login.verifyLoggedInTxt()
    })

    it("Verify that user able to redirect to Application Page", () => {
        Application.applicationBtn()
        Application.verifyApplicationTxt()
    })

    it("Verify that Start New Application button must be present on the page & clickable", () => {
        Application.startNewApplicationBtn()
        Application.verifyStartNewApplicationTxt()
        cy.go('back')
    })

    it("Verify that Start Application button must be disable if study year not selected in application form.", () => {
        Application.applicationBtn()
        Application.startNewApplicationBtn()
        Application.startApplicationStudyYearDisableBtn()
    })

    it("Verify that Start Application button must be enable if study year selected in application form.", () => {
        Application.applicationBtn()
        Application.startNewApplicationBtn()
        Application.startApplicationStudyYearDisableBtn()
        Application.selectStudyYearDropdownValue()
        Application.startApplicationStudyYearEnableBtn()
    })

    it("Verify that Start Application button must be disable if selected study year is removed in application form.", () => {
        Application.applicationBtn()
        Application.startNewApplicationBtn()
        Application.selectStudyYearDropdownValue()
        Application.startApplicationStudyYearEnableBtn()
        Application.removedBtn()
        Application.startApplicationStudyYearDisableBtn()
    })

    it("Verify that Start Application button must be clickable in application form.", () => {
        Application.applicationBtn()
        Application.startNewApplicationBtn()
        Application.startApplicationStudyYearDisableBtn()
        Application.selectStudyYearDropdownValue()
        Application.startApplicationStudyYearEnableBtn()

        //Info:- On click -> Alert in progress popup open
        Application.startApplicationTuitionWaiverBtn()
        Application.applicationAlreadyInProgressTxt()

        Application.startApplicationBCloanForgivenessProgramBtn()
        Application.applicationAlreadyInProgressTxt()

        Application.startApplicationPacificLeaderLoanForgivenessBtn()
        Application.applicationAlreadyInProgressTxt()

        Application.startApplicationInterestFreeStatusBtn()
        Application.applicationAlreadyInProgressTxt()

    })

    it("By clicking on edit button it redirects to Welcome Page in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
    })

    it("By clicking on Next Section button from Welcome Page it redirects to Program Page in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
    })

    it("Check without selecting any mandatory fields in Program section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
        Application.NextSectionBtn()
        Application.errorMsgTxtForSchoolAttending()
    })

    it("Verify that user must be redirect to previous form by selecting Previous section button in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
        Application.WelcomeBtn()
        Application.NextSectionBtn()
        Application.PreviousSectionBtn()
        Application.WelcomeTxt()
    })

    it("Verify that user able to check the checkbox in Program section in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
        Application.mySchoolIsNotListedCheckbox()
        Application.checkboxAlertMsg()
    })

    it("Verify that user able to uncheck the checkbox in Program section in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
        Application.mySchoolIsNotListedCheckbox()
        Application.uncheckAlertMsg()
        Application.checkboxAlertMsgNotExist()
    })

    it("Verify that user able to edit all details in Program page in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
        Application.schoolIWillBeAttendingDropdownValue()
        Application.howWillYouAttendProgramDropdownValue()
        Application.programIWIllBeAttendingDropdownValue()
        Application.myStudyPeriodIsNotListedCheckbox()
        Application.studyStartDate()
        Application.studyEndDate()
        Application.inputStudentNumber()
    })

    it("Verify that Student number must have no more than 12 characters in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
        Application.incorrectStudentNumber()
    })

    it("Verify that user enter data in mandatory fields to save program in application form.", () => {
        Application.applicationBtn()
        Application.draftApplication()
        Application.NextSectionBtn()
        Application.schoolIWillBeAttendingDropdownValue2()
        Application.howWillYouAttendProgramDropdownValue2()
        Application.programIWIllBeAttendingDropdownValue2()
        Application.programOfferingDropdownValue()
        Application.inputStudentNumber2()
        Application.NextSectionBtn()
    })

})