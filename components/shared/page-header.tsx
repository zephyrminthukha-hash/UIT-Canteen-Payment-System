import { DemoDataBadge } from "@/components/shared/demo-data-badge";

interface PageHeaderProps {
  title: string;
  description?: string;
  isDemo?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, isDemo = false, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <DemoDataBadge show={isDemo} />
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
