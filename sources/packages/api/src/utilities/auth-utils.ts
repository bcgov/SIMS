export function extractRawUserName(userName: string): string {
  const atIndex = userName.indexOf("@");
  if (atIndex > -1) {
    return userName.substring(0, atIndex);
  }

  return userName;
}
