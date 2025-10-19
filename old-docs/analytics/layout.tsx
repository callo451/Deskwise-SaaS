import React, { PropsWithChildren } from "react";

export default function AnalyticsLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="min-h-0 flex-1">
        {children}
      </div>
    </div>
  );
}
