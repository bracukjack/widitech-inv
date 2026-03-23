"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function FinanceSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div>
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-[240px] w-full rounded-lg" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-48 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
