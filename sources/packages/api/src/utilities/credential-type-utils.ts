export function credentialTypeToDisplay(
  credentialType: string,
  credentialTypeOther: string,
): string {
  if (credentialType?.toLowerCase() === "other") {
    return credentialTypeOther;
  }
  return credentialType;
}
