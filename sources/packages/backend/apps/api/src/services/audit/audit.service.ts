import { Injectable, LoggerService } from "@nestjs/common";
import { InjectLogger } from "@sims/utilities/logger";
import { AuditEvent } from "./audit-event.enum";
import { AuthorizedParties } from "../../auth";

const SIMS_AUDIT_EVENT_PREFIX = "SIMS Audit Event";

@Injectable()
export class AuditService {
  /**
   * Audit logging.
   * @param clientIP client IP.
   * @param tokenUserName token user name.
   * @param event audit event.
   * @param authorizedParty authorized party.
   */
  audit(
    clientIP: string,
    tokenUserName: string,
    event: AuditEvent,
    authorizedParty: AuthorizedParties,
  ): void {
    const eventFriendlyName = this.getEventFriendlyName(event);
    const portalFriendlyName = this.getPortalFriendlyName(authorizedParty);
    this.logger.log(
      `${SIMS_AUDIT_EVENT_PREFIX} From ${clientIP} | User GUID: ${tokenUserName}, Event: ${eventFriendlyName}, Portal: ${portalFriendlyName}.`,
    );
  }

  /**
   * Gets an event friendly name to be logged given an audit event.
   * @param event audit event.
   * @returns audit event friendly name.
   */
  private getEventFriendlyName(event: AuditEvent): string {
    let eventFriendlyName = event.toString();
    switch (event) {
      case AuditEvent.LoggedIn: {
        eventFriendlyName = "Logged In";
        break;
      }
      case AuditEvent.LoggedOut: {
        eventFriendlyName = "Logged Out";
        break;
      }
      case AuditEvent.BrowserClosed: {
        eventFriendlyName = "Browser Closed";
        break;
      }
      case AuditEvent.BrowserReopened: {
        eventFriendlyName = "Browser Reopened";
        break;
      }
      case AuditEvent.SessionTimedOut: {
        eventFriendlyName = "Session Timed Out";
        break;
      }
    }
    return eventFriendlyName;
  }

  /**
   * Gets a portal friendly name to be logged given an authorized party.
   * @param authorizedParty authorized party.
   * @returns portal friendly name.
   */
  private getPortalFriendlyName(authorizedParty: AuthorizedParties): string {
    let portalFriendlyName = authorizedParty.toString();
    switch (authorizedParty) {
      case AuthorizedParties.aest: {
        portalFriendlyName = "Ministry";
        break;
      }
      case AuthorizedParties.institution: {
        portalFriendlyName = "Institution";
        break;
      }
      case AuthorizedParties.student: {
        portalFriendlyName = "Student";
        break;
      }
      case AuthorizedParties.supportingUsers: {
        portalFriendlyName = "Supporting Users";
        break;
      }
    }
    return portalFriendlyName;
  }

  @InjectLogger()
  logger: LoggerService;
}
