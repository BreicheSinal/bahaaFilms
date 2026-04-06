"use client";

import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";

export async function uploadFileToStorage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ storagePath: string; downloadUrl: string }> {
  if (!storage) {
    throw new Error("Firebase storage is not initialized");
  }

  const fileRef = ref(storage, path);
  const task = uploadBytesResumable(fileRef, file);

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (!onProgress) return;
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress(progress);
      },
      reject,
      () => resolve()
    );
  });

  const downloadUrl = await getDownloadURL(fileRef);
  return { storagePath: path, downloadUrl };
}
