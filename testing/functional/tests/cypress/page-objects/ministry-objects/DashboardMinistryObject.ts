export default class DashboardMinistryObject {
  dashboardText() {
    return cy.contains("Welcome to StudentAid BC");
  }

  searchStudentsText() {
    return cy.contains("Search Students");
  }

  searchInstitutionsText() {
    return cy.contains("Search Institutions");
  }

  pendingDesignationsText() {
    return cy.contains("Pending designations");
  }

  pendingDesignationSearchInput() {
    return cy.get(".float-right > .p-inputtext");
  }

  pendingDesignationSearchButton() {
    return cy.xpath("//div[@class='float-right']//button[@type='button']");
  }
}
