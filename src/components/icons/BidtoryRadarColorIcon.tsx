
import { BidtoryRadarMark } from '@/components/icons/BidtoryRadarMark';
import { cn } from '@/lib/utils';

interface BidtoryRadarColorIconProps {
  className?: string;
}

export function BidtoryRadarColorIcon({ className }: BidtoryRadarColorIconProps) {
  return (
    <BidtoryRadarMark
      role="img"
      aria-label="Bidtory Radar"
      className={cn("h-24 w-24 text-[#00A89A]", className)}
    />
  );
}
