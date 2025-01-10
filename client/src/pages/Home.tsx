import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@/components/Settings";
import { db } from "@/lib/db";

interface TextEntry {
  id?: number;
  originalText: string;
  newText: string;
  explanation: string;
  timestamp: number;
}

export default function Home() {
  const [text, setText] = useState("");
  const { toast } = useToast();
  const [entries, setEntries] = useState<TextEntry[]>([]);

  // Load entries from IndexedDB
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const loadedEntries = await db.getAllEntries();
        setEntries(loadedEntries.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error("Failed to load entries:", error);
      }
    };
    loadEntries();
  }, []);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const settings = JSON.parse(
        localStorage.getItem("localToneSettings") || "{}",
      );

      const response = await fetch("https://api.localtone.ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
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

      await db.addEntry(entry);

      // Update local state
      const newEntries = await db.getAllEntries();
      setEntries(newEntries.sort((a, b) => b.timestamp - a.timestamp));

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Text was processed successfully",
      });
      setText(""); // Clear the textarea
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
      await db.deleteEntry(id);
      // Update local state after deletion
      const newEntries = await db.getAllEntries();
      setEntries(newEntries.sort((a, b) => b.timestamp - a.timestamp));
      toast({
        title: "Deleted",
        description: "History item removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete history item",
        variant: "destructive",
      });
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
              <h1 className="text-2xl font-bold text-foreground">Local Tone</h1>
              <p className="text-sm text-muted-foreground">
                Enter your text below and press Cmd+Enter or click the arrow to
                process.
              </p>
            </div>
            <Settings />
          </div>

          <div className="space-y-4">
            <Textarea
              placeholder="Type your text here..."
              className="min-h-[200px] resize-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={mutation.isPending}
            />

            <div className="flex justify-end">
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

      {/* History Section */}
      {entries.length > 0 && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">History</h2>
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                      transition: { duration: 0.2 }
                    }}
                    className="border rounded-lg p-4 space-y-2 relative"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      onClick={() => entry.id && handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Original:</p>
                      <p className="text-sm">{entry.originalText}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Corrected:</p>
                      <p className="text-sm font-medium">{entry.newText}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Explanation:</p>
                      <p className="text-sm">{entry.explanation}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}