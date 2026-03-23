"use client";

import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-7 w-36" />
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-24 mt-2" />
                  <Skeleton className="h-1.5 w-full mt-3" />
                </div>
                <div className="ml-4">
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
