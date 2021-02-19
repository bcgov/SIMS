import { StudentInfo } from "../route-controllers/student/models/student.dto";
export default class Helper {
  static mapAddressAttributes(fromObject: any, toObject: StudentInfo) {
    toObject.contact.addressLine1 = fromObject.addressLine1;
    toObject.contact.addressLine1 = fromObject.addressLine1;
    toObject.contact.addressLine2 = fromObject.addressLine2;
    toObject.contact.city = fromObject.city;
    toObject.contact.provinceState = fromObject.province;
    toObject.contact.country = fromObject.country;
    toObject.contact.postalCode = fromObject.postalCode;
  }
}
