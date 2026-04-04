import { Badge } from "@/components/ui/badge";

export function DemoDataBadge({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <Badge variant="secondary" className="font-normal">
      Demo data
    </Badge>
  );
}
