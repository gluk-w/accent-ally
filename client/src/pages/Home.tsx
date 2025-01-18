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
  return (
    <div className="min-h-screen w-full flex flex-col bg-background p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-4">Local Tone</h1>
          <p className="text-sm text-muted-foreground">
            Welcome to Local Tone! Start by entering your text to process.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}