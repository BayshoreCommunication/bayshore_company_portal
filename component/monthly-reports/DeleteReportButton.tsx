"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import { deleteReportAction } from "@/app/actions/reports";

// A red icon button, like the Content list's: confirm, then it spins until the
// refreshed list drops the row.
const DeleteReportButton = ({ reportId, name }: { reportId: string; name: string }) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    setDeleting(true);
    const result = await deleteReportAction(reportId);
    if (!result.ok) {
      setDeleting(false);
      toast.error(result.error ?? "Failed to delete report.");
      return;
    }
    toast.success("Report deleted successfully");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-busy={deleting}
      aria-label={`Delete ${name}`}
      className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md border border-[#f0c4c4] bg-white text-[#b42318] hover:border-[#b42318] hover:bg-[#fdecec] disabled:cursor-wait"
    >
      {deleting ? <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2} />}
    </button>
  );
};

export default DeleteReportButton;
