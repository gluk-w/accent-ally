import { useState } from "react";
import { Settings } from "@/components/Settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";

function App() {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      // Temporary placeholder for API integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Development Mode",
        description: "API integration will be added soon.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Local Tone</h1>
              <p className="text-sm text-muted-foreground">
                Enter your text below to process.
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
              disabled={isProcessing}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleProcess}
                disabled={!text.trim() || isProcessing}
              >
                {isProcessing ? (
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

export default App;