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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FileText, Hash, Eye, Copy, CheckCircle } from "lucide-react";

const fetcher = (url: string, opts?: any) =>
  fetch(url, opts).then((r) => r.json());

export function DocumentsTab() {
  const {
    selectedDepartmentId,
    pdfs,
    setPdfs,
    pdfsLoading,
    pdfsError,
    chunksByPdf,
    setChunksByPdf,
    chunksLoading,
    chunksError,
    selectedPdfId,
    setSelectedPdfId,
  } = useTrainer();

  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

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
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      fd.append("departmentId", selectedDepartmentId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as {
        docs: { id: string; name: string }[];
        chunks: Record<string, Chunk[]>;
      };
      setPdfs((prev) => ({
        ...prev,
        [selectedDepartmentId]: [
          ...(prev[selectedDepartmentId] ?? []),
          ...data.docs.map((d) => ({
            ...d,
            departmentId: selectedDepartmentId,
          })),
        ],
      }));
      setChunksByPdf((prev) => ({ ...prev, ...data.chunks }));
      // auto-select first uploaded doc
      if (data.docs[0]) setSelectedPdfId(data.docs[0].id);
    },
    [selectedDepartmentId, setPdfs, setChunksByPdf]
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

  return (
    <div></div>
    // <div className="flex flex-col gap-6 p-6">
    //   {/* Header */}
    //   <div>
    //     <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
    //     <p className="text-muted-foreground">
    //       Upload and manage documents by department for training your chatbot
    //     </p>
    //   </div>

    //   <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
    //     <Card>
    //       <CardHeader>
    //         <CardTitle className="text-base">Manage Documents</CardTitle>
    //       </CardHeader>
    //       <CardContent className="space-y-6">
    //         {/* Department Selection and Management */}
    //         <div>
    //           <LeftDeptPanel />
    //         </div>

    //         {/* Upload Section */}
    //         <div className="space-y-4">
    //           <div className="rounded border p-4">
    //             <Label htmlFor="pdfs">Select PDF files</Label>
    //             <Input
    //               id="pdfs"
    //               type="file"
    //               accept="application/pdf"
    //               multiple
    //               onChange={(e) => onUpload(e.target.files)}
    //               className="mt-2"
    //             />
    //             <p className="mt-2 text-xs text-muted-foreground">
    //               Uploads are attached to the currently selected department.
    //             </p>
    //           </div>

    //           <div>
    //             <h3 className="mb-2 text-sm font-medium">Department PDFs</h3>
    //             <ScrollArea className="h-[300px] rounded border p-2">
    //               {pdfsLoading ? (
    //                 <div className="flex items-center justify-center p-4">
    //                   <div className="text-sm text-muted-foreground">
    //                     Loading documents...
    //                   </div>
    //                 </div>
    //               ) : pdfsError ? (
    //                 <div className="rounded border border-destructive/20 bg-destructive/5 p-2">
    //                   <p className="text-xs text-destructive">
    //                     Failed to load documents: {pdfsError}
    //                   </p>
    //                 </div>
    //               ) : currentPdfs.length === 0 ? (
    //                 <p className="text-sm text-muted-foreground">
    //                   {selectedDepartmentId
    //                     ? "No documents found for this department."
    //                     : "Select a department to view documents."}
    //                 </p>
    //               ) : (
    //                 <ul className="space-y-2">
    //                   {currentPdfs.map((p) => (
    //                     <li key={p.id} className="space-y-1">
    //                       <Button
    //                         variant={
    //                           p.id === selectedPdfId ? "default" : "outline"
    //                         }
    //                         size="sm"
    //                         onClick={() => setSelectedPdfId(p.id)}
    //                         className="w-full justify-start text-left"
    //                       >
    //                         {p.name}
    //                       </Button>
    //                       {p.createdAt && (
    //                         <div className="text-xs text-muted-foreground pl-2">
    //                           Uploaded:{" "}
    //                           {new Date(p.createdAt).toLocaleDateString()}
    //                         </div>
    //                       )}
    //                     </li>
    //                   ))}
    //                 </ul>
    //               )}
    //             </ScrollArea>
    //           </div>
    //         </div>
    //       </CardContent>
    //     </Card>

    //     <Card>
    //       <CardHeader className="pb-3">
    //         <CardTitle className="flex items-center gap-2 text-base">
    //           <FileText className="h-4 w-4 text-primary" />
    //           Parsed Chunks
    //           {selectedChunks.length > 0 && (
    //             <Badge variant="outline" className="ml-auto">
    //               {selectedChunks.length} chunk
    //               {selectedChunks.length !== 1 ? "s" : ""}
    //             </Badge>
    //           )}
    //         </CardTitle>
    //       </CardHeader>
    //       <CardContent className="p-0">
    //         <ScrollArea className="h-[480px]">
    //           {chunksLoading ? (
    //             <div className="flex flex-col items-center justify-center p-12 text-center">
    //               <div className="rounded-full bg-muted/50 p-3 mb-3">
    //                 <FileText className="h-6 w-6 text-muted-foreground animate-pulse" />
    //               </div>
    //               <p className="text-sm font-medium text-muted-foreground mb-1">
    //                 Processing Document
    //               </p>
    //               <p className="text-xs text-muted-foreground/70">
    //                 Extracting and parsing chunks...
    //               </p>
    //             </div>
    //           ) : chunksError ? (
    //             <div className="flex flex-col items-center justify-center p-12 text-center">
    //               <div className="rounded-full bg-destructive/10 p-3 mb-3">
    //                 <FileText className="h-6 w-6 text-destructive" />
    //               </div>
    //               <p className="text-sm font-medium text-destructive mb-1">
    //                 Processing Failed
    //               </p>
    //               <p className="text-xs text-muted-foreground">{chunksError}</p>
    //             </div>
    //           ) : selectedChunks.length === 0 ? (
    //             <div className="flex flex-col items-center justify-center p-12 text-center">
    //               <div className="rounded-full bg-muted/50 p-3 mb-3">
    //                 <FileText className="h-6 w-6 text-muted-foreground" />
    //               </div>
    //               <p className="text-sm font-medium text-muted-foreground mb-1">
    //                 {selectedPdfId
    //                   ? "No Chunks Available"
    //                   : "No Document Selected"}
    //               </p>
    //               <p className="text-xs text-muted-foreground/70">
    //                 {selectedPdfId
    //                   ? "This document doesn't have any parsed chunks yet."
    //                   : "Choose a PDF document to preview its indexed chunks."}
    //               </p>
    //             </div>
    //           ) : (
    //             <div className="space-y-0">
    //               {selectedChunks.map((c, idx) => (
    //                 <Dialog key={c.id}>
    //                   <DialogTrigger asChild>
    //                     <div className="border-b border-border/40 last:border-b-0 p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
    //                         {/* Header with chunk info and actions */}
    //                         <div className="flex items-start justify-between mb-3">
    //                           <div className="flex items-center gap-2 flex-1">
    //                             <Badge
    //                               variant="outline"
    //                               className="text-xs font-mono shrink-0"
    //                             >
    //                               <Hash className="h-3 w-3 mr-1" />
    //                               {idx + 1}
    //                             </Badge>
    //                             {c.section_title && (
    //                               <Badge
    //                                 variant="secondary"
    //                                 className="text-xs max-w-[200px] truncate"
    //                               >
    //                                 {c.section_title}
    //                               </Badge>
    //                             )}
    //                           </div>
    //                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    //                             <Button
    //                               variant="ghost"
    //                               size="sm"
    //                               className="h-7 w-7 p-0"
    //                               onClick={(e) => {
    //                                 e.stopPropagation();
    //                                 copyToClipboard(c.content, c.id);
    //                               }}
    //                             >
    //                               {copiedChunkId === c.id ? (
    //                                 <CheckCircle className="h-3 w-3 text-green-600" />
    //                               ) : (
    //                                 <Copy className="h-3 w-3" />
    //                               )}
    //                             </Button>
    //                             <Button
    //                               variant="ghost"
    //                               size="sm"
    //                               className="h-7 w-7 p-0"
    //                               onClick={(e) => e.stopPropagation()}
    //                             >
    //                               <Eye className="h-3 w-3" />
    //                             </Button>
    //                           </div>
    //                         </div>
    //                           <DialogContent className="max-w-4xl max-h-[80vh]">
    //                             <DialogHeader>
    //                               <DialogTitle className="flex items-center gap-2">
    //                                 <FileText className="h-5 w-5" />
    //                                 Chunk #{idx + 1} Details
    //                               </DialogTitle>
    //                               <DialogDescription>
    //                                 Full content and metadata for this document
    //                                 chunk
    //                               </DialogDescription>
    //                             </DialogHeader>
    //                             <div className="space-y-4">
    //                               {/* Metadata */}
    //                               <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
    //                                 <div className="space-y-1">
    //                                   <p className="text-xs font-medium text-muted-foreground">
    //                                     Section
    //                                   </p>
    //                                   <p className="text-sm">
    //                                     {c.section_title || "No section"}
    //                                   </p>
    //                                 </div>
    //                                 <div className="space-y-1">
    //                                   <p className="text-xs font-medium text-muted-foreground">
    //                                     Position
    //                                   </p>
    //                                   <p className="text-sm">
    //                                     {c.start_index !== null &&
    //                                     c.end_index !== null
    //                                       ? `${c.start_index} - ${c.end_index}`
    //                                       : "Not specified"}
    //                                   </p>
    //                                 </div>
    //                                 <div className="space-y-1">
    //                                   <p className="text-xs font-medium text-muted-foreground">
    //                                     Source
    //                                   </p>
    //                                   <p className="text-sm">
    //                                     {c.source || "Unknown"}
    //                                   </p>
    //                                 </div>
    //                                 <div className="space-y-1">
    //                                   <p className="text-xs font-medium text-muted-foreground">
    //                                     Length
    //                                   </p>
    //                                   <p className="text-sm">
    //                                     {c.content.length} characters
    //                                   </p>
    //                                 </div>
    //                               </div>

    //                               {/* Content */}
    //                               <div className="space-y-2">
    //                                 <div className="flex items-center justify-between">
    //                                   <p className="text-sm font-medium">
    //                                     Content
    //                                   </p>
    //                                   <Button
    //                                     variant="outline"
    //                                     size="sm"
    //                                     onClick={() =>
    //                                       copyToClipboard(
    //                                         c.content,
    //                                         `modal-${c.id}`
    //                                       )
    //                                     }
    //                                     className="h-7"
    //                                   >
    //                                     {copiedChunkId === `modal-${c.id}` ? (
    //                                       <>
    //                                         <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
    //                                         Copied
    //                                       </>
    //                                     ) : (
    //                                       <>
    //                                         <Copy className="h-3 w-3 mr-1" />
    //                                         Copy
    //                                       </>
    //                                     )}
    //                                   </Button>
    //                                 </div>
    //                                 <ScrollArea className="h-[300px] w-full rounded border">
    //                                   <div className="p-4">
    //                                     <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
    //                                       {c.content}
    //                                     </p>
    //                                   </div>
    //                                 </ScrollArea>
    //                               </div>
    //                             </div>
    //                           </DialogContent>
    //                         </div>

    //                         {/* Content Preview */}
    //                         <div className="space-y-2">
    //                           <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
    //                             {c.content}
    //                           </p>

    //                           {/* Footer with metadata */}
    //                           <div className="flex items-center justify-between pt-2">
    //                             <div className="flex items-center gap-3 text-xs text-muted-foreground">
    //                               {c.start_index !== null &&
    //                                 c.end_index !== null && (
    //                                   <span>
    //                                     pos: {c.start_index}-{c.end_index}
    //                                   </span>
    //                                 )}
    //                               <span>{c.content.length} chars</span>
    //                             </div>
    //                             <span className="text-xs text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
    //                               Click to view details
    //                             </span>
    //                           </div>
    //                         </div>
    //                       </div>
    //                     </DialogTrigger>
    //                     <DialogContent className="max-w-4xl max-h-[80vh]">
    //                       <DialogHeader>
    //                         <DialogTitle className="flex items-center gap-2">
    //                           <FileText className="h-5 w-5" />
    //                           Chunk #{idx + 1} Details
    //                         </DialogTitle>
    //                         <DialogDescription>
    //                           Full content and metadata for this document chunk
    //                         </DialogDescription>
    //                       </DialogHeader>
    //                       <div className="space-y-4">
    //                         {/* Metadata */}
    //                         <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
    //                           <div className="space-y-1">
    //                             <p className="text-xs font-medium text-muted-foreground">
    //                               Section
    //                             </p>
    //                             <p className="text-sm">
    //                               {c.section_title || "No section"}
    //                             </p>
    //                           </div>
    //                           <div className="space-y-1">
    //                             <p className="text-xs font-medium text-muted-foreground">
    //                               Position
    //                             </p>
    //                             <p className="text-sm">
    //                               {c.start_index !== null &&
    //                               c.end_index !== null
    //                                 ? `${c.start_index} - ${c.end_index}`
    //                                 : "Not specified"}
    //                             </p>
    //                           </div>
    //                           <div className="space-y-1">
    //                             <p className="text-xs font-medium text-muted-foreground">
    //                               Source
    //                             </p>
    //                             <p className="text-sm">
    //                               {c.source || "Unknown"}
    //                             </p>
    //                           </div>
    //                           <div className="space-y-1">
    //                             <p className="text-xs font-medium text-muted-foreground">
    //                               Length
    //                             </p>
    //                             <p className="text-sm">{c.content.length} characters</p>
    //                           </div>
    //                         </div>

    //                         {/* Content */}
    //                         <div className="space-y-2">
    //                           <div className="flex items-center justify-between">
    //                             <p className="text-sm font-medium">Content</p>
    //                             <Button
    //                               variant="outline"
    //                               size="sm"
    //                               onClick={() => copyToClipboard(c.content, `modal-${c.id}`)}
    //                               className="h-7"
    //                             >
    //                               {copiedChunkId === `modal-${c.id}` ? (
    //                                 <>
    //                                   <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
    //                                   Copied
    //                                 </>
    //                               ) : (
    //                                 <>
    //                                   <Copy className="h-3 w-3 mr-1" />
    //                                   Copy
    //                                 </>
    //                               )}
    //                             </Button>
    //                           </div>
    //                           <ScrollArea className="h-[300px] w-full rounded border">
    //                             <div className="p-4">
    //                               <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
    //                                 {c.content}
    //                               </p>
    //                             </div>
    //                           </ScrollArea>
    //                         </div>
    //                       </div>
    //                     </DialogContent>
    //                   </Dialog>
    //                 </div>
    //               ))}
    //             </div>
    //           )}
    //         </ScrollArea>
    //       </CardContent>
    //     </Card>
    //   </div>
    // </div>
  );
}
