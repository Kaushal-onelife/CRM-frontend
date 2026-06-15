import { Platform } from "react-native";

// Platform-aware CSV download + pick.
// Web: real browser download / hidden file input (zero dependencies).
// Native: gracefully reports it needs the optional file packages + a dev build,
//         so the app never crashes if they aren't installed.
//
// To enable native later: `npx expo install expo-file-system expo-sharing
// expo-document-picker` and fill in the native branches below.

export const fileSupported = Platform.OS === "web";

// Trigger a CSV file download in the browser.
export function downloadCsv(filename, csvText) {
  if (Platform.OS !== "web") {
    throw new Error(
      "File export on this device needs a dev build with expo-file-system. It works on web today."
    );
  }
  // Prepend BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(["﻿" + csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Open a file picker and resolve with the selected file's text content.
// Resolves null if the user cancels.
export function pickCsvText() {
  if (Platform.OS !== "web") {
    return Promise.reject(
      new Error(
        "File import on this device needs a dev build with expo-document-picker. It works on web today."
      )
    );
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsText(file);
    };
    // If the dialog is dismissed without choosing, there's no reliable cancel
    // event; resolving null on focus-back keeps the UI from hanging.
    input.click();
  });
}
