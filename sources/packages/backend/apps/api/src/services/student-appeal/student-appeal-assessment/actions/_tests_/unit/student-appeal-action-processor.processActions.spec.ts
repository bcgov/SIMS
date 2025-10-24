import { Mocked, TestBed } from "@suites/unit";
import {
  StudentAppealActionsProcessor,
  StudentAppealCreateAssessmentAction,
  StudentAppealUpdateModifiedIndependentAction,
} from "../../..";
import {
  StudentAppeal,
  StudentAppealActionType,
  StudentAppealRequest,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";

describe("StudentAppealActionsProcessor-processActions", () => {
  let studentAppealActionsProcessor: StudentAppealActionsProcessor;
  let createAssessmentAction: Mocked<StudentAppealCreateAssessmentAction>;
  let updateModifiedIndependentAction: Mocked<StudentAppealUpdateModifiedIndependentAction>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(
      StudentAppealActionsProcessor,
    ).compile();
    studentAppealActionsProcessor = unit;
    createAssessmentAction = unitRef.get(StudentAppealCreateAssessmentAction);
    updateModifiedIndependentAction = unitRef.get(
      StudentAppealUpdateModifiedIndependentAction,
    );
    // Allow setting the action types directly to avoid spying on getters
    // that would not work as expected for protected properties.
    // Required to match the types defined by the DEFAULT_ACTION_TYPE.
    (createAssessmentAction as object)["actionType"] =
      StudentAppealActionType.CreateStudentAppealAssessment;
    (updateModifiedIndependentAction as object)["actionType"] =
      StudentAppealActionType.UpdateModifiedIndependent;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should execute multiple actions and pass the parameters as expected when multiple requests with different actions are part of the same appeal.", async () => {
    // Arrange
    const auditUserId = 123;
    const auditDate = new Date();
    const entityManager = {} as EntityManager;
    const studentAppeal = new StudentAppeal();
    studentAppeal.appealRequests = [
      {
        submittedData: {
          actions: [createAssessmentAction.actionType],
        },
      } as StudentAppealRequest,
      {
        submittedData: {
          actions: [updateModifiedIndependentAction.actionType],
        },
      } as StudentAppealRequest,
    ];
    // Act
    await studentAppealActionsProcessor.processActions(
      studentAppeal,
      auditUserId,
      auditDate,
      entityManager,
    );

    // Assert
    expect(createAssessmentAction.process).toHaveBeenCalledTimes(1);
    expect(createAssessmentAction.process).toHaveBeenCalledWith(
      studentAppeal,
      auditUserId,
      auditDate,
      entityManager,
    );
    expect(updateModifiedIndependentAction.process).toHaveBeenCalledTimes(1);
    expect(updateModifiedIndependentAction.process).toHaveBeenCalledWith(
      studentAppeal,
      auditUserId,
      auditDate,
      entityManager,
    );
  });

  it("Should execute actions uniquely when multiple requests with the same actions are part of the same appeal.", async () => {
    // Arrange
    const studentAppeal = new StudentAppeal();
    studentAppeal.appealRequests = [
      {
        submittedData: {
          actions: [createAssessmentAction.actionType],
        },
      } as StudentAppealRequest,
      {
        submittedData: {
          actions: [createAssessmentAction.actionType],
        },
      } as StudentAppealRequest,
    ];

    // Act
    await studentAppealActionsProcessor.processActions(
      studentAppeal,
      1,
      new Date(),
      null,
    );

    // Assert
    expect(createAssessmentAction.process).toHaveBeenCalledTimes(1);
    expect(updateModifiedIndependentAction.process).toHaveBeenCalledTimes(0);
  });

  it("Should throw an error when the appeal request has an unknown action.", async () => {
    // Arrange
    const studentAppeal = new StudentAppeal();
    studentAppeal.id = 456;
    (studentAppeal as object)["appealRequests"] = [
      {
        submittedData: { actions: ["UnknownActionType"] },
      },
    ];

    // Act/Assert
    await expect(
      studentAppealActionsProcessor.processActions(
        studentAppeal,
        1,
        new Date(),
        null,
      ),
    ).rejects.toThrow(
      `One or more action types associated with the student appeal ID 456 are not recognized: UnknownActionType.`,
    );
  });

  it("Should execute the default action when an appeal request has no actions defined.", async () => {
    // Arrange
    const studentAppeal = new StudentAppeal();
    studentAppeal.appealRequests = [
      {
        // No actions property provided, should fall back to DEFAULT_ACTION_TYPE.
        submittedData: {},
      } as StudentAppealRequest,
    ];

    // Act
    await studentAppealActionsProcessor.processActions(
      studentAppeal,
      123,
      new Date(),
      null,
    );

    // Assert
    expect(createAssessmentAction.process).toHaveBeenCalledTimes(1);
    expect(updateModifiedIndependentAction.process).toHaveBeenCalledTimes(0);
  });
});
