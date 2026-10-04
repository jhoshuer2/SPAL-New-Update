"use client";

import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/records/CameraCapture";

export default function PictureSaleUploadPage() {
  const router = useRouter();

  return (
    <CameraCapture
      title="Snap your sales note"
      onClose={() => router.back()}
      onDone={(b64, mimeType) => {
        sessionStorage.setItem("spal_receipt_b64", b64);
        sessionStorage.setItem("spal_receipt_file_type", mimeType);
        router.push("/records/add-sale/picture/confirm");
      }}
    />
  );
}
