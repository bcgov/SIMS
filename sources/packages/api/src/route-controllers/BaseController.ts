import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth("access-token")
export default class BaseController {
  public handleRequestError(e: any) {
    console.log(e);
  }
}
