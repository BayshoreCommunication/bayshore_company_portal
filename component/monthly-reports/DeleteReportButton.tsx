"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { deleteReportAction } from "@/app/actions/reports";

const DeleteReportButton = ({ reportId, name }: { reportId: string; name: string }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      const result = await deleteReportAction(reportId);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete report.");
        setConfirming(false);
        return;
      }
      toast.success("Report deleted successfully");
      router.refresh();
    });

  if (!confirming) {
    return (
      <button type="button" className="more-btn" aria-label={`Delete ${name}`} title="Delete" onClick={() => setConfirming(true)}>
        <Trash2 size={14} strokeWidth={2} />
      </button>
    );
  }

  return (
    <span className="delete-confirm">
      <button type="button" className="btn-danger" disabled={isPending} onClick={handleDelete} style={{ padding: "4px 10px", fontSize: 11.5 }}>
        {isPending ? "Deleting…" : "Delete"}
      </button>
      <button type="button" className="btn-draft" disabled={isPending} onClick={() => setConfirming(false)} style={{ padding: "4px 10px", fontSize: 11.5 }}>
        Cancel
      </button>
    </span>
  );
};

export default DeleteReportButton;
