import StudentCustomCommand from "../../custom-command/student/StudentCustomCommand";

describe("Login Page", () => {
  const studentCustomCommand = new StudentCustomCommand();

  const url = Cypress.env("studentURL");

  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that user able to login with a valid username and valid password.", () => {
    studentCustomCommand.loginStudent();
  });
});
