import { FILE_DEFAULT_ENCODING } from "@sims/services/constants";

const REPLACE_LINE_BREAK_REGEX = /\r?\n|\r/g;

/**
 * Replace the line breaks in the given text.
 * @param data data to replace the line break.
 * @param options replace options:
 * - `replaceText`: text to replace the line break.
 * @returns line break replaced string.
 */
export function replaceLineBreaks(
  data?: string,
  options?: { replaceText?: string },
): string {
  if (!data) {
    return data;
  }
  return data.replace(REPLACE_LINE_BREAK_REGEX, options?.replaceText ?? "");
}

/**
 * List of characters to be translated before the content is converted to an
 * ASCII buffer. These characters do not have an equivalent character in ISO8859-1
 * and will ended up being converted to an unexpected character.
 */
const ASCII_INDIRECT_TRANSLATIONS: Record<string, string> = {
  "—": "-",
};

/**
 * Converts input into an ASCII 7 bit buffer replacing special characters
 * by equivalent ASCII characters when possible.
 * @param rawContent raw content in string format.
 * @returns a string of the input with extended ASCII accented characters
 * converted to unaccented characters. If null or undefined is provided,
 * null will be returned.
 */
export function translateToASCII(rawContent?: string): string | null {
  if (rawContent === null || rawContent === undefined) {
    return null;
  }
  // Replace possible characters that will not be nicely converted to the ASCII buffer.
  Object.keys(ASCII_INDIRECT_TRANSLATIONS).forEach((key) => {
    rawContent = rawContent.replace(
      new RegExp(key, "g"),
      ASCII_INDIRECT_TRANSLATIONS[key],
    );
  });
  const content = Buffer.from(rawContent, FILE_DEFAULT_ENCODING);
  for (const [index, char] of content.entries()) {
    if (char > 127) {
      // If extended ascii.
      switch (char) {
        case 192:
        case 193:
        case 194:
        case 195:
        case 196:
        case 197: // ÀÁÂÃÄÅ
          content[index] = 65; // Replace with A.
          break;
        case 199: // Ç
          content[index] = 67; // Replace with C.
          break;
        case 200:
        case 201:
        case 202:
        case 203: // ÈÉÊË
          content[index] = 69; // Replace with E.
          break;
        case 204:
        case 205:
        case 206:
        case 207: // ÌÍÎÏ
          content[index] = 73; // Replace with I.
          break;
        case 209: // Ñ
          content[index] = 78; // Replace with N.
          break;
        case 210:
        case 211:
        case 212:
        case 213:
        case 214: // ÒÓÔÕÖ
          content[index] = 79; // Replace with O.
          break;
        case 217:
        case 218:
        case 219:
        case 220: // ÙÚÛÜ
          content[index] = 85; // Replace with U.
          break;
        case 224:
        case 225:
        case 226:
        case 227:
        case 228:
        case 229: // àáâãäå
          content[index] = 97; // Replace with a.
          break;
        case 231: // ç
          content[index] = 99; // Replace with c.
          break;
        case 232:
        case 233:
        case 234:
        case 235: // èéêë
          content[index] = 101; // Replace with e.
          break;
        case 236:
        case 237:
        case 238:
        case 239: // ìíîï
          content[index] = 105; // Replace with i.
          break;
        case 241: // ñ
          content[index] = 110; // Replace with n.
          break;
        case 242:
        case 243:
        case 244:
        case 245:
        case 246: // óòôõö
          content[index] = 111; // Replace with o.
          break;
        case 249:
        case 250:
        case 251:
        case 252: // ùúûü
          content[index] = 117; // Replace with u.
          break;
        case 253:
        case 255: // ýÿ
          content[index] = 121; // Replace with y.
          break;
        default:
          content[index] = 63; // Replace with ? by default.
          break;
      }
    }
  }
  return content.toString();
}
