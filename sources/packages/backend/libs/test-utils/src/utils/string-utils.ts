/**
 * Removes all occurrences of the string
 * to be removed from the provided string.
 * @param str string in which to search.
 * @param strToRemove substring to remove.
 * @returns the string with the substring removed.
 */
export const removeUnwantedString = (
  str: string,
  strToRemove: string,
): string => {
  const strToRemoveRegex = new RegExp(strToRemove, "g");
  return str.replace(strToRemoveRegex, "");
};

/**
 * Appends a required string to the the provided string.
 * at the specified index.
 * @param str string in which to append.
 * @param stringToAdd string to append.
 * @returns the string with the substring added.
 */
export const appendRequiredString = (
  str: string,
  stringToAdd: string,
): string => {
  return (
    str.slice(0, Math.max(str.length - 4, 0)) +
    stringToAdd +
    str.slice(Math.max(str.length - 4, 0))
  );
};
