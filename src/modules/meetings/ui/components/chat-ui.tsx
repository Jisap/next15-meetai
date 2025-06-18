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
  userImage: string | undefined;
}
import "stream-chat-react/dist/css/v2/index.css";


export const ChatUI = ({ meetingId, meetingName, userId, userName, userImage }: Props) => {
  
  const trpc = useTRPC()
  const { mutateAsync: generateChatToken } = useMutation(      // Se genera un token para la API de Stream Chat
    trpc.meetings.generateChatToken.mutationOptions()
  );

  const [channel, setChannel] = useState<StreamChannel>();     // Se crea un canal para el chat

  const client = useCreateChatClient({                         // Se crea un cliente de chat
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: generateChatToken,
    userData: {
      id: userId,
      name: userName,
      image: userImage,
    }
  })

  useEffect(() => {                                              // Se actualiza el canal cuando se cambie el meetingId
    if(!client) return

    const channel = client.channel("messaging", meetingId, {     // Se crea un canal para el chat de stream -> Dispara el evento "message.new" en el webhook
      members: [userId],                                         // Se agrega el usuario al canal
    })

    setChannel(channel)                                          // Se actualiza el canal
  },[client, meetingId, meetingName, userId])
  
  if(!client){
    return (
      <LoadingState
        title="Loading Chat"
        description="This may take a few seconds"
      />
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* lo que se escribe en MessageInput (por un usuario que no es el agente) inicia una cadena de eventos
       que resulta en una interacción con OpenAI a través de tu webhook, y la respuesta de OpenAI se muestra 
       en el chat. */}
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-23rem)] border-b">
              <MessageList />
            </div>

            <MessageInput />
          </Window>

          <Thread />
        </Channel>
      </Chat>
    </div>
  )
}
