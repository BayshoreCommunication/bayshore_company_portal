"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { deleteClientAction } from "@/app/actions/clients";

const DeleteClientButton = ({ clientId, name }: { clientId: string; name: string }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete client.");
        return;
      }
      toast.success("Client deleted successfully");
      router.push("/clients");
    });
  };

  if (!confirming) {
    return (
      <button type="button" className="btn-danger-outline" onClick={() => setConfirming(true)}>
        <Trash2 size={13} strokeWidth={2} /> Delete
      </button>
    );
  }

  return (
    <span className="delete-confirm">
      <span>Delete {name} and its portal login?</span>
      <button type="button" className="btn-danger" disabled={isPending} onClick={handleDelete}>
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button type="button" className="btn-draft" disabled={isPending} onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
};

export default DeleteClientButton;
