import { TextEntry } from "@/types/history";
import { db } from "../db";
import { useToast } from "@/hooks/use-toast";

export const useHistoryService = () => {
  const { toast } = useToast();

  const deleteEntry = async (id: number) => {
    try {
      await db.deleteEntry(id);
      // Update local state after deletion
      const newEntries = await db.getAllEntries();
      const sortedEntries = newEntries.sort((a, b) => b.timestamp - a.timestamp);
      
      toast({
        title: "Deleted",
        description: "History item removed successfully",
      });
      
      return sortedEntries;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete history item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAllEntries = async () => {
    try {
      const entries = await db.getAllEntries();
      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load history items",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addEntry = async (entry: Omit<TextEntry, "id">) => {
    try {
      await db.addEntry(entry);
      return await getAllEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add history item",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    deleteEntry,
    getAllEntries,
    addEntry,
  };
};
