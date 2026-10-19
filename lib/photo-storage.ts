import "server-only";
import { put, get, del } from "@vercel/blob";
import type { PhotoStorage } from "./api-handler";

function token() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is missing. Connect a private Blob store.");
  return process.env.BLOB_READ_WRITE_TOKEN;
}
export const photoStorage: PhotoStorage = {
  async put(id, bytes, contentType) {
    const blob = await put(`wish-photos/${id}`, Buffer.from(bytes), {
      access: "private", contentType, addRandomSuffix: false, token: token(),
    });
    return blob.pathname;
  },
  async get(pathname) {
    const result = await get(pathname, { access: "private", token: token() });
    if (!result || result.statusCode !== 200) return null;
    return result.stream;
  },
  async delete(pathname) { await del(pathname, { token: token() }); },
};
