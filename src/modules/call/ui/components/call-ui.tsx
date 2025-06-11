import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { CallLobby } from "./call-lobby";
import "@stream-io/video-react-sdk/dist/css/styles.css"

interface Props {
  meetingName: string;
}

export const CallUI = ({ meetingName }: Props) => {
  const call = useCall(); 
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

  const handleJoin = async () => {
    if(!call) return;

    await call.join();

    setShow("call");
  }

  const handleLeave = async () => {
    if(!call) return;

    call.endCall();

    setShow("ended");
  }
  
  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && <p>Call</p>}
      {show === "ended" && <p>Ended</p>}
    </StreamTheme>
  )
}

