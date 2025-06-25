import { Badge } from "@/components/ui/badge";
import { getStatusColor, getDutchStatus } from "../utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={getStatusColor(status) as any} className={className}>
      {getDutchStatus(status)}
    </Badge>
  );
}
