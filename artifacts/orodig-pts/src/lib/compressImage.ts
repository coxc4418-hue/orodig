/** Comprime imágenes en el navegador antes de guardar en Firestore (gratis). */

export function compressImageFile(
  file: File,
  opts: { maxWidth: number; maxHeight: number; quality: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("El archivo supera 10MB"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Imagen inválida"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { maxWidth, maxHeight, quality } = opts;
        let width = img.width;
        let height = img.height;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
