export type OfficeDocRecord = {
  id: string;
  title: string;
  description: string | null;
  file: string | null;
  username?: string | null;
  user_name?: string | null;
  inserted_by_name?: string | null;
  created_at: string;
};

export function normalizeDocs(records: OfficeDocRecord[]) {
  return Array.from(
    new Map(records.map((record) => [record.id, record])).values(),
  );
}

export function getFileExt(path: string | null) {
  if (!path) return "";
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageExt(ext: string) {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg", "pdf", "docx"].includes(
    ext,
  );
}
