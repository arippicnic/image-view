type ReplacementObject = { [key: string]: string };

export function replaceSpecialString(input: string, replacementObject: ReplacementObject): string {
  const pattern = new RegExp(
    Object.keys(replacementObject)
      .map((key) => `\\${key}`)
      .join("|"),
    "g"
  );

  const result = input.replace(pattern, (match) => replacementObject[match]);

  return result;
}
