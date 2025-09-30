"use client"

import React from "react";

export default function DeleteCertButton({ id }: { id: string }) {
  const onDelete = async () => {
    if (!confirm(`Delete certificate ${id}?`)) return;
    try {
      const res = await fetch('/api/certificates', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Delete failed');
      }
      // reload the page to refresh server-rendered list
      location.reload();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete');
    }
  }

  return (
    <button onClick={onDelete} className="text-sm text-destructive">Delete</button>
  );
}
