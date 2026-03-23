"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface GenericTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function GenericTableSkeleton({ rows = 5, columns = 5 }: GenericTableSkeletonProps) {
  const widths = ['w-36', 'w-24', 'w-20', 'w-28', 'w-16'];
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-5 w-32" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-2.5">
                <Skeleton className={`h-3 ${widths[i % widths.length]}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <Skeleton className={`h-4 ${widths[j % widths.length]}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
