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
    const formatExplanation = (text: string) => {
        return text.replace(/\n/g, '<br>');
    };

    return (
        <CardContent className="pt-6">
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

                {/* User message with animation */}
                <motion.div
                    className="flex items-start gap-3"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        duration: 0.3
                    }}
                >
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                    </Avatar>
                    <motion.div
                        className="flex-1"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25,
                            delay: 0.1
                        }}
                    >
                        <div className="bg-secondary/50 rounded-2xl rounded-tl-sm p-3 inline-block max-w-[85%]">
                            <p className="text-sm">{entry.originalText}</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* AI Response with animation */}
                <motion.div
                    className="space-y-1 pl-11"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        delay: 0.2
                    }}
                >
                    <p className="text-sm font-medium">{entry.newText}</p>
                    <motion.div
                        className="text-sm text-muted-foreground mt-2"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{
                            height: {
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                delay: 0.3
                            },
                            opacity: {
                                duration: 0.2,
                                delay: 0.4
                            }
                        }}
                    >
                        <p
                            dangerouslySetInnerHTML={{ __html: formatExplanation(entry.explanation) }}
                            className="leading-relaxed"
                        />
                    </motion.div>
                </motion.div>

                <motion.p
                    className="text-xs text-muted-foreground pl-11"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.4 }}
                >
                    {new Date(entry.timestamp).toLocaleString()}
                </motion.p>
            </motion.div>
        </CardContent>
    );
}