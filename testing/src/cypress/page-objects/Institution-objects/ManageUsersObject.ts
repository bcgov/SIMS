export default class ManageUsersObject {
  manageUsersButton() {
    return cy.contains("Manage Users");
  }

  manageUsersSummary() {
    return cy.contains("Manage Users");
  }

  editButtonFirstRow() {
    return cy.get("[data-cy='editUser']").eq(0);
  }

  editUserPermissions() {
    return cy.contains("Edit User Permissions");
  }

  cancelButton() {
    return cy.get("[data-cy='secondaryFooterButton']");
  }

  addUserNowButton() {
    return cy.get("[data-cy='primaryFooterButton']");
  }

  editUserNowButton() {
    return cy.get("[data-cy='primaryFooterButton']");
  }

  addNewUserButton() {
    return cy.get("[data-cy='addNewUser']");
  }

  addUserButton() {
    return cy.contains("Add User");
  }

  addNewUserModal() {
    return cy.get("[data-cy='addNewUserModal']");
  }

  isAdminRadioButton() {
    return cy.get("[data-cy='isAdmin']");
  }

  isLegalSigningAuthorityButton() {
    return cy.get("[data-cy='isLegalSigningAuthority]");
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
    return cy.get("[data-cy='searchBox']");
  }

  noRecordsFoundMessage() {
    return cy.contains("No records found.");
  }

  zeroUserContains() {
    return cy.contains("All Users(0)");
  }

  getUsersList() {
    return cy.get("[data-cy='usersList']").get("[role='row']");
  }

  inputUserIdOnAddUserModal() {
    return cy.get("[data-cy='inputUserId']");
  }

  assignLocationToUserText() {
    return cy.get("[data-cy='assignLocationToUser']");
  }

  locationsFromAddUserModal() {
    return cy.get("[data-cy='location']");
  }

  clickOnEdit(userEmail: string) {
    cy.get("[data-cy='usersList']")
      .get("[role='cell']")
      .contains(userEmail)
      .parent()
      .get("[data-cy='editUser']")
      .click();
  }

  editUserModal() {
    return cy.get("[data-cy='editUserModal']");
  }

  userLocationAccess() {
    return cy
      .get("[data-cy='userAccess']")
      .should("have.attr", "value", "user");
  }

  userLocationNoAccess() {
    return cy
      .get("[data-cy='userAccess']")
      .should("have.attr", "value", "none");
  }
}
