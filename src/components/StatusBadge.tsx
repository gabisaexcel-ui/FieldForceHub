interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("approved") || normalized.includes("great") || normalized === "jalan" || normalized.includes("selesai") || normalized.includes("sudah ttd") || normalized === "aktif"
    ? "success"
    : normalized.includes("reject") || normalized.includes("warning") || normalized.includes("tidak jalan")
      ? "danger"
      : normalized.includes("pending") || normalized.includes("menunggu") || normalized.includes("review") || normalized.includes("draft")
        ? "warning"
        : normalized.includes("safe")
          ? "info"
          : "neutral";

  return <span className={`status-badge ${tone}`}><span className="status-dot" />{status}</span>;
}
