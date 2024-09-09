import { Injectable } from "@nestjs/common";
import { NoteSharedService, SystemUsersService } from "@sims/services";
import {
  ApplicationRestrictionBypass,
  NoteType,
  RestrictionBypassBehaviors,
} from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { EntityManager } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

/**
 * Check if restrictions bypasses are active and configured as {@link RestrictionBypassBehaviors.NextDisbursementOnly}.
 * All active bypasses identified should be removed.
 */
@Injectable()
export class RestrictionBypassesResolutionStep implements ECertProcessStep {
  constructor(
    private readonly noteSharedService: NoteSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Remove restrictions active bypasses configured as {@link RestrictionBypassBehaviors.NextDisbursementOnly}.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Checking if restrictions bypasses should be removed.");
    const nextDisbursementOnlyBypasses =
      eCertDisbursement.activeRestrictionBypasses.filter(
        (bypass) =>
          bypass.bypassBehavior ===
          RestrictionBypassBehaviors.NextDisbursementOnly,
      );
    if (!nextDisbursementOnlyBypasses.length) {
      log.info("No restrictions bypasses found to be removed.");
      return true;
    }
    // Remove the bypasses.
    const applicationRestrictionBypassRepo = entityManager.getRepository(
      ApplicationRestrictionBypass,
    );
    // Create the student note to be shared for all bypasses being removed.
    const studentNote = await this.noteSharedService.createStudentNote(
      eCertDisbursement.studentId,
      NoteType.Application,
      "Automatically removing bypass after the first e-Cert was generated.",
      this.systemUsersService.systemUser.id,
      entityManager,
    );
    const now = new Date();
    for (const bypass of nextDisbursementOnlyBypasses) {
      log.info(`Removing bypass id ${bypass.id}.`);
      await applicationRestrictionBypassRepo.update(bypass.id, {
        isActive: false,
        bypassRemovedDate: now,
        bypassRemovedBy: this.systemUsersService.systemUser,
        removalNote: studentNote,
        updatedAt: now,
        modifier: this.systemUsersService.systemUser,
      });
    }
    return true;
  }
}
