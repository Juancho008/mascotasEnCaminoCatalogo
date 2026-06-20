function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadProductImage(file, token) {
  const data = await fileToBase64(file);
  const r = await fetch("/api/admin/upload-image", {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data,
      mime: file.type || "image/jpeg",
      filename: file.name,
    }),
  });
  const res = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(res.error || "No se pudo subir la imagen");
  return res.url || res.image;
}
