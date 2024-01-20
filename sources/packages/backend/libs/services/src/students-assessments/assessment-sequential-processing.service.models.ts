export interface SequentialApplication {
  applicationNumber: string;
  applicationCurrentId: number;
  applicationCurrentStatus: number;
  referenceAssessmentDate: Date;
  currentAssessmentOfferingId: number;
}

export class SequencedApplications {
  private readonly _previous: SequentialApplication[] = [];
  private readonly _current: SequentialApplication;
  private readonly _future: SequentialApplication[] = [];
  constructor(
    referenceApplicationNumber: string,
    applications: SequentialApplication[],
  ) {
    const referenceIndex = applications.findIndex(
      (application) =>
        application.applicationNumber === referenceApplicationNumber,
    );
    if (referenceIndex < 0) {
      throw new Error(
        `Reference application number ${referenceApplicationNumber} is not part of sequenced applications.`,
      );
    }
    this._current = applications[referenceIndex];
    for (let i = 0; i < applications.length; i++) {
      const application = applications[i];
      if (i < referenceIndex) {
        this._previous.push(application);
      } else if (i > referenceIndex) {
        this._future.push(application);
      }
    }
  }
  get previous(): ReadonlyArray<SequentialApplication> {
    return this.previous;
  }
  get current(): SequentialApplication {
    return this._current;
  }
  get future(): ReadonlyArray<SequentialApplication> {
    return this._future;
  }
}
