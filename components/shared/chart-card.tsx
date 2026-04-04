import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChartCardProps {
  title: string;
  isDemo?: boolean;
  children: React.ReactNode;
}

export function ChartCard({ title, isDemo = false, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {isDemo ? (
          <Badge variant="secondary" className="font-normal">
            Demo data
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
