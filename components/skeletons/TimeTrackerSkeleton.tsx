"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function TimeTrackerSkeleton() {
  return (
    <div className="p-6 lg:p-8 w-full mx-auto space-y-6">
      <div>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-48 mx-auto" />
          <div className="flex items-center gap-2 max-w-xl mx-auto">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32 mt-1" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
