/**
 * Hand a finished picture to the system share sheet (save to photos, send),
 * or download it where sharing files isn't possible. Cancelling the sheet is
 * not an error; a share refused for lack of a fresh tap (Safari, after the
 * PNG took a moment) falls back to the download.
 */
export async function sharePicture(png: Blob, fileName: string, title: string): Promise<void> {
  const file = new File([png], fileName, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(png);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
