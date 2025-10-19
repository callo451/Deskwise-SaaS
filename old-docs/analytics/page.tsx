"use client";
import React from "react";
import { AnalyticsFiltersProvider } from "@/components/analytics/FiltersContext";
import { LeftRail } from "@/components/analytics/LeftRail";
import { TopBar } from "@/components/analytics/TopBar";
import { MainCanvas } from "@/components/analytics/MainCanvas";

export default function AnalyticsHubPage() {
  return (
    <AnalyticsFiltersProvider>
      <div className="space-y-4">
        <TopBar />
        <div className="flex gap-4 min-h-0">
          <LeftRail />
          <div className="flex-1 min-w-0">
            <MainCanvas />
          </div>
        </div>
      </div>
    </AnalyticsFiltersProvider>
  );
}
