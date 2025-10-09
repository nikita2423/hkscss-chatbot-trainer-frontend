"use client";

import { useState } from "react";
import { useTrainer } from "./trainer-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ChevronRight,
  File,
  Clock,
  Users,
  Plus,
} from "lucide-react";

type SidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const {
    departments,
    pdfs,
    messages,
    selectedDepartmentId,
    setSelectedDepartmentId,
    chatSessionId,
  } = useTrainer();

  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  // Get all documents across departments
  const allDocuments = Object.values(pdfs).flat();
  const totalDocuments = allDocuments.length;

  // Get chat sessions (simplified - using message groups)
  const chatSessions =
    messages.length > 0
      ? [
          {
            id: chatSessionId,
            name: `Session ${chatSessionId}`,
            messageCount: messages.length,
          },
        ]
      : [];

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      count: null,
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      count: totalDocuments,
      collapsible: false,
      isOpen: documentsOpen,
      onToggle: () => setDocumentsOpen(!documentsOpen),
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      count: chatSessions.length,
      collapsible: true,
      isOpen: chatOpen,
      onToggle: () => setChatOpen(!chatOpen),
    },
  ];

  return (
    <aside className="flex h-full w-48 flex-col border-r bg-muted/10">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Chatbot Trainer
        </h2>
        <p className="text-xs text-muted-foreground">
          Manage your AI assistant
        </p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <div key={item.id}>
              {/* Main Navigation Item */}
              <Button
                variant={activeTab === item.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 px-3 py-2",
                  activeTab === item.id
                    ? "bg-secondary/80 text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => {
                  onTabChange(item.id);
                  if (item.collapsible && item.onToggle) {
                    item.onToggle();
                  }
                }}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== null && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">
                    {item.count}
                  </Badge>
                )}
                {item.collapsible && (
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 transition-transform",
                      item.isOpen && "rotate-90"
                    )}
                  />
                )}
              </Button>

              {/* Collapsible Content */}
              {item.collapsible && (
                <Collapsible open={item.isOpen}>
                  <CollapsibleContent className="mt-1 space-y-1 pl-6">
                    {item.id === "documents" && (
                      <>
                        {/* Department Filter */}
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Departments
                          </p>
                          <div className="space-y-1">
                            {departments.map((dept) => (
                              <Button
                                key={dept.id}
                                variant={
                                  selectedDepartmentId === dept.id
                                    ? "secondary"
                                    : "ghost"
                                }
                                size="sm"
                                className={cn(
                                  "w-full justify-start gap-2 px-2 py-1 h-7 text-xs",
                                  selectedDepartmentId === dept.id
                                    ? "bg-secondary/60 text-secondary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                )}
                                onClick={() => setSelectedDepartmentId(dept.id)}
                              >
                                <Users className="h-3 w-3" />
                                <span className="flex-1 text-left">
                                  {dept.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="h-4 px-1 text-[10px]"
                                >
                                  {pdfs[dept.id]?.length || 0}
                                </Badge>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Recent Documents */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Recent Documents
                          </p>
                          {allDocuments.length > 0 ? (
                            <div className="space-y-1">
                              {allDocuments.slice(0, 5).map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                >
                                  <File className="h-3 w-3" />
                                  <span className="flex-1 truncate">
                                    {doc.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 px-2 py-1">
                              No documents yet
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {item.id === "chat" && (
                      <>
                        {/* New Chat Button */}
                        <div className="mb-3">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full justify-start gap-2 px-2 py-1.5 h-8 text-xs bg-primary hover:bg-primary/90"
                            onClick={() => onTabChange("chat")}
                          >
                            <Plus className="h-3 w-3" />
                            <span>New Chat</span>
                          </Button>
                        </div>

                        {/* Session History */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Session History
                          </p>
                          {chatSessions.length > 0 ? (
                            <div className="space-y-1">
                              {chatSessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground cursor-pointer"
                                >
                                  <Clock className="h-3 w-3" />
                                  <span className="flex-1 truncate">
                                    {session.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="h-4 px-1 text-[10px]"
                                  >
                                    {session.messageCount}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 px-2 py-1">
                              No previous sessions
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Total Documents:</span>
            <span className="font-medium">{totalDocuments}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Sessions:</span>
            <span className="font-medium">{chatSessions.length}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
