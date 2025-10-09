"use client";

import { useMemo } from "react";
import { useTrainer } from "./trainer-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeftDeptPanel({
  showUploadHint = false,
}: {
  showUploadHint?: boolean;
}) {
  const {
    departments,
    departmentsLoading,
    departmentsError,
    selectedDepartmentId,
    setSelectedDepartmentId,
    pdfs,
  } = useTrainer();

  const currentPdfs = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return pdfs[selectedDepartmentId] ?? [];
  }, [pdfs, selectedDepartmentId]);

  return (
    <aside className="flex h-full w-full flex-col gap-4">
      <section>
        <h3 className="mb-2 text-sm font-medium">Departments</h3>
        {departmentsLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">
              Loading departments...
            </div>
          </div>
        ) : departmentsError ? (
          <div className="rounded border border-destructive/20 bg-destructive/5 p-2">
            <p className="text-xs text-destructive">
              Failed to load departments: {departmentsError}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Using fallback departments
            </p>
          </div>
        ) : (
          <Select
            value={selectedDepartmentId || ""}
            onValueChange={setSelectedDepartmentId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a department..." />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </section>

      {/* <section className="mt-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">PDFs</h3>
          {showUploadHint ? (
            <Badge variant="secondary">Upload in Documents tab</Badge>
          ) : null}
        </div>
        <ScrollArea className="h-[240px] rounded border p-2">
          {currentPdfs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PDFs yet.</p>
          ) : (
            <ul className="space-y-2">
              {currentPdfs.map((p) => (
                <li key={p.id} className="truncate text-sm">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </section> */}

      {/* <section className="mt-auto">
        <h3 className="mb-2 text-sm font-medium">Quick Filter</h3>
        <Input placeholder="Search title..." className="h-8" />
      </section> */}
    </aside>
  );
}
