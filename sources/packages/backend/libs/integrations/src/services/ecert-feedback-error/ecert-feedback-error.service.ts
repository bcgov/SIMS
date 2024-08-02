import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ECertFeedbackError, OfferingIntensity } from "@sims/sims-db";
import { Repository } from "typeorm";

/**
 * Manages the data and business logic related to e-Cert feedback errors.
 */
@Injectable()
export class ECertFeedbackErrorService {
  constructor(
    @InjectRepository(ECertFeedbackError)
    private readonly eCertFeedbackErrorRepo: Repository<ECertFeedbackError>,
  ) {}

  /**
   * Get e-Cert feedback errors for the given offering intensity.
   * @param offeringIntensity offering intensity.
   * @returns e-Cert feedback errors.
   */
  async getECertFeedbackErrorsByOfferingIntensity(
    offeringIntensity: OfferingIntensity,
  ): Promise<ECertFeedbackError[]> {
    return this.eCertFeedbackErrorRepo.find({
      select: { id: true, errorCode: true, blockFunding: true },
      where: { offeringIntensity },
    });
  }
}
