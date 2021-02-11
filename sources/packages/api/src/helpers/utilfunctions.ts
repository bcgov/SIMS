export default class Helper {
  static formatDate(date: Date): string {
    var options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }
}
