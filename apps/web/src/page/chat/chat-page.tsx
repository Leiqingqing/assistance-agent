"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { listAgentCompanions } from "@/api/chat";
import { ChatPanel } from "./chat-panel";
import { AgentSidebar } from "./component/agent-list-sidebar";

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const agentsQuery = useQuery({
    queryKey: ["agent-companions"],
    queryFn: listAgentCompanions,
  });
  const agents = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
  const selectedAgent =
    agents.find((agent) => agent.id === selectedId) ?? agents[0] ?? null;

  useEffect(() => {
    if (selectedId === null && agents[0]) {
      setSelectedId(agents[0].id);
    }
  }, [agents, selectedId]);

  return (
    <main className="grid h-svh min-h-[40rem] grid-rows-[17rem_minmax(0,1fr)] overflow-hidden bg-background text-foreground lg:grid-cols-[22rem_minmax(0,1fr)] lg:grid-rows-1">
      <AgentSidebar
        agents={agents}
        onSelect={setSelectedId}
        selectedId={selectedAgent?.id ?? null}
      />

      {selectedAgent ? (
        <ChatPanel agent={selectedAgent} key={selectedAgent.id} />
      ) : (
        <section className="grid min-h-0 place-items-center bg-card px-6 text-center text-muted-foreground">
          {agentsQuery.isPending ? (
            <p className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载 Agent…
            </p>
          ) : agentsQuery.isError ? (
            <p>Agent 列表加载失败，请确认登录状态和 API 服务。</p>
          ) : (
            <p>还没有可对话的 Agent。</p>
          )}
        </section>
      )}
    </main>
  );
}
