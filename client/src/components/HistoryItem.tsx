import { motion } from "framer-motion";
import { Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextEntry } from "@/types/history";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        transition: { duration: 0.2 },
      }}
      className="border rounded-lg p-4 space-y-4 relative group"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={() => entry.id && onDelete(entry.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      {/* User message */}
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-secondary/50 rounded-2xl rounded-tl-sm p-3 inline-block max-w-[85%]">
            <p className="text-sm">{entry.originalText}</p>
          </div>
        </div>
      </div>

      {/* AI Response */}
      <div className="space-y-1 pl-11">
        <p className="text-sm font-medium">{entry.newText}</p>
        <div className="text-sm text-muted-foreground border-l-2 pl-2 mt-2">
          <p>{entry.explanation}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground pl-11">
        {new Date(entry.timestamp).toLocaleString()}
      </p>
    </motion.div>
  );
}