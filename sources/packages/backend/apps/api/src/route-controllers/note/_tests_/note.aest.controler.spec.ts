require("../../../../../../env_setup");
import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "@sims/integrations/services";
import { createMockedZeebeModule } from "../../../testHelpers/mocked-providers/zeebe-client-mock";
import { AppModule } from "../../../app.module";
import { NoteAESTController } from "../note.aest.controller";
import { JwtStrategy } from "../../../auth/jwt.strategy";

describe("NoteAESTController", () => {
  let noteAESTController: NoteAESTController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [createMockedZeebeModule(), AppModule],
    })
      .overrideProvider(JwtStrategy)
      .useValue({})
      .compile();
    noteAESTController = module.get(NoteAESTController);
  });

  it("Should throw NotFoundException when student is not found", async () => {
    // Arrange
    const studentService = module.get(StudentService);
    studentService.getStudentById = jest.fn(async () => Promise.resolve(null));
    // Act/Assert
    await expect(noteAESTController.getStudentNotes(1)).rejects.toThrow(
      NotFoundException,
    );
  });
});
