export default class ManageUsersObject {
  manageUsersButton() {
    return cy.contains("Manage Users");
  }

  userSummaryMessage() {
    return cy.contains("User Summary");
  }

  editButtonFirstRow() {
    return cy.get("[data-icon='pen']").eq(0);
  }

  editUserPermissions() {
    return cy.contains("Edit User Permissions");
  }

  cancelButton() {
    return cy.contains("Cancel");
  }

  addNewUserButton() {
    return cy.contains("Add New User");
  }

  addUserButton() {
    return cy.contains("Add User");
  }

  addUserToAccountMessage() {
    return cy.contains("Add User to Account");
  }

  selectUserDropdown() {
    return cy.contains("Select a User");
  }

  filterInputName() {
    return cy.get(".p-dropdown-filter");
  }

  searchUserInputText() {
    return cy.get(".float-right > .p-inputtext");
  }

  searchButton() {
    return cy.get(".v-btn--tile");
  }

  noRecordsFoundMessage() {
    return cy.contains("No records found.");
  }

  zeroUserContains() {
    return cy.contains("All Users(0)");
  }
}
