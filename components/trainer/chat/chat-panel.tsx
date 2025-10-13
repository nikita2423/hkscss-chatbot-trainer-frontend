"use client";

import { useRef, useState, useEffect } from "react";
import { useTrainer, type Message, type Chunk } from "../trainer-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, auth } from "@/lib/utils";
import {
  User,
  Bot,
  Loader2,
  Tag,
  Database,
  MessageCircle,
  Send,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMode = "tagged" | "rag" | "chatgpt";

type ChatPanelProps = {
  chatMode: ChatMode;
};

export function ChatPanel({ chatMode }: ChatPanelProps) {
  const {
    messages,
    setMessages,
    selectedMessageId,
    setSelectedMessageId,
    selectedDepartmentId,
    selectedDocumentsForChat,
    chatSessionId,
    setChatSessionId,
    setChunksByPdf,
  } = useTrainer();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [streamedContent, setStreamedContent] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Streaming text effect
  const streamText = (text: string, messageId: string) => {
    setStreamedContent("");
    setStreamingMessageId(messageId);

    const words = text.split(" ");
    let currentIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        setStreamedContent((prev) => {
          const newContent =
            prev + (currentIndex === 0 ? "" : " ") + words[currentIndex];
          return newContent;
        });
        currentIndex++;

        // Auto-scroll during streaming
        setTimeout(scrollToBottom, 10);
      } else {
        clearInterval(streamInterval);
        setStreamingMessageId(null);
        setStreamedContent("");
      }
    }, 100); // Adjust speed here (100ms per word)
  };

  const send = async () => {
    const question = input.trim();
    if (!question) return;

    // Check if documents are selected for modes that require them
    // const documentIds = Array.from(selectedDocumentsForChat);
    // if (
    //   (chatMode === "tagged" || chatMode === "rag") &&
    //   documentIds.length === 0
    // ) {
    //   alert(
    //     "Please select at least one document before asking a question with this mode."
    //   );
    //   return;
    // }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);
    setLoadingProgress(10);

    // Add thinking message placeholder
    const thinkingMsg: Message = {
      id: "thinking-" + Date.now(),
      role: "assistant",
      content: "thinking", // Special content to indicate thinking
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, thinkingMsg]);

    // Auto-scroll to show thinking indicator
    setTimeout(scrollToBottom, 100);

    try {
      // Get user ID from authentication
      const user = auth.getUser();
      const userId = user?.id;

      console.log("Sending question to API:", {
        question,
        chatSessionId,
        chatMode,
        userId,
      });
      setLoadingProgress(30);
      const res = await fetch("/api/trainer-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          documentIds: [],
          sessionId: chatSessionId,
          userId,
          departmentId: selectedDepartmentId,
        }),
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      setLoadingProgress(60);

      const data = await res.json();
      setLoadingProgress(80);

      if (!data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      // Update session ID if provided
      if (data.sessionId && data.sessionId !== chatSessionId) {
        setChatSessionId(data.sessionId);
      }

      // Create citations from sources
      const citations: Chunk[] =
        data.sources?.map((source: any) => ({
          id: source.id,
          content: source.content || "", // Will be populated when chunks are loaded
          section_title: source.section_title,
          start_index: source.start_index,
          end_index: source.end_index,
          reference: source.reference,
          source: source?.source,
          score: source.score,
        })) || [];

      // Remove thinking message and add real response
      setIsThinking(false);
      setMessages((prev) =>
        prev.filter((msg) => !msg.content.startsWith("thinking"))
      );

      const assistantMsg: Message = {
        id: data.messageId,
        role: "assistant",
        content: data.answer,
        citations,
        createdAt: Date.now(),
        matchedFeedback: data.matched, // matched feedback data from trainer-chat API
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setSelectedMessageId(assistantMsg.id);

      // Complete progress
      setLoadingProgress(100);

      // Start streaming effect
      streamText(data.answer, assistantMsg.id);

      // Update selected chunks with the citations
      if (citations.length > 0) {
        const chunksById: Record<string, Chunk[]> = {};
        citations.forEach((chunk) => {
          if (!chunksById["selected"]) {
            chunksById["selected"] = [];
          }
          chunksById["selected"].push(chunk);
        });
        setChunksByPdf((prev) => ({ ...prev, ...chunksById }));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsThinking(false);
      setMessages((prev) =>
        prev.filter((msg) => !msg.content.startsWith("thinking"))
      );

      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      // Reset progress after a delay
      setTimeout(() => setLoadingProgress(0), 1000);
    }
  };

  console.log("Selected Department Id", selectedDepartmentId);

  return (
    <div className="flex flex-col bg-background" style={{ height: "100%" }}>
      <ScrollArea ref={viewportRef} className="flex-1 overflow-hidden">
        <div className="space-y-4 p-4 pb-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-3 items-start",
                m.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {m.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={cn(
                  "max-w-[60ch] rounded-lg p-3 pt-2 pb-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card",
                  selectedMessageId === m.id && m.role === "assistant"
                    ? "ring-2 ring-primary"
                    : "ring-1 ring-border",
                  m.role === "assistant" && m.content !== "thinking"
                    ? "cursor-pointer"
                    : ""
                )}
                onClick={() =>
                  m.role === "assistant" &&
                  m.content !== "thinking" &&
                  setSelectedMessageId(m.id)
                }
                aria-pressed={selectedMessageId === m.id}
              >
                {m.content === "thinking" ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : streamingMessageId === m.id ? (
                  <span>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamedContent}
                    </ReactMarkdown>

                    <span className="animate-pulse">|</span>
                  </span>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </ScrollArea>

      {/* Fixed input area */}
      <div className="border-t bg-background p-4 flex-shrink-0">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="mb-3">
            <Progress value={loadingProgress} className="h-1" />
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[56px] flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            onClick={send}
            className="h-[56px] w-[56px] p-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        {/* <p className="mt-1 text-xs text-muted-foreground">
          {chatMode === "chatgpt"
            ? "ChatGPT mode - Direct conversation without document context."
            : selectedDocumentsForChat.size === 0
            ? `Please select documents from the left panel to use ${chatMode.toUpperCase()} mode.`
            : `${chatMode.toUpperCase()} mode with ${
                selectedDocumentsForChat.size
              } document(s). Answers will highlight their chunks in the right panel.`}
        </p> */}
      </div>
    </div>
  );
}
