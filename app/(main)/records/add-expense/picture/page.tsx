"use client";

import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/records/CameraCapture";

export default function PictureExpenseUploadPage() {
  const router = useRouter();

  return (
    <CameraCapture
      title="Snap your receipt"
      onClose={() => router.back()}
      onDone={(b64, mimeType) => {
        sessionStorage.setItem("spal_expense_receipt_b64", b64);
        sessionStorage.setItem("spal_expense_receipt_file_type", mimeType);
        router.push("/records/add-expense/picture/confirm");
      }}
    />
  );
}
