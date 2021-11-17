import { Address } from "@/types";

export default class Helper {
  //Formatting date received from api from 1998-03-24T00:00:00.000Z
  //to March 24, 1998
  static formatDate(date: Date): string {
    //If UTC timezone isnt given, local timezone is assumed while conversions and it subtracts a day
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    };
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString("en-CA", options);
  }
  //Formatting date received from api from 1998-03-24T00:00:00.000Z to "1998-03-24"
  static formatDate2(date: Date): string {
    //If UTC timezone isnt given, local timezone is assumed while conversions and it subtracts a day
    const options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    };
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString("en-CA", options);
  }

  static formattedAddress(address: Address) {
    const formattedAddress = [];
    formattedAddress.push(address.addressLine1);
    if (address.addressLine2) {
      formattedAddress.push(address.addressLine2);
    }
    formattedAddress.push(address.city);
    formattedAddress.push(address.provinceState);
    formattedAddress.push(address.postalCode);
    formattedAddress.push(address.country);
    return formattedAddress.join(", ");
  }
}
