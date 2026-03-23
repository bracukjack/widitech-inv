"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectListSkeleton() {
  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="min-w-[260px] max-w-[260px]">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3.5">
                  <Skeleton className="h-4 w-36 mb-2" />
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-5 w-20 rounded-full mb-3" />
                  <Skeleton className="h-1 w-full mb-2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
