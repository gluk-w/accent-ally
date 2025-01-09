import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [text, setText] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to process text");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Text was processed successfully",
      });
      setText(""); // Clear the textarea
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Text Processor
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your text below and press Cmd+Enter or click the arrow to process.
            </p>
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
    </div>
  );
}
