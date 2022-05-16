export default class MinistryUserViewsInstitution {
  waitForSec() {
    return cy.focused();
  }

  operatingNameVerify() {
    return cy.contains("Operating Name");
  }

  operatingNameInputText() {
    return cy.get("input[name='operatingName']");
  }

  searchButton() {
    return cy.get(".v-col.v-col-auto.mt-9");
  }

  legalNameInputText() {
    return cy.get("input[name='legalName']");
  }

  noInstitutionsFound() {
    return cy.contains("No Institutions found");
  }

  // legalNameVerifyColumn() {
  //   return cy.get(".p-datatable-thead > tr > :nth-child(1)");
  // }

  legalNameVerifyColumn() {
    return cy.get(":nth-child(1) > .p-inputtext");
  }

  operatingNameVerifyColumn() {
    return cy.get(":nth-child(2) > .p-inputtext");
  }

  profileTextVerify() {
    return cy.contains("Profile");
  }

  viewButtonFirstRowInstitution() {
    return cy.xpath("//tbody/tr[1]/td[4]");
  }

  programsSection() {
    return cy.contains("Programs");
  }

  programSectionVerifyText() {
    return cy.contains("All Programs");
  }

  viewButtonFirstRowPrograms() {
    return cy.xpath("//tbody/tr[1]/td[6]");
  }

  studyPeriodOfferings() {
    return cy.contains("Study period offerings");
  }

  viewProgramButton() {
    return cy.contains("View Program");
  }

  createNewProgramText() {
    return cy.contains("Create new program");
  }

  submitButtonProgram() {
    return cy.get("button[name='data[submit]']");
  }

  backButtonViewProgram() {
    return cy.get(".mdi-arrow-left");
  }

  backButtonBackAllPrograms() {
    return cy.get("svg[data-icon='arrow-left']");
  }

  locationsSection() {
    return cy.contains("Locations");
  }

  locationSectionVerify() {
    return cy.contains("All Locations");
  }

  usersSection() {
    return cy.contains("Users");
  }

  allUsers() {
    return cy.contains("All Users");
  }

  searchInputText() {
    return cy.get("input[placeholder='Search User']");
  }

  searchButtonUsers() {
    return cy.xpath("//div[@class='float-right']//button[@type='button']");
  }

  designationSection() {
    return cy.contains("Designation");
  }

  designationAgreements() {
    return cy.contains("Designation agreements");
  }

  firstRowViewButtonDesignation() {
    return cy.xpath("//tbody/tr[1]/td[5]");
  }

  designationDetailsText() {
    return cy.contains("Designation details");
  }

  backAllProgramsButton() {
    return cy.xpath(
      "//a[normalize-space()='Back all programs']//*[name()='svg']"
    );
  }
  legalOperatingNameText() {
    return cy.contains("Legal operating name");
  }

  backManageDesignationsButton() {
    return cy.xpath(
      "//a[normalize-space()='Manage designations']//*[name()='svg']"
    );
  }
}
