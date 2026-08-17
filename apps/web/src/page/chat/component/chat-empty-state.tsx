import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Sparkles } from "lucide-react";

const suggestions = [
  "帮我概括客户的诉求",
  "起草一封礼貌的回复",
  "给出下一步处理建议",
] as const;

export function ChatEmptyState({
  onSelectSuggestion,
}: {
  onSelectSuggestion: (suggestion: string) => void;
}) {
  return (
    <Card className="my-auto w-full bg-card/80">
      <CardHeader className="items-center text-center">
        <Avatar className="size-14 rounded-2xl shadow-sm">
          <AvatarFallback className="rounded-2xl bg-secondary text-secondary-foreground">
            <Sparkles className="size-6" />
          </AvatarFallback>
        </Avatar>
        <CardTitle>如何协助处理这条消息？</CardTitle>
        <CardDescription className="max-w-xl">
          我已获得当前邮件的主题、发送方与摘要，可以帮你整理诉求、分析问题或起草回复。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <Button
            className="rounded-full"
            key={suggestion}
            onClick={() => onSelectSuggestion(suggestion)}
            size="sm"
            variant="outline"
          >
            {suggestion}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
