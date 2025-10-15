"use client";

import { useMemo, useState } from "react";
import { useTrainer } from "./trainer-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  FileText,
  Hash,
  Target,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Tag,
} from "lucide-react";

export function SelectedChunksPanel() {
  const { messages, selectedMessageId, rerank, setRerank } = useTrainer();
  const answer = useMemo(
    () => messages.find((m) => m.id === selectedMessageId),
    [messages, selectedMessageId]
  );

  console.log("answer", answer);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed by default

  // const applyRerank = async () => {
  //   if (!answer?.citations?.length) return;
  //   setIsLoading(true);
  //   try {
  //     const res = await fetch("/api/rerank", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         method: rerank.method,
  //         weight: rerank.weight,
  //         topK: rerank.topK,
  //         chunks: answer.citations,
  //       }),
  //     });
  //     const data = await res.json();
  //     // We don't mutate context messages here to keep it simple; in a real app you may update it.
  //     // For display, we'll just replace locally via state by reassigning answer.citations (not reactive).
  //     if (answer) answer.citations = data.chunks;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Get relevance score color
  const getScoreColor = (score: number) => {
    if (score >= 0.8)
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    if (score >= 0.6) return "bg-blue-500/10 text-blue-700 border-blue-200";
    if (score >= 0.4) return "bg-amber-500/10 text-amber-700 border-amber-200";
    return "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "High Relevance";
    if (score >= 0.6) return "Good Match";
    if (score >= 0.4) return "Moderate";
    return "Low Relevance";
  };

  return (
    <Card className="overflow-y-auto h-[320px]">
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => setIsCollapsed(!open)}
      >
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              {!answer?.matchedFeedback && (
                <>
                  <span className="text-sm text-muted-foreground">
                    Document Sections Ref:
                  </span>

                  {answer?.citations?.length && (
                    <Badge variant="outline" className="ml-1">
                      {answer.citations.length} section
                      {answer.citations.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </>
              )}

              {answer?.matchedFeedback && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Matched
                </Badge>
              )}
              <ChevronRight
                className={cn(
                  "h-4 w-4 ml-auto transition-transform text-muted-foreground",
                  !isCollapsed && "rotate-90"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0 h-[320px] overflow">
            {!answer ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-muted/50 p-3 mb-3">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No Selection
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Select an answer to see its supporting sections
                </p>
              </div>
            ) : !answer.citations?.length && !answer.matchedFeedback ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-muted/50 p-3 mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No Sections Found
                </p>
                <p className="text-xs text-muted-foreground/70">
                  This answer has no supporting sections
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Matched Feedback Section */}
                {answer.matchedFeedback && (
                  <div className="border-b border-blue-200/50 bg-blue-50/30">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Matched Question & Feedback
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs bg-blue-100 text-blue-700"
                        >
                          {answer.matchedFeedback.feedback_status}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Original Question:
                          </p>
                          <p className="text-sm text-foreground bg-white/60 p-2 rounded border">
                            {answer.matchedFeedback.question}
                          </p>
                        </div>

                        {answer.matchedFeedback.preferred_answer && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Preferred Answer:
                            </p>
                            <p className="text-sm text-foreground bg-green-50/50 p-2 rounded border border-green-200/50">
                              {answer.matchedFeedback.preferred_answer}
                            </p>
                          </div>
                        )}

                        {answer.matchedFeedback.tags &&
                          answer.matchedFeedback.tags.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Tags:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {answer.matchedFeedback.tags.map(
                                  (tag, tagIdx) => (
                                    <Badge
                                      key={tagIdx}
                                      variant="outline"
                                      className="text-xs bg-gray-50"
                                    >
                                      {tag}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                          <span>
                            Type: {answer.matchedFeedback.feedback_type}
                          </span>
                          <span>
                            {new Date(
                              answer.matchedFeedback.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Citations */}
                {!answer.matchedFeedback &&
                  answer.citations.map((c, idx) => (
                    <div
                      key={c.id}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      <div className="p-4 hover:bg-muted/30 transition-colors">
                        {/* Header with ranking and score */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {c.reference || `[${idx + 1}]`}
                            </Badge>
                            {c.section_title && (
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                {c.section_title}
                              </span>
                            )}
                          </div>
                          <Badge
                            className={cn(
                              "text-xs font-medium border",
                              getScoreColor(c.score ?? 0)
                            )}
                          >
                            {(c.score ?? 0).toFixed(3)}
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed text-foreground/90">
                            {c.content}
                          </p>

                          {/* Footer with metadata */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {c.source && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span
                                    className="truncate max-w-[120px]"
                                    title={c.source}
                                  >
                                    {c.source}
                                  </span>
                                </div>
                              )}
                              {c.start_index !== null &&
                                c.end_index !== null && (
                                  <span className="text-xs text-muted-foreground/60">
                                    pos: {c.start_index}-{c.end_index}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {/* <ScrollArea className="h-[320px]"></ScrollArea> */}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
