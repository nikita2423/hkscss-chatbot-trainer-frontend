"use client";

import { useState, Suspense } from "react";
import { TrainerProvider } from "@/components/trainer/trainer-context";
import { Sidebar } from "@/components/trainer/sidebar";
import { DashboardTab } from "@/components/trainer/dashboard-tab";
import { DocumentsTab } from "@/components/trainer/documents-tab";
import { ChatTab } from "@/components/trainer/chat-tab";

export default function TrainerPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "documents":
        return (
          <Suspense>
            <DocumentsTab />
          </Suspense>
        );
      case "chat":
        return (
          <Suspense>
            <ChatTab />
          </Suspense>
        );
      default:
        return <DashboardTab />;
    }
  };

  return (
    <TrainerProvider>
      <div className="flex h-screen bg-background">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-scroll">
          <div className="">{renderContent()}</div>
        </main>
      </div>
    </TrainerProvider>
  );
}
