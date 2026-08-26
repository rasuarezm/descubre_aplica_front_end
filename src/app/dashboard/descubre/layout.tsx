import { ModuleBadge } from "@/components/layout/ModuleBadge";

export default function DescubreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ModuleBadge module="descubre" />
      {children}
    </div>
  );
}
