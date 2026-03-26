
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BidtoryRadarColorIconProps {
  className?: string;
}

export function BidtoryRadarColorIcon({ className }: BidtoryRadarColorIconProps) {
  return (
    <Image
      src="/logo-bidtory-radar-pos.svg"
      alt="Bidtory Radar"
      width={96}
      height={96}
      className={cn("h-24 w-24", className)}
      priority
    />
  );
}

    