import * as dayjs from "dayjs";
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
      return `${dayjs(this.studyStartDate).format("MMMM, D YYYY")} - ${dayjs(
        this.studyEndDate,
      ).format("MMMM, D YYYY")}`;
    }
  }
}
