"use client";

import { useMemo } from "react";
import { useTrainer } from "./trainer-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function DocumentsSelector() {
  const {
    selectedDepartmentId,
    pdfs,
    pdfsLoading,
    pdfsError,
    selectedDocumentsForChat,
    setSelectedDocumentsForChat,
  } = useTrainer();

  const currentPdfs = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return pdfs[selectedDepartmentId] ?? [];
  }, [pdfs, selectedDepartmentId]);

  const handleDocumentToggle = (documentId: string, checked: boolean) => {
    setSelectedDocumentsForChat((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedDocumentsForChat((prev) => {
      if (checked) {
        return new Set([...prev, ...currentPdfs.map((pdf) => pdf.id)]);
      } else {
        const newSet = new Set(prev);
        currentPdfs.forEach((pdf) => newSet.delete(pdf.id));
        return newSet;
      }
    });
  };

  const selectedCount = currentPdfs.filter((pdf) =>
    selectedDocumentsForChat.has(pdf.id)
  ).length;

  const allCurrentSelected =
    currentPdfs.length > 0 &&
    currentPdfs.every((pdf) => selectedDocumentsForChat.has(pdf.id));

  const someCurrentSelected = currentPdfs.some((pdf) =>
    selectedDocumentsForChat.has(pdf.id)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Documents for Chat</CardTitle>
          {selectedCount > 0 && (
            <Badge variant="secondary">{selectedCount} selected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pdfsLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">
              Loading documents...
            </div>
          </div>
        ) : pdfsError ? (
          <div className="rounded border border-destructive/20 bg-destructive/5 p-2">
            <p className="text-xs text-destructive">
              Failed to load documents: {pdfsError}
            </p>
          </div>
        ) : currentPdfs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {selectedDepartmentId
              ? "No documents found for this department."
              : "Select a department to view documents."}
          </p>
        ) : (
          <div className="space-y-3">
            {/* Select All Checkbox */}
            {/* <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={allCurrentSelected}
                onCheckedChange={handleSelectAll}
                className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                {...(someCurrentSelected && !allCurrentSelected ? { "data-state": "indeterminate" } : {})}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All Documents
              </label>
            </div> */}

            {/* Documents List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {currentPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-start space-x-2 border-b last:border-b-0 pb-2"
                  >
                    {/* <Checkbox
                      id={`doc-${pdf.id}`}
                      checked={selectedDocumentsForChat.has(pdf.id)}
                      onCheckedChange={(checked) =>
                        handleDocumentToggle(pdf.id, checked as boolean)
                      }
                    /> */}
                    <div className="grid gap-1 flex-1 min-w-0">
                      <label
                        htmlFor={`doc-${pdf.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {pdf.name}
                      </label>
                      {pdf.createdAt && (
                        <div className="text-xs text-muted-foreground">
                          Uploaded:{" "}
                          {new Date(pdf.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
