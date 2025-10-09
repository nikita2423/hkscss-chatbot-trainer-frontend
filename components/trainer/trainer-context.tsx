"use client";

import type React from "react";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Department = { id: string; name: string };
export type PDFDoc = {
  id: string;
  name: string;
  size?: number;
  departmentId: string;
  createdAt?: string;
  department?: Department;
};
export type Chunk = {
  id: string;
  content: string;
  page?: number;
  score?: number;
  source?: string;
  section_title?: string;
  metadata?: any;
  start_index?: number | null;
  end_index?: number | null;
  document?: {
    id: number;
    filename: string;
    createdAt: string;
  };
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  // citations connect an answer to chunks
  citations?: Chunk[];
  createdAt: number;
  preferred?: string;
  tags?: string[];
  quality?: "good" | "bad";
};

type ReRankSettings = {
  method: "none" | "cosine" | "llm-re-rank";
  topK: number;
  weight: number;
};

type TrainerState = {
  departments: Department[];
  setDepartments: (d: Department[]) => void;
  departmentsLoading: boolean;
  departmentsError: string | null;

  selectedDepartmentId?: string;
  setSelectedDepartmentId: (id?: string) => void;

  pdfs: Record<string, PDFDoc[]>; // by department
  setPdfs: (
    updater: (prev: Record<string, PDFDoc[]>) => Record<string, PDFDoc[]>
  ) => void;
  pdfsLoading: boolean;
  pdfsError: string | null;
  refreshDocuments: () => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  saveFeedback: (messageId: string) => Promise<void>;

  chunksByPdf: Record<string, Chunk[]>;
  setChunksByPdf: (
    updater: (prev: Record<string, Chunk[]>) => Record<string, Chunk[]>
  ) => void;
  chunksLoading: boolean;
  chunksError: string | null;
  selectedPdfId?: string;
  setSelectedPdfId: (id?: string) => void;

  // chat
  selectedDocumentsForChat: Set<string>;
  setSelectedDocumentsForChat: (
    updater: (prev: Set<string>) => Set<string>
  ) => void;
  chatSessionId: number;
  setChatSessionId: (id: number) => void;
  messages: Message[];
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  selectedMessageId?: string;
  setSelectedMessageId: (id?: string) => void;

  // ui/settings
  rerank: ReRankSettings;
  setRerank: (updater: (prev: ReRankSettings) => ReRankSettings) => void;
};

const TrainerContext = createContext<TrainerState | null>(null);

export function TrainerProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | undefined
  >();

  // Fetch departments on mount
  useEffect(() => {
    async function fetchDepartments() {
      try {
        setDepartmentsLoading(true);
        setDepartmentsError(null);

        const response = await fetch("/api/departments");
        if (!response.ok) {
          throw new Error("Failed to fetch departments");
        }

        const result = await response.json();
        if (result.success) {
          setDepartments(result.data);
          // Set first department as default if none selected
          if (!selectedDepartmentId && result.data.length > 0) {
            setSelectedDepartmentId(result.data[0].id);
          }

          // Show warning if using fallback data
          if (result.fallback) {
            setDepartmentsError(`Using fallback data: ${result.error}`);
          }
        } else {
          throw new Error(result.error || "Failed to fetch departments");
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartmentsError(
          error instanceof Error ? error.message : "Unknown error"
        );
        // Fallback to default departments on error
        const fallbackDepartments = [
          { id: "policy", name: "Policy" },
          { id: "hr", name: "HR" },
        ];
        setDepartments(fallbackDepartments);
        if (!selectedDepartmentId) {
          setSelectedDepartmentId(fallbackDepartments[0].id);
        }
      } finally {
        setDepartmentsLoading(false);
      }
    }

    fetchDepartments();
  }, []); // Empty dependency array to avoid infinite loop

  const [pdfs, setPdfsState] = useState<Record<string, PDFDoc[]>>({});
  const [pdfsLoading, setPdfsLoading] = useState(false);
  const [pdfsError, setPdfsError] = useState<string | null>(null);
  const setPdfs = (
    updater: (prev: Record<string, PDFDoc[]>) => Record<string, PDFDoc[]>
  ) => setPdfsState((prev) => updater(prev));

  // Function to fetch documents for the selected department
  const fetchDocuments = async () => {
    if (!selectedDepartmentId) {
      setPdfs(() => ({}));
      return;
    }

    try {
      setPdfsLoading(true);
      setPdfsError(null);

      const response = await fetch(
        `/api/documents?departmentId=${selectedDepartmentId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const result = await response.json();
      if (result.success) {
        setPdfs((prev) => ({
          ...prev,
          [selectedDepartmentId]: result.data,
        }));
      } else {
        throw new Error(result.error || "Failed to fetch documents");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setPdfsError(error instanceof Error ? error.message : "Unknown error");
      // Set empty array for this department on error
      setPdfs((prev) => ({
        ...prev,
        [selectedDepartmentId]: [],
      }));
    } finally {
      setPdfsLoading(false);
    }
  };

  // Refresh documents function for external use
  const refreshDocuments = async () => {
    await fetchDocuments();
  };

  // Save feedback function
  const saveFeedback = async (messageId: string) => {
    try {
      const messageIndex = messagesState.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        throw new Error("Message not found");
      }

      const message = messagesState[messageIndex];
      if (message.role !== "assistant") {
        throw new Error("Can only save feedback for assistant messages");
      }

      // Find the preceding user message as the question
      let question = "";
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messagesState[i].role === "user") {
          question = messagesState[i].content;
          break;
        }
      }

      if (!question) {
        throw new Error("No user question found for this message");
      }

      const feedbackData = {
        question,
        preferred_answer: message.preferred || null,
        original_answer: message.content,
        tags: message.tags || [],
        feedback_type: message.quality === "bad" ? "correction" : "improvement",
        feedback_status: "completed",
        chat_message_id: messageId,
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save feedback");
      }

      const result = await response.json();
      console.log("Feedback saved successfully:", result);
    } catch (error) {
      console.error("Error saving feedback:", error);
      throw error;
    }
  };

  // Delete document function
  const deleteDocument = async (documentId: string) => {
    if (!selectedDepartmentId) {
      throw new Error("No department selected");
    }

    try {
      // Call delete API - assuming it exists at /api/documents/delete
      const response = await fetch("/api/documents/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          departmentId: selectedDepartmentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      // Remove document from local state
      setPdfs((prev) => ({
        ...prev,
        [selectedDepartmentId]:
          prev[selectedDepartmentId]?.filter((doc) => doc.id !== documentId) ||
          [],
      }));

      // Remove chunks for this document
      setChunksByPdf((prev) => {
        const newChunks = { ...prev };
        delete newChunks[documentId];
        return newChunks;
      });

      // Clear selection if deleted document was selected
      if (selectedPdfId === documentId) {
        setSelectedPdfId(undefined);
      }

      console.log("Document deleted successfully:", documentId);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  };

  // Fetch documents when selected department changes
  useEffect(() => {
    fetchDocuments();
  }, [selectedDepartmentId]);

  const [chunksByPdfState, setChunksByPdfState] = useState<
    Record<string, Chunk[]>
  >({});
  const [chunksLoading, setChunksLoading] = useState(false);
  const [chunksError, setChunksError] = useState<string | null>(null);
  const [selectedPdfId, setSelectedPdfId] = useState<string | undefined>();

  // Chat document selection state
  const [selectedDocumentsForChat, setSelectedDocumentsForChatState] = useState<
    Set<string>
  >(new Set());
  const setSelectedDocumentsForChat = (
    updater: (prev: Set<string>) => Set<string>
  ) => setSelectedDocumentsForChatState((prev) => updater(prev));

  // Chat session management
  const [chatSessionId, setChatSessionId] = useState<number>(1);

  const setChunksByPdf = (
    updater: (prev: Record<string, Chunk[]>) => Record<string, Chunk[]>
  ) => setChunksByPdfState((prev) => updater(prev));

  // Fetch chunks when selected PDF changes
  useEffect(() => {
    async function fetchChunks() {
      if (!selectedPdfId) {
        return;
      }

      try {
        setChunksLoading(true);
        setChunksError(null);

        const response = await fetch(`/api/chunks?documentId=${selectedPdfId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch chunks");
        }

        const result = await response.json();
        if (result.success) {
          setChunksByPdf((prev) => ({
            ...prev,
            [selectedPdfId]: result.data,
          }));
        } else {
          throw new Error(result.error || "Failed to fetch chunks");
        }
      } catch (error) {
        console.error("Error fetching chunks:", error);
        setChunksError(
          error instanceof Error ? error.message : "Unknown error"
        );
        // Set empty array for this document on error
        setChunksByPdf((prev) => ({
          ...prev,
          [selectedPdfId]: [],
        }));
      } finally {
        setChunksLoading(false);
      }
    }

    fetchChunks();
  }, [selectedPdfId]);

  const [messagesState, setMessagesState] = useState<Message[]>([]);
  const setMessages = (updater: (prev: Message[]) => Message[]) =>
    setMessagesState((prev) => updater(prev));
  const [selectedMessageId, setSelectedMessageId] = useState<
    string | undefined
  >(undefined);

  const [rerank, setRerankState] = useState<ReRankSettings>({
    method: "cosine",
    topK: 5,
    weight: 0.5,
  });
  const setRerank = (updater: (prev: ReRankSettings) => ReRankSettings) =>
    setRerankState((prev) => updater(prev));

  const value = useMemo<TrainerState>(
    () => ({
      departments,
      setDepartments,
      departmentsLoading,
      departmentsError,
      selectedDepartmentId,
      setSelectedDepartmentId,
      pdfs,
      setPdfs,
      pdfsLoading,
      pdfsError,
      refreshDocuments,
      deleteDocument,
      saveFeedback,
      chunksByPdf: chunksByPdfState,
      setChunksByPdf,
      chunksLoading,
      chunksError,
      selectedPdfId,
      setSelectedPdfId,
      selectedDocumentsForChat,
      setSelectedDocumentsForChat,
      chatSessionId,
      setChatSessionId,
      messages: messagesState,
      setMessages,
      selectedMessageId,
      setSelectedMessageId,
      rerank,
      setRerank,
    }),
    [
      departments,
      departmentsLoading,
      departmentsError,
      selectedDepartmentId,
      pdfs,
      pdfsLoading,
      pdfsError,
      refreshDocuments,
      deleteDocument,
      saveFeedback,
      chunksByPdfState,
      chunksLoading,
      chunksError,
      selectedPdfId,
      selectedDocumentsForChat,
      chatSessionId,
      messagesState,
      selectedMessageId,
      rerank,
    ]
  );

  return (
    <TrainerContext.Provider value={value}>{children}</TrainerContext.Provider>
  );
}

export function useTrainer() {
  const ctx = useContext(TrainerContext);
  if (!ctx) throw new Error("useTrainer must be used within TrainerProvider");
  return ctx;
}
