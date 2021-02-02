import ApiClient from "../services/http/ApiClient";

export interface Student {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface CreateStudent extends Student {
  sinNumber: string;
}

export class StudentService {
  // Share Instance
  private static instance: StudentService;

  public static get shared(): StudentService {
    return this.instance || (this.instance = new this());
  }

  async createStudent(student: CreateStudent): Promise<boolean | string> {
    try {
      await ApiClient.Students.createStudent({ ...student });
      return true;
    } catch (excp) {
      console.dir(excp);
      console.error(`Unable to create student: ${JSON.stringify(excp)}`);
      const message: string = excp.message || '';
      if (message.includes("422")) {
        return "User already exists";
      } else {
        return "Unable to create user";
      }
    }
    
  }

  async updateStudent(student: Student): Promise<void> {
    // TODO: Sample for updating the studant.
    console.log(student);
  }
}
