export class EducationProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  offeringDelivered: string;
  get studyDates(): string {
    if (this.studyStartDate === null) {
      return "No program dates";
    } else {
      return `${this.studyStartDate.toLocaleDateString()} - ${this.studyEndDate.toLocaleDateString()}`;
    }
  }
}
