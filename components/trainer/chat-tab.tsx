"use client";

import { LeftDeptPanel } from "./left-dept-panel";
import { DocumentsSelector } from "./documents-selector";
import { SelectedChunksPanel } from "./selected-chunks-panel";
import { ChatPanel } from "./chat/chat-panel";
import { ReviewTools } from "./review-tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Tag, Database, MessageCircle } from "lucide-react";

type ChatMode = "tagged" | "rag" | "chatgpt";

export function ChatTab() {
  const [chatMode, setChatMode] = useState<ChatMode>("tagged");
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div style={{ flex: "1 1 auto" }}>
        <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">
          Select departments and documents to chat with your trained AI
          assistant
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr_380px]"
        style={{ flex: "1 1 auto", height: "calc(100% - 70px)" }}
      >
        <div className="flex flex-col gap-4" style={{ height: "inherit" }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <LeftDeptPanel showUploadHint />
            </CardContent>
          </Card>

          <DocumentsSelector />
        </div>

        <Card className="" style={{ height: "calc(100vh - 120px)" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Conversation</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Mode:</span>
              <Select
                value={chatMode}
                onValueChange={(value: ChatMode) => setChatMode(value)}
              >
                <SelectTrigger className="w-32 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tagged">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      <span>Tagged</span>
                    </div>
                  </SelectItem>
                  {/* <SelectItem value="rag">
                    <div className="flex items-center gap-1.5">
                      <Database className="h-3 w-3" />
                      <span>RAG</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="chatgpt">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-3 w-3" />
                      <span>ChatGPT</span>
                    </div>
                  </SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0" style={{ height: "calc(100% - 10px)" }}>
            <ChatPanel chatMode={chatMode} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4" style={{ height: "inherit" }}>
          <ReviewTools />
          <SelectedChunksPanel />
        </div>
      </div>
    </div>
  );
}
