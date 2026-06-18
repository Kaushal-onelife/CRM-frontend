import * as ImagePicker from "expo-image-picker";
import { supabase } from "../services/supabase";

// Decode a base64 string to a Uint8Array — Supabase Storage accepts this for
// uploads. Avoids adding a base64-arraybuffer dependency.
function base64ToBytes(base64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const bytesLen = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bytesLen);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    if (p < bytesLen) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bytesLen) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bytesLen) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

// Pick an image from the gallery, compress it, and return { base64, mime }.
// Returns null if the user cancels or permission is denied.
export async function pickAvatar() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Photo library permission is needed to set a profile picture.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true, // square crop UI
    aspect: [1, 1],
    quality: 0.6, // compress — avatars don't need full quality (~30-80 KB)
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]?.base64) return null;
  const asset = result.assets[0];
  // Derive mime from the asset; default to jpeg.
  const mime = asset.mimeType || "image/jpeg";
  return { base64: asset.base64, mime };
}

// Upload the avatar for a user to the public 'avatars' bucket and return the
// public URL. Uses a fixed path "<userId>/avatar.jpg" so re-uploads OVERWRITE
// the previous file (no orphaned images pile up).
export async function uploadAvatar(userId, base64, mime = "image/jpeg") {
  const ext = mime.includes("png") ? "png" : "jpg";
  const path = `${userId}/avatar.${ext}`;
  const bytes = base64ToBytes(base64);

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: mime, upsert: true });

  if (error) throw new Error(error.message);

  // Public URL + a cache-buster so the new image shows immediately after replace.
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
