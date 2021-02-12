import { StudentConfirmInfo } from "../route-controllers/student/models/student.dto";
export default class Helper {
  static mapAddressAttributes(fromObject: any, toObject: StudentConfirmInfo) {
    toObject.addressLine1 = fromObject.addressLine1;
    toObject.addressLine2 = fromObject.addressLine2;
    toObject.city = fromObject.city;
    toObject.provinceState = fromObject.province;
    toObject.country = fromObject.country;
    toObject.postalCode = fromObject.postalCode;
  }
}
