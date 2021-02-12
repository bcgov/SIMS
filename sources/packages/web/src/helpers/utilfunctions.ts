export default class Helper {
  //Formatting date received from api from 1998-03-24T00:00:00.000Z
  //to March 24, 1998
  static formatDate(date: Date): string {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString("en-US", options);
  }
}
