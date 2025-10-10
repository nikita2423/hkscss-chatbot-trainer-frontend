"use client";

import { useCallback, useMemo, useState } from "react";
import { useTrainer, type Chunk } from "./trainer-context";
import { LeftDeptPanel } from "./left-dept-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  FileText,
  Hash,
  Eye,
  Copy,
  CheckCircle,
  Upload,
  Calendar,
  Trash2,
  Tag,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const fetcher = (url: string, opts?: any) =>
  fetch(url, opts).then((r) => r.json());

export function DocumentsTab() {
  const {
    selectedDepartmentId,
    pdfs,
    setPdfs,
    pdfsLoading,
    pdfsError,
    refreshDocuments,
    deleteDocument,
    chunksByPdf,
    setChunksByPdf,
    chunksLoading,
    chunksError,
    selectedPdfId,
    setSelectedPdfId,
  } = useTrainer();

  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const currentPdfs = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return pdfs[selectedDepartmentId] ?? [];
  }, [pdfs, selectedDepartmentId]);

  const selectedChunks = useMemo<Chunk[]>(
    () => (selectedPdfId ? chunksByPdf[selectedPdfId] ?? [] : []),
    [chunksByPdf, selectedPdfId]
  );

  const onUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !selectedDepartmentId) return;

      const fileArray = Array.from(files);
      setIsUploading(true);
      setUploadProgress(0);
      setUploadingFiles(fileArray.map((f) => f.name));

      try {
        // Process files one by one to track progress
        const results = [];
        const totalFiles = fileArray.length;

        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const fd = new FormData();
          fd.append("file", file);
          fd.append("departmentId", selectedDepartmentId);

          console.log(
            `Uploading file ${i + 1}/${totalFiles}:`,
            file.name,
            "to department:",
            selectedDepartmentId
          );

          const res = await fetch("/api/upload", { method: "POST", body: fd });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
              `Upload failed for ${file.name}: ${
                errorData.error || "Unknown error"
              }`
            );
          }

          const result = await res.json();
          results.push(result);

          // Update progress
          const progress = ((i + 1) / totalFiles) * 100;
          setUploadProgress(progress);
        }

        // Collect all docs and chunks from the results
        const allDocs: any[] = [];
        const allChunks: Record<string, Chunk[]> = {};

        results.forEach((data) => {
          if (data.doc) {
            allDocs.push({
              ...data.doc,
              departmentId: selectedDepartmentId,
            });
          }
          if (data.chunks) {
            Object.assign(allChunks, data.chunks);
          }
        });

        // Update state with all uploaded documents
        setPdfs((prev) => ({
          ...prev,
          [selectedDepartmentId]: [
            ...(prev[selectedDepartmentId] ?? []),
            ...allDocs,
          ],
        }));
        setChunksByPdf((prev) => ({ ...prev, ...allChunks }));

        // Auto-select first uploaded doc
        if (allDocs[0]) setSelectedPdfId(allDocs[0].id);

        console.log(`Successfully uploaded ${allDocs.length} files`);

        // Automatically refresh the PDF list to show the latest documents
        await refreshDocuments();
      } catch (error) {
        console.error("Upload error:", error);
        // You might want to show a toast notification here
      } finally {
        setIsUploading(false);
      }
    },
    [
      selectedDepartmentId,
      setPdfs,
      setChunksByPdf,
      setSelectedPdfId,
      refreshDocuments,
    ]
  );

  const copyToClipboard = async (text: string, chunkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChunkId(chunkId);
      setTimeout(() => setCopiedChunkId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDeleteDocument = async (
    documentId: string,
    documentName: string
  ) => {
    try {
      setDeletingDocId(documentId);
      await deleteDocument(documentId);
      console.log(`Document ${documentName} deleted successfully`);
    } catch (error) {
      console.error("Error deleting document:", error);
      // You might want to show an error toast here
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Upload and manage documents by department for training your chatbot
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Department Selection and Management */}
            <div>
              <LeftDeptPanel />
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <div
                className={cn(
                  "rounded-lg border-2 border-dashed p-6 transition-colors",
                  isUploading
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/40"
                )}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <Upload
                      className={cn(
                        "h-6 w-6 text-primary",
                        isUploading && "animate-pulse"
                      )}
                    />
                  </div>
                  <Label
                    htmlFor="pdfs"
                    className={cn(
                      "text-sm font-medium mb-2",
                      isUploading
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    )}
                  >
                    {isUploading ? "Uploading..." : "Upload PDF Documents"}
                  </Label>
                  <Input
                    id="pdfs"
                    type="file"
                    accept="application/pdf"
                    multiple
                    disabled={isUploading}
                    onChange={(e) => onUpload(e.target.files)}
                    className="max-w-xs"
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    {isUploading
                      ? "Please wait while files are being processed..."
                      : "Select multiple PDF files to upload to the current department"}
                  </p>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-medium">
                        Uploading Documents...
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(uploadProgress)}%
                    </Badge>
                  </div>

                  <Progress value={uploadProgress} className="w-full" />

                  {uploadingFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Files being processed:
                      </p>
                      <div className="max-h-16 overflow-y-auto">
                        {uploadingFiles.map((filename, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="truncate">{filename}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Department Documents
                    {currentPdfs.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {currentPdfs.length}
                      </Badge>
                    )}
                  </h3>
                </div>
                <ScrollArea className="h-[300px] rounded-lg border bg-muted/20">
                  {pdfsLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="rounded-full bg-muted/50 p-3 mb-3">
                        <Upload className="h-6 w-6 text-muted-foreground animate-pulse" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Loading Documents
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Please wait while we fetch your files...
                      </p>
                    </div>
                  ) : pdfsError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="rounded-full bg-destructive/10 p-3 mb-3">
                        <FileText className="h-6 w-6 text-destructive" />
                      </div>
                      <p className="text-sm font-medium text-destructive mb-1">
                        Loading Failed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pdfsError}
                      </p>
                    </div>
                  ) : currentPdfs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="rounded-full bg-muted/50 p-3 mb-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {selectedDepartmentId
                          ? "No Documents Found"
                          : "Select Department"}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {selectedDepartmentId
                          ? "Upload PDF files to get started with this department."
                          : "Choose a department above to view its documents."}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {currentPdfs.map((p) => (
                        <div
                          key={p.id}
                          className={cn(
                            "group relative rounded-lg border transition-all duration-200 hover:shadow-sm",
                            p.id === selectedPdfId
                              ? "bg-primary/5 border-primary/20 shadow-sm"
                              : "bg-background border-border/50 hover:bg-muted/50 hover:border-border"
                          )}
                        >
                          <div
                            className="flex items-start gap-3 p-3 cursor-pointer"
                            onClick={() => setSelectedPdfId(p.id)}
                          >
                            {/* File Icon */}
                            <div
                              className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                                p.id === selectedPdfId
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <FileText className="h-5 w-5" />
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={cn(
                                      "text-sm font-medium truncate leading-5",
                                      p.id === selectedPdfId
                                        ? "text-primary"
                                        : "text-foreground"
                                    )}
                                  >
                                    {p.name}
                                  </h4>
                                  {p.createdAt && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Calendar className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(
                                          p.createdAt
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={deletingDocId === p.id}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Document
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "
                                          {p.name}"? This action cannot be
                                          undone and will remove all associated
                                          chunks and data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteDocument(p.id, p.name)
                                          }
                                          style={{ color: "#fff" }}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
                                        >
                                          Delete Document
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          {p.id === selectedPdfId && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Parsed Sections
              {selectedChunks.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {selectedChunks.length} section
                  {selectedChunks.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              {chunksLoading ? (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <div className="relative mb-6">
                    <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-4">
                      <FileText className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                  </div>
                  <p className="text-base font-semibold text-foreground mb-2">
                    Processing Document
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Extracting and parsing chunks...
                  </p>
                </div>
              ) : chunksError ? (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <div className="rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 p-4 mb-6">
                    <FileText className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-base font-semibold text-destructive mb-2">
                    Processing Failed
                  </p>
                  <p className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
                    {chunksError}
                  </p>
                </div>
              ) : selectedChunks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <div className="rounded-full bg-gradient-to-br from-muted/60 to-muted/30 p-4 mb-6">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-base font-semibold text-muted-foreground mb-2">
                    {selectedPdfId
                      ? "No Chunks Available"
                      : "No Document Selected"}
                  </p>
                  <p className="text-sm text-muted-foreground/80 max-w-sm">
                    {selectedPdfId
                      ? "This document doesn't have any parsed chunks yet. Try re-uploading or processing the document."
                      : "Choose a PDF document from the list above to preview its indexed chunks."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {selectedChunks.map((c, idx) => (
                    <Dialog key={c.id}>
                      <DialogTrigger asChild>
                        <div className="group relative p-5 hover:bg-gradient-to-r hover:from-muted/40 hover:to-muted/20 transition-all duration-200 cursor-pointer border-l-2 border-l-transparent hover:border-l-primary/50">
                          {/* Header with chunk info and actions */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono shrink-0 bg-primary/5 border-primary/20 text-primary font-semibold px-2.5 py-1"
                              >
                                <Hash className="h-3 w-3 mr-1.5" />
                                {idx + 1}
                              </Badge>
                              {c.section_title && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs max-w-[180px] bg-muted/60 hover:bg-muted/80 transition-colors"
                                  title={c.section_title}
                                >
                                  <span className="truncate">
                                    {c.section_title}
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-all duration-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(c.content, c.id);
                                }}
                                title="Copy chunk content"
                              >
                                {copiedChunkId === c.id ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title="View full details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Content Preview */}
                          <div className="space-y-3">
                            <div className="relative">
                              <p className="text-sm leading-relaxed text-foreground/85 line-clamp-3 pr-4">
                                {c.content}
                              </p>
                              {c.content.length > 150 && (
                                <div className="absolute bottom-0 right-0 bg-gradient-to-l from-background via-background/80 to-transparent pl-8 pr-1">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    ...
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Footer with metadata */}
                            <div className="flex items-center justify-between pt-3 border-t border-border/20">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {c.start_index !== null &&
                                  c.end_index !== null && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium text-muted-foreground/70">
                                        pos:
                                      </span>
                                      <span className="font-mono bg-muted/40 px-1.5 py-0.5 rounded text-[10px]">
                                        {c.start_index}-{c.end_index}
                                      </span>
                                    </div>
                                  )}
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-muted-foreground/70">
                                    length:
                                  </span>
                                  <span className="font-mono bg-muted/40 px-1.5 py-0.5 rounded text-[10px]">
                                    {c.content.length.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-primary/70 opacity-0 group-hover:opacity-100 transition-all duration-200 font-medium">
                                Click to expand →
                              </span>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent
                        className="max-h-[85vh] overflow-y-auto w-[50rem] max-w-[50rem]"
                        style={{ maxWidth: "50rem" }}
                      >
                        <DialogHeader className="pb-4 border-b border-border/40">
                          <DialogTitle className="flex items-center gap-3 text-lg">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                Chunk #{idx + 1} Details
                                <Badge variant="outline" className="text-xs">
                                  {c.content.length.toLocaleString()} chars
                                </Badge>
                              </div>
                              {c.section_title && (
                                <p className="text-sm text-muted-foreground font-normal mt-1">
                                  {c.section_title}
                                </p>
                              )}
                            </div>
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Full content and metadata for this document chunk
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 pt-2">
                          {/* Enhanced Metadata */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Hash className="h-4 w-4 text-primary" />
                              Metadata
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 border-muted/60">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Document Section
                                  </p>
                                  <p className="text-sm font-medium leading-relaxed">
                                    {c.section_title || (
                                      <span className="text-muted-foreground italic">
                                        No section specified
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </Card>
                              <Card className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 border-muted/60">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Position Range
                                  </p>
                                  <p className="text-sm font-mono font-medium bg-background/60 px-2 py-1 rounded">
                                    {c.start_index !== null &&
                                    c.end_index !== null
                                      ? `${c.start_index!.toLocaleString()} - ${c.end_index!.toLocaleString()}`
                                      : "Not specified"}
                                  </p>
                                </div>
                              </Card>
                              <Card className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 border-muted/60">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Source Document
                                  </p>
                                  <p
                                    className="text-sm font-medium truncate"
                                    title={c.source || "Unknown source"}
                                  >
                                    {c.source || (
                                      <span className="text-muted-foreground italic">
                                        Unknown source
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </Card>
                              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide">
                                    Content Length
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-mono font-bold text-primary">
                                      {c.content.length.toLocaleString()}
                                    </p>
                                    <span className="text-xs text-primary/70">
                                      characters
                                    </span>
                                  </div>
                                </div>
                              </Card>
                            </div>

                            {/* Tags Section */}
                            {c.tags && c.tags.length > 0 && (
                              <Card className="p-4 bg-gradient-to-br from-blue/10 to-blue/5 border-blue/20">
                                <div className="space-y-3">
                                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    Tags
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {c.tags.map((tag, tagIdx) => (
                                      <Badge
                                        key={tagIdx}
                                        variant="secondary"
                                        className="text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-150"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </Card>
                            )}
                          </div>

                          {/* Enhanced Content Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Full Content
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {Math.ceil(c.content.length / 4)} words
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(c.content, `modal-${c.id}`)
                                  }
                                  className="h-8 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30"
                                >
                                  {copiedChunkId === `modal-${c.id}` ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      <span className="text-green-600 font-medium">
                                        Copied!
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-2" />
                                      <span>Copy Content</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Card className="border-muted/40">
                              <ScrollArea className="h-[400px] w-full">
                                <div className="p-6">
                                  <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {c.content}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </ScrollArea>
                            </Card>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-4 border-t border-border/40">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                Chunk ID:{" "}
                                <code className="bg-muted/60 px-1 py-0.5 rounded font-mono">
                                  {c.id}
                                </code>
                              </span>
                              <span>
                                {c.start_index !== null &&
                                  c.end_index !== null && (
                                    <>
                                      Document range:{" "}
                                      {c.start_index!.toLocaleString()} -{" "}
                                      {c.end_index!.toLocaleString()}
                                    </>
                                  )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
