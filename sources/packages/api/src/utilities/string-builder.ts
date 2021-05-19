import * as dayjs from "dayjs";

export class StringBuilder {
  private readonly contents: string[];
  constructor() {
    this.contents = [];
  }

  public Append(s: string) {
    this.contents.push(s);
  }

  public AppendWithEndFiller(s: string, length: number, filler: string) {
    this.Append(s.padEnd(length, filler));
  }

  public AppendWithStartFiller(s: string, length: number, filler: string) {
    this.Append(s.padStart(length, filler));
  }

  public RepeatAppend(s: string, length: number) {
    this.Append(s.repeat(length));
  }

  public AppendDate(date: Date, dateFormat: string) {
    this.Append(dayjs(date).format(dateFormat));
  }

  public ToString(): string {
    return this.contents.join("");
  }
}
