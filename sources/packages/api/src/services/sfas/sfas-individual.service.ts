import { Inject, Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { SFASIndividual } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { SFASIndividualRecord } from "src/sfas-integration/sfas-files/sfas-individual-record";
import { getUTCNow } from "src/utilities";

@Injectable()
export class SFASIndividualService extends DataModelService<SFASIndividual> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(SFASIndividual));
  }

  async saveIndividual(sfasIndividual: SFASIndividualRecord): Promise<void> {
    const individual = new SFASIndividual();
    individual.id = sfasIndividual.id;
    individual.firstName =
      `${sfasIndividual.firstName} ${sfasIndividual.middleName}`.trim();
    individual.lastName = sfasIndividual.lastName;
    individual.birthDate = sfasIndividual.birthDate;
    individual.sin = sfasIndividual.sin;
    individual.pdStatus = sfasIndividual.pdStatus;
    individual.msfaaNumber = sfasIndividual.msfaaNumber;
    individual.msfaaSignedDate = sfasIndividual.msfaaSignedDate;
    individual.neb = sfasIndividual.neb;
    individual.bcgg = sfasIndividual.bcgg;
    individual.lfp = sfasIndividual.lfp;
    individual.pal = sfasIndividual.pal;
    individual.cslOveraward = sfasIndividual.cslOveraward;
    individual.bcslOveraward = sfasIndividual.bcslOveraward;
    individual.cmsOveraward = sfasIndividual.cmsOveraward;
    individual.grantOveraward = sfasIndividual.grantOveraward;
    individual.withdrawals = sfasIndividual.withdrawals;
    individual.unsuccessfulCompletion = sfasIndividual.unsuccessfulCompletion;
    individual.extractedAt = getUTCNow();
    await this.repo.save(individual);
  }

  @InjectLogger()
  logger: LoggerService;
}
