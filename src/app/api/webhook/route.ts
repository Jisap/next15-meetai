
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  CallEndedEvent,
  MessageNewEvent,
  CallTranscriptionReadyEvent,
  CallSessionParticipantLeftEvent,
  CallRecordingReadyEvent,
  CallSessionStartedEvent,
} from "@stream-io/node-sdk";
import { db } from "@/db";
import { agents, meetings } from '../../../db/schema';
import { streamVideo } from "@/lib/stream-video";

function verifySignatureWithSDK(                    // Comprueba si la solicitud realmente proviene de Stream y no ha sido manipulada
  body: string,                                     // Recibe el cuerpo de la solicitud y                   
  signature: string,                                // la firma que Steam envía en las cabeceras
): boolean {
  return streamVideo.verifyWebhook(body, signature) // verifywbhook valida si la firma es válida (true)
}


// Manejador de eventos de Stream Video. Se ejecuta cuando Stream envía una solicitud POST a la url /api/webhook

export async function POST(req: NextRequest){

  const signature = req.headers.get("x-signature");    // Obtiene la firma de la solicitud
  const apikey = req.headers.get("x-api-key");         // Obtiene la clave de API de Stream

  if(!signature || !apikey){
    return NextResponse.json(
      { error: "Missing signature or apikey" },
      { status: 400 }
    )
  }

  const body = await req.text();                       // Obtiene el cuerpo de la solicitud como texto plano porque la verificación se basa en el contenido exacto


  if(!verifySignatureWithSDK(body, signature)){        // Verifica si la firma es válida
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    )
  }

  let payload: unknown;

  try{
    payload = JSON.parse(body) as Record<string, unknown>; // Se parsea el cuerpo de la solicitud (que es una cadena de texto con formato JSON) para convertirlo en un objeto JavaScript.
  }catch{
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    )
  }

  const eventType = (payload as Record<string, unknown>)?.type; // Extrae la prop type del objeto payload. type nos indica que tipo de evento ha ocurrido

  if(eventType === "call.session_started"){                     // Si el evento es call.session_started 
    const event = payload as CallSessionStartedEvent;           // se convierte el payload en un objeto de tipo CallSessionStartedEvent para acceder a sus propiedades de forma segura
    const meetingId = event.call.custom?.meetingId;             // Se extrae el meetingId personalizado que se estableció al crear la llamada

    if(!meetingId){
      return NextResponse.json(
        { error: "Missing meetingId" },
        { status: 400 }
      )
    }

    const [existingMeeting] = await db                           // Se busca en la base de datos si existe un meeting con el id especificado
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, "completed")),
          not(eq(meetings.status, "active")),
          not(eq(meetings.status, "cancelled")),
          not(eq(meetings.status, "processing")),
        )
      )
      

    if(!existingMeeting){
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      )
    }

    await db                                                      // Se actualiza el estado de la reunión en la base de datos
      .update(meetings)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(meetings.id, existingMeeting.id))

    const[existingAgent] = await db                                // Se busca en tabla agents si existe un agente asociado al meeting
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId))
    
    if(!existingAgent){
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    const call = streamVideo.video.call("default", meetingId)       // Se crea una nueva llamada de stream video con el id del meeting

    const realtimeClient = await streamVideo.video.connectOpenAi({  // Se conecta la llamada a OpenAI
      call,
      openAiApiKey: process.env.OPENAI_API_KEY!,
      agentUserId: existingAgent.id,
    })

    realtimeClient.updateSession({                                   // Se actualiza la sesión de OpenAI
      instructions: existingAgent.instructions
    })
  
  } else if (eventType === "call.session_participant_left") {
    
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing meetingId" },
        { status: 400 }
      )
    }

    const call = streamVideo.video.call("default", meetingId);
    await call.end();
  
  } else if (eventType === "call.session_ended"){                     // Si el evento es call.session_ended
    
    const event = payload as CallEndedEvent;                           
    const meetingId = event.call.custom?.meetingId

    if(!meetingId){
      return NextResponse.json(
        { error: "Missing meetingId" },
        { status: 400 }
      )
    }

    await db                                                          // Se actualiza el estado de la reunión en la base de datos
      .update(meetings)
      .set({
        status: "processing",
        endedAt: new Date(),
      })
      .where(
        and(
          eq(meetings.id, meetingId),
          eq(meetings.status, "active"),
        )
      )
  } else if (eventType === "call.transcription_ready"){
    const event = payload as CallTranscriptionReadyEvent;              // Si el evento es callTRanscriptionReadyEvent
    const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

    const [updateMeeting] = await db                                    // Se actualiza el estado de la reunión en la base de datos
      .update(meetings)
      .set({                                                            // estableciendo la prop transcriptUrl con la url de la transcripción
        transcriptUrl: event.call_transcription.url,
      })
      .where(
        eq(meetings.id, meetingId)
      )
      .returning()
      
      if(!updateMeeting){
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 }
        )
      }

      //TODO: Call Ingest background job to summarize the transcript

  } else if (eventType === "call.recording_ready"){                    // Si el evento es call.recording_ready
    const event = payload as CallRecordingReadyEvent;              
    const meetingId = event.call_cid.split(":")[1];

    await db                                                            // Se actualiza el estado de la reunión en la base de datos
      .update(meetings)
      .set({                                                            // estableciendo la prop recordingUrl con la url de la grabación
        recordingUrl: event.call_recording.url,
      })
      .where(
        eq(meetings.id, meetingId)
      )
    }


  return NextResponse.json({ status: "ok" });
}
