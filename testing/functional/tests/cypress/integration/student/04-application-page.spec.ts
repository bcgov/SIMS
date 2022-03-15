import Welcome from "../../page-objects/student-objects/01-welcome-object"
import Login from "../../page-objects/student-objects/02-login-object"
import Application from "../../page-objects/student-objects/04-application-object"

describe("Application Page", () => {

    const WelcomeObject = new Welcome()
    const LoginObject = new Login()
    const ApplicationObject = new Application()

    before("Login", () => {
        cy.visit("/")
        cy.wait(2000)
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.passcodeInputTxt().type(testdata.validPasscode).should('have.value', testdata.validPasscode)
            LoginObject.passcodeContinurBtn()
            LoginObject.verifyLoggedInTxt()
        })
    })

    it("Verify that user able to redirect to Application Page", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.verifyApplicationTxt()
    })

    it("Verify that Start New Application button must be present on the page & clickable", () => {
        ApplicationObject.startNewApplicationBtn()
        ApplicationObject.verifyStartNewApplicationTxt()
        cy.go('back')
    })

    it("Verify that Start Application button must be disable if study year not selected in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.startNewApplicationBtn()
        ApplicationObject.startApplicationStudyYearDisableBtn()
    })

    it("Verify that Start Application button must be enable if study year selected in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.startNewApplicationBtn()
        ApplicationObject.startApplicationStudyYearDisableBtn()
        ApplicationObject.selectStudyYearDropdownValue()
        ApplicationObject.startApplicationStudyYearEnableBtn()
    })

    it("Verify that Start Application button must be disable if selected study year is removed in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.startNewApplicationBtn()
        ApplicationObject.selectStudyYearDropdownValue()
        ApplicationObject.startApplicationStudyYearEnableBtn()
        ApplicationObject.removedBtn()
        ApplicationObject.startApplicationStudyYearDisableBtn()
    })

    it("Verify that Start Application button must be clickable in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.startNewApplicationBtn()
        ApplicationObject.startApplicationStudyYearDisableBtn()
        ApplicationObject.selectStudyYearDropdownValue()
        ApplicationObject.startApplicationStudyYearEnableBtn()

        //On click -> Alert in progress popup open
        ApplicationObject.startApplicationTuitionWaiverBtn()
        ApplicationObject.applicationAlreadyInProgressTxt()

        ApplicationObject.startApplicationBCloanForgivenessProgramBtn()
        ApplicationObject.applicationAlreadyInProgressTxt()

        ApplicationObject.startApplicationPacificLeaderLoanForgivenessBtn()
        ApplicationObject.applicationAlreadyInProgressTxt()

        ApplicationObject.startApplicationInterestFreeStatusBtn()
        ApplicationObject.applicationAlreadyInProgressTxt()

    })

    it("By clicking on edit button it redirects to Welcome Page in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
    })

    it("By clicking on Next Section button from Welcome Page it redirects to Program Page in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
    })

    it("Check without selecting any mandatory fields in Program section if the user clicks Next Section button then the alert message is displayed or not in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.errorMsgTxtForSchoolAttending()
    })

    it("Verify that user must be redirect to previous form by selecting Previous section button in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.WelcomeBtn()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.PreviousSectionBtn()
        ApplicationObject.WelcomeTxt()
    })
    
    it("Verify that user able to check the checkbox in Program section in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.mySchoolIsNotListedCheckbox()
        ApplicationObject.checkboxAlertMsg()
    })

    it("Verify that user able to uncheck the checkbox in Program section in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.mySchoolIsNotListedCheckbox()
        ApplicationObject.uncheckAlertMsg()
        ApplicationObject.checkboxAlertMsgNotExist()
    })

    it("Verify that user able to edit all details in Program page in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.schoolIWillBeAttendingDropdownValue()
        ApplicationObject.howWillYouAttendProgramDropdownValue()
        ApplicationObject.programIWIllBeAttendingDropdownValue()
        ApplicationObject.myStudyPeriodIsNotListedCheckbox()
        ApplicationObject.studyStartDate()
        ApplicationObject.studyEndDate()
        ApplicationObject.inputStudentNumber()
    })

    it("Verify that Student number must have no more than 12 characters in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.incorrectStudentNumber()
    })

    it("Verify that user enter data in mandatory fields to save program in application form.", () => {
        ApplicationObject.applicationBtn()
        ApplicationObject.draftApplication()
        ApplicationObject.NextSectionBtn()
        ApplicationObject.schoolIWillBeAttendingDropdownValue2()
        ApplicationObject.howWillYouAttendProgramDropdownValue2()
        ApplicationObject.programIWIllBeAttendingDropdownValue2()
        ApplicationObject.programOfferingDropdownValue()
        ApplicationObject.inputStudentNumber2()
        ApplicationObject.NextSectionBtn()
    })

})