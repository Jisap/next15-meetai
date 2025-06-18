import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { Channel as StreamChannel } from "stream-chat"

import {
  useCreateChatClient,
  Chat,
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window
}from "stream-chat-react"

interface Props {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string | null | undefined;
}
import "stream-chat-react/dist/css/v2/index.css";


export const ChatUI = ({ meetingId, meetingName, userId, userName, userImage }: Props) => {
  return (
    <div>ChatUI</div>
  )
}
