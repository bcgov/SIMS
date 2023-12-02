import { Student } from "@sims/sims-db";

export class PartTimeCertRecordParser {
  constructor(private readonly record: string) {}

  get recordType(): string {
    return this.record.substring(0, 2);
  }

  get firstName(): string {
    return this.record.substring(27, 42).trim();
  }

  get lastName(): string {
    return this.record.substring(2, 27).trim();
  }

  containsStudent(student: Student): boolean {
    return (
      student.user.lastName === this.lastName &&
      student.user.firstName === this.firstName
    );
  }
}
