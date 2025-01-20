import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@/components/Settings";
import { HistoryList } from "@/components/HistoryList";
import { TextEntry } from "@/types/history";
import { useHistoryService } from "@/lib/services/historyService";

const MAX_CHARS = 1000;

export default function Home() {
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const { toast } = useToast();
  const [entries, setEntries] = useState<TextEntry[]>([]);
  const historyService = useHistoryService();

  // Load entries from IndexedDB
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const loadedEntries = await historyService.getAllEntries();
        setEntries(loadedEntries);
      } catch (error) {
        console.error("Failed to load entries:", error);
      }
    };
    loadEntries();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHARS) {
      setText(newValue);
    }
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHARS) {
      setContext(newValue);
    }
  };

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const settings = JSON.parse(
        localStorage.getItem("accentAllySettings") || "{}",
      );

      const response = await fetch("https://api.accentally.net", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          context: context.trim() || undefined,
          language: settings.language || "american",
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Failed to process text");
      }

      const data = await response.json();

      // Store in IndexedDB
      const entry: Omit<TextEntry, "id"> = {
        originalText: text,
        newText: data.new_text,
        explanation: data.explanation,
        timestamp: Date.now(),
      };

      const updatedEntries = await historyService.addEntry(entry);
      setEntries(updatedEntries);

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Text was processed successfully",
      });
      setText(""); // Clear the textarea
      setContext(""); // Clear the context
      setShowContext(false); // Hide the context textarea
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: number) => {
    try {
      const updatedEntries = await historyService.deleteEntry(id);
      setEntries(updatedEntries);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (text.trim()) {
          mutation.mutate(text);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [text, mutation]);

  const handleSubmit = () => {
    if (text.trim()) {
      mutation.mutate(text);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background p-4 gap-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Accent Ally</h1>
              <p className="text-sm text-muted-foreground">
                Enter your text below and press Cmd+Enter or click the arrow to
                process.
              </p>
            </div>
            <Settings />
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Textarea
                placeholder="Type your text here..."
                className="min-h-[200px] resize-none"
                value={text}
                onChange={handleTextChange}
                disabled={mutation.isPending}
              />
              <p className="text-sm text-muted-foreground text-right">
                {text.length}/{MAX_CHARS}
              </p>
            </div>

            <AnimatePresence>
              {showContext && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="space-y-1">
                    <Textarea
                      placeholder="Add context to help with the tone adjustment..."
                      className="min-h-[100px] resize-none"
                      value={context}
                      onChange={handleContextChange}
                      disabled={mutation.isPending}
                    />
                    <p className="text-sm text-muted-foreground text-right">
                      {context.length}/{MAX_CHARS}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowContext(!showContext)}
              >
                Add context {showContext ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || mutation.isPending}
                className="w-16"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <HistoryList entries={entries} onDelete={handleDelete} />
    </div>
  );
}