import { Controller, Get } from "@nestjs/common";
import { Public } from "src/auth/decorators/public.decorator";
import { SshService } from "../../services/ssh/ssh.service";

@Controller("cra-integration")
export class CraIntegrationController {
  constructor(private readonly sshService: SshService) {}

  @Public()
  @Get()
  async createFile(): Promise<any> {
    return this.sshService.connect();
  }
}
