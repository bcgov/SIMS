import { ClientIdType } from "@/types/contracts/ConfigContract";

export function useClientLoader() {
  /**
   * Get Client Type.
   * @param clientIdType clientIdType string.
   * @returns clientIdType.
   */
  const getClientType = (clientIdType: ClientIdType) => {
    switch (clientIdType) {
      case ClientIdType.Student:
        return ClientIdType.Student;
      case ClientIdType.Institution:
        return ClientIdType.Institution;
      case ClientIdType.SupportingUsers:
        return ClientIdType.SupportingUsers;
      case ClientIdType.AEST:
        return ClientIdType.AEST;
      default:
        return ClientIdType.Student;
    }
  };
  return { getClientType };
}
