export default class BaseMethods {
  getElementByCyId(cyId: string) {
    return cy.get(`[data-cy='${cyId}']`);
  }
}
