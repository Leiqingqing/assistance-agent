"use client";

import { useState } from "react";
import { ChatPanel } from "./chat-panel";
import { ConversationSidebar } from "./component/conversation-sidebar";
import { inboxConversations } from "./inbox-conversations";

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState(inboxConversations[0].id);
  const selectedConversation =
    inboxConversations.find((conversation) => conversation.id === selectedId) ??
    inboxConversations[0];

  return (
    <main className="grid h-svh min-h-[40rem] grid-rows-[17rem_minmax(0,1fr)] overflow-hidden bg-background text-foreground lg:grid-cols-[22rem_minmax(0,1fr)] lg:grid-rows-1">
      <ConversationSidebar
        conversations={inboxConversations}
        onSelect={setSelectedId}
        selectedId={selectedConversation.id}
      />

      <ChatPanel
        conversation={selectedConversation}
        key={selectedConversation.id}
      />
    </main>
  );
}
