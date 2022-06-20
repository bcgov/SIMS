export default class InstitutionNoteRestrictionsObject {
  categoryErrorMessage() {
    return cy.contains("Category is required");
  }

  reasonErrorMessage() {
    return cy.contains("Reason is required");
  }

  addRestrictionsButton() {
    return cy.contains("Add restriction");
  }

  addNewRestrictionsText() {
    return cy.contains("Add new restriction");
  }

  emptyDropdownMessage() {
    return cy.contains("No choices to choose from");
  }

  addRestrictionsDialogBox() {
    return cy.xpath("//button[normalize-space()='Add Restriction']");
  }

  allRestrictions() {
    return cy.contains("All Restrictions");
  }

  addRestrictionButtonDialogBox() {
    return cy.xpath("//button[normalize-space()='Add Restriction']");
  }

  cancelButton() {
    return cy.contains("Cancel");
  }

  restrictionsAddedText() {
    return cy.contains("Restriction Added");
  }

  clearButton() {
    return cy.get(".choices__button");
  }

  categoryButton() {
    return cy.contains("Category");
  }

  notesInputText() {
    return cy.get("textarea[name='data[noteDescription]']");
  }

  reasonAssertion(reason: string) {
    return cy.contains(reason);
  }

  resolveRestrictionsButton() {
    return cy.contains("Resolve Restriction");
  }

  firstRowButtonRestrictions() {
    return cy.xpath("//tbody/tr[1]/td[6]");
  }

  categoryAssertion(category: string) {
    return cy.contains(category);
  }

  restrictionsResolvedAssertion() {
    return cy.contains("Restriction Resolved");
  }

  notesSectionButton() {
    return cy.contains("Notes");
  }

  resolutionNoteRequired() {
    return cy.contains("Resolution Notes is required");
  }

  resolutionNotesInputText() {
    return cy.get("textarea[name='data[resolutionNote]']");
  }

  addNoteButton() {
    return cy.contains("Add note");
  }

  createNewNoteButton() {
    return cy.contains("Create new note");
  }

  noteBodyInputText() {
    return cy.get("textarea[name='data[description]']");
  }

  noteBodyErrorMessage() {
    return cy.contains("Note Body is required");
  }

  noteTypeErrorMessage() {
    return cy.contains("Note Type is required");
  }

  noteAddedSuccessfully() {
    return cy.contains("Note added successfully");
  }

  noteBodyAssertion(body: string) {
    return cy.contains(body);
  }

  noteTypeAssertion(type: string) {
    return cy.contains(type);
  }

  systemActionsTabButton() {
    return cy.get(".text-center > .float-right > :nth-child(4)");
  }

  restrictionsTabButton() {
    return cy.get(".text-center > .float-right > :nth-child(3)");
  }

  generalTabButton() {
    return cy.get(".text-center > .float-right > :nth-child(2)");
  }

  noteDropdown() {
    return cy.xpath("//div[@role='combobox']");
  }

  noteValue() {
    return cy.xpath("//input[@role='textbox']");
  }

  restrictionsDropdownReason() {
    return cy.xpath("//div[@id='etm8wyi']//div[@role='combobox']");
  }

  restrictionsValueReason() {
    return cy.xpath("//div[@id='etm8wyi']//input[@role='textbox']");
  }

  restrictionsDropdownCategory() {
    return cy.xpath("//div[@id='ew2twj7']//div[@role='combobox']");
  }

  restrictionsValueCategory() {
    return cy.xpath("//div[@id='ew2twj7']//input[@role='textbox']");
  }
}
