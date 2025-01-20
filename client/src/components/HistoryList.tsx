import { AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { HistoryItem } from "./HistoryItem";
import { TextEntry } from "@/types/history";

interface HistoryListProps {
  entries: TextEntry[];
  onDelete: (id: number) => Promise<void>;
}

export function HistoryList({ entries, onDelete }: HistoryListProps) {
  if (entries.length === 0) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <HistoryItem
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
