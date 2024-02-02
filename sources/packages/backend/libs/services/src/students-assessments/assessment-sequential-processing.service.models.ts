/**
 * Application information part of a sequence of ordered applications.
 */
export interface SequentialApplication {
  /**
   * Application number. Can be shared across many applications if
   * there was multiple edits before the final calculation.
   */
  applicationNumber: string;
  /**
   * Current active application id.
   */
  applicationId: number;
  /**
   * Current active application status.
   */
  applicationStatus: number;
  /**
   * First assessment ever calculated for an application.
   * Potentially null if an application never had an assessment calculated.
   */
  referenceAssessmentDate?: Date;
  /**
   * Current offering id associated to the current assessment of the active application.
   * Potentially null when the current application is cancelled and a PIR (Program information Request)
   * is still in progress.
   */
  currentAssessmentOfferingId?: number;
}

/**
 * Represents the program year history of all meaningful applications that
 * could have consumed some award amounts room available for calculations
 * where one application can potentially impact the other.
 */
export class SequencedApplications {
  private readonly _previous: SequentialApplication[] = [];
  private readonly _current: SequentialApplication;
  private readonly _future: SequentialApplication[] = [];

  /**
   * Creates a new instance of the ordered applications for a program year.
   * @param referenceApplicationNumber reference application number that will
   * determine which applications are in the past or in the future.
   * @param applications list of ordered applications to be segregated into
   * future or previous applications in relation to the {@link referenceApplicationNumber}.
   */
  constructor(
    referenceApplicationNumber: string,
    applications: SequentialApplication[],
  ) {
    const referenceIndex = applications.findIndex(
      (application) =>
        application.applicationNumber === referenceApplicationNumber,
    );
    if (referenceIndex < 0) {
      // The reference application must be in the result list.
      throw new Error(
        `Reference application number ${referenceApplicationNumber} is not part of sequenced applications.`,
      );
    }
    this._current = applications[referenceIndex];
    if (!this.current.referenceAssessmentDate) {
      // If an assessment was never calculated, previous and future applications
      // should never be calculated because an order cannot be defined and
      // no impacts should be detected.
      return;
    }
    // Separates the applications into previous or future based on its
    // index since they are expected to be ordered.
    // The current application is still in the array and will be ignored
    // due based on the two if conditions present.
    for (let i = 0; i < applications.length; i++) {
      const application = applications[i];
      if (i < referenceIndex) {
        this._previous.push(application);
      } else if (i > referenceIndex) {
        this._future.push(application);
      }
    }
  }

  /**
   * Applications considered in past in relation with
   * the current application.
   */
  get previous(): ReadonlyArray<SequentialApplication> {
    return this._previous;
  }

  /**
   * Reference application to determine if other applications
   * are in the past or in the future.
   */
  get current(): SequentialApplication {
    return this._current;
  }

  /**
   * Applications considered in the future in relation with
   * the current application.
   */
  get future(): ReadonlyArray<SequentialApplication> {
    return this._future;
  }
}
