"use client";

import { useMemo, useState } from "react";
import { useTrainer } from "./trainer-context";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ThumbsUp,
  ThumbsDown,
  Flag,
  Edit3,
  Save,
  CheckCircle,
} from "lucide-react";

export function ReviewTools() {
  const { messages, selectedMessageId, setMessages, saveFeedback } =
    useTrainer();
  const msgIndex = useMemo(
    () => messages.findIndex((m) => m.id === selectedMessageId),
    [messages, selectedMessageId]
  );
  const message = msgIndex >= 0 ? messages[msgIndex] : undefined;

  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleQuality = (q: "good" | "bad") => {
    if (!message) return;
    setMessages((prev) => {
      const next = [...prev];
      next[msgIndex] = { ...prev[msgIndex], quality: q };
      return next;
    });
  };

  const addTag = () => {
    if (!message || !tagInput.trim()) return;
    setMessages((prev) => {
      const next = [...prev];
      const tags = new Set([...(prev[msgIndex].tags ?? []), tagInput.trim()]);
      next[msgIndex] = { ...prev[msgIndex], tags: Array.from(tags) };
      return next;
    });
    setTagInput("");
  };

  const savePreferred = (value: string) => {
    if (!message) return;
    setMessages((prev) => {
      const next = [...prev];
      next[msgIndex] = { ...prev[msgIndex], preferred: value };
      return next;
    });
  };

  const handleSaveFeedback = async () => {
    if (!message) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await saveFeedback(message.id);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save feedback:", error);
      // You might want to show an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-fit max-h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-base">Review Tools</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="space-y-4">
          {!message ? (
            <p className="text-sm text-muted-foreground">
              Select an assistant answer to review it.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant={message.quality === "good" ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleQuality("good")}
                  className="flex items-center gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Well Done
                </Button>
                <Button
                  variant={message.quality === "bad" ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleQuality("bad")}
                  className="flex items-center gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Needs Work
                </Button>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">Tags</div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {(message.tags ?? []).map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <Button variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Preferred Response</div>
                <Textarea
                  placeholder="Write or paste the preferred response..."
                  value={message.preferred ?? ""}
                  onChange={(e) => savePreferred(e.target.value)}
                  className="min-h-[140px]"
                />
              </div>
            </>
          )}
        </CardContent>
      </ScrollArea>
      <CardFooter className="border-t flex flex-shrink-0 justify-between gap-2">
        {/* <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Flag className="h-4 w-4" />
            Flag for Review
          </Button>
        </div> */}

        {message && (
          <Button
            onClick={handleSaveFeedback}
            disabled={isSaving || !message}
            variant={saveSuccess ? "outline" : "default"}
            size="sm"
            className="flex items-center gap-2"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Complete Review"}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
