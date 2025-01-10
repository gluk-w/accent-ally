import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextEntry } from "@/types/history";

interface HistoryItemProps {
  entry: TextEntry;
  onDelete: (id: number) => Promise<void>;
}

export function HistoryItem({ entry, onDelete }: HistoryItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
      exit={{
        opacity: 0,
        height: 0,
        marginBottom: 0,
        transition: { duration: 0.2 }
      }}
      className="border rounded-lg p-4 space-y-2 relative group"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={() => entry.id && onDelete(entry.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
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
  );
}
