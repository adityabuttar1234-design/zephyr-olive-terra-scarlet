export async function compressProof(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That's not a photo, genius.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("That file is a brick. Compress it under 8MB.");
  }

  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't read that image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.72),
  );
  if (!blob) throw new Error("Couldn't smash that photo down.");
  if (blob.size > 700_000) {
    throw new Error("Still too fat. Crop it and try again.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read the photo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}
