import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { CallLobby } from "./call-lobby";
import "@stream-io/video-react-sdk/dist/css/styles.css"
import { CallActive } from "./call-active";

interface Props {
  meetingName: string;
}

export const CallUI = ({ meetingName }: Props) => {
  const call = useCall(); // instancia de la llamada actual
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

  const handleJoin = async () => {
    if(!call) return;

    await call.join(); // Inicia el proceso de unirse a la llamada, cuando se resuelve la promesa se inicia la llamada

    setShow("call");   // Cambia el estado de la vista a "call" -> nuevo renderizado -> componente de call
  }

  const handleLeave = async () => {
    if(!call) return;

    call.endCall();

    setShow("ended");
  }
  
  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && <CallActive onLeave={handleLeave}  meetingName={meetingName} />}
      {show === "ended" && <p>Ended</p>}
    </StreamTheme>
  )
}

