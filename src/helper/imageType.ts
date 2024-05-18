export function imageType(input: string): boolean {
  const lastDotIndex = input.lastIndexOf(".");

  if (lastDotIndex !== -1) {
    const lastText = input.substring(lastDotIndex + 1);
    if (["jpg", "jpeg", "png", "svg", "webp"].includes(lastText)) {
      return true;
    }
    return false;
  }
  return false;
}
export function imageTypeSvg(input: string): boolean {
  const lastDotIndex = input.lastIndexOf(".");

  if (lastDotIndex !== -1) {
    const lastText = input.substring(lastDotIndex + 1);
    if (["svg"].includes(lastText)) {
      return true;
    }
    return false;
  }
  return false;
}
