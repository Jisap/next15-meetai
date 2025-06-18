
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
import { inngest } from "@/app/inngest/client";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

const openaiClient = new OpenAI({apiKey: process.env.OPENAI_API_KEY!});

function verifySignatureWithSDK(                    // Comprueba si la solicitud realmente proviene de Stream y no ha sido manipulada
  body: string,                                     // Recibe el cuerpo de la solicitud y                   
  signature: string,                                // la firma que Steam envía en las cabeceras
): boolean {
  return streamVideo.verifyWebhook(body, signature) // verifywbhook valida si la firma es válida (true)
}


// Manejador de eventos de Stream Video. Se ejecuta cuando Stream envía una solicitud POST a la url /api/webhook

export async function POST(req: NextRequest){

  const signature = req.headers.get("x-signature");          // Obtiene la firma de la solicitud
  const apikey = req.headers.get("x-api-key");               // Obtiene la clave de API de Stream

  if(!signature || !apikey){
    return NextResponse.json(
      { error: "Missing signature or apikey" },
      { status: 400 }
    )
  }

  const body = await req.text();                              // Obtiene el cuerpo de la solicitud como texto plano porque la verificación se basa en el contenido exacto


  if(!verifySignatureWithSDK(body, signature)){               // Verifica si la firma es válida
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    )
  }

  let payload: unknown;

  try{
    payload = JSON.parse(body) as Record<string, unknown>;     // Se parsea el cuerpo de la solicitud (que es una cadena de texto con formato JSON) para convertirlo en un objeto JavaScript.
  }catch{
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    )
  }

  const eventType = (payload as Record<string, unknown>)?.type; // Extrae la prop type del objeto payload. type nos indica que tipo de evento ha ocurrido

  if(eventType === "call.session_started"){                     // Si el evento es call.session_started ( se inicia la llamada )
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

    await db                                                       // Se actualiza el estado de la reunión en la base de datos
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

    const call = streamVideo.video.call("default", meetingId)       // Se obtiene una instancia de la llamada de stream video con el id del meeting, lo cual nos permite interactuar con esa llamada

    const realtimeClient = await streamVideo.video.connectOpenAi({  // como conectarse con OpenAI -> transcripción de la conversación
      call,
      openAiApiKey: process.env.OPENAI_API_KEY!,
      agentUserId: existingAgent.id,
    })

    realtimeClient.updateSession({                                   // Se actualiza la sesión de OpenAI. En este punto tenemos la llamada de streamVideo activa y conectada a OpenAI. Lo siguiente es que se desarrolle y que termine lo cual disparará el evento "call.session_ended"
      instructions: existingAgent.instructions
    })
  
  } else if (eventType === "call.session_participant_left") {
    
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1];                  // call_cid is formatted as "type:id"

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
    const event = payload as CallTranscriptionReadyEvent;              // Si el evento es callTRanscriptionReadyEvent (despues de finalizar la reunión)
    const meetingId = event.call_cid.split(":")[1];                    // call_cid is formatted as "type:id"

    const [updatedMeeting] = await db                                  // Se actualiza el estado de la reunión en la base de datos
      .update(meetings)
      .set({                                                           // estableciendo la prop transcriptUrl con la url de la transcripción
        transcriptUrl: event.call_transcription.url,
      })
      .where(
        eq(meetings.id, meetingId)
      )
      .returning()
      
      if(!updatedMeeting){
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 }
        )
      }

      await inngest.send({                                             // Se envia un evento a Inngest para que inicie la tarea de enrriquecimiento de la transcripción
        name: "meetings/processing",                                   // Para ello se invoca la function "mmeetings/processing" de inngest
        data: {
          meetingId: updatedMeeting.id,
          transcriptingUrl: updatedMeeting.transcriptUrl
        }
      })

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

  } else if (eventType === "message.new") {                            // Si se crea en chat-UI un canal para el chat de stream -> Dispara el evento "message.new"
      
      const event = payload as MessageNewEvent;                        // se convierte el payload en un objeto de tipo MessageNewEvent para acceder a sus propiedades de forma segura

      const userId = event.user?.id;                                   // Se extrae el id del usuario que envió el mensaje
      const channelId = event.channel_id;                              // Se extrae el id del canal en el que se envió el mensaje
      const text = event.message?.text;                                // Se extrae el texto del mensaje


      if(!userId || !channelId || !text){
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        )
      }

      const [existingMeeting] = await db                               // Se busca en la base de datos si existe un meeting con el id especificado
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, channelId),
            eq(meetings.status, "completed")
          )
        )

      if(!existingMeeting){
        return NextResponse.json(
          { error: "Meeting not found" },
          { status: 404 }
        )
      } 
      
      const [existingAgent] = await db                                // Se busca en tabla agents si existe un agente asociado al meeting
        .select()
        .from(agents)
        .where(
          eq(agents.id, existingMeeting.agentId)
        )

      if(!existingAgent){
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        )
      }

      if(userId !== existingAgent.id){ // Si el usuario que envió el mensaje no es el agente del meeting...

        const instructions =  `
          You are an AI assistant helping the user revisit a recently completed meeting.
          Below is a summary of the meeting, generated from the transcript:
      
          ${existingMeeting.summary}
      
          The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
      
          ${existingAgent.instructions}
      
          The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
          Always base your responses on the meeting summary above.
      
          You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
      
          If the summary does not contain enough information to answer a question, politely let the user know.
      
          Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
        `;

        const channel = streamChat.channel("messaging", channelId);        // Se obtiene una instancia del canal de chat específico donde se envió el mensaje.
        await channel.watch();                                             // Nos aseguramos que el cliente esté suscrito a las actualizaciones en tiempo real de este canal. Esto es necesario para acceder al estado actual del canal, como los mensajes anteriores.

        const previousMessages = channel.state.messages                    // Se extraen los mensajes anteriores del canal
          .slice(-5)                                                       //   - Se extraen los últimos 5 mensajes
          .filter((msg) => msg.text && msg.text.trim() !== "")             //   - Se filtran mensajes vacíos o que solo contengan espacios en blanco.
          .map<ChatCompletionMessageParam>((message) => ({                 //   - Se transforman en objetos de tipo ChatCompletionMessageParam para que OpenAI pueda procesarlos.
            role: (message.user?.id === existingAgent.id ? "assistant" : "user"),
            content: message.text || ""
          }))

        const GPTResponse = await openaiClient.chat.completions.create({   // Se envía una solicitud POST a la API de OpenAI para obtener una respuesta del chat
          messages: [
            {role: "system", content: instructions},
            ...previousMessages,
            {role: "user", content: text}
          ],
          model: "gpt-4o"
        })

        const GPTResponseText = GPTResponse.choices[0].message.content;   // Se extrae el texto de la respuesta de OpenAI

        if(!GPTResponseText){
          return NextResponse.json(
            { error: "No response from GPT" },
            { status: 400 }
          )
        }

        const avatarUrl = generateAvatarUri({                             // Se genera un avatar para el agente
          seed: existingAgent.name,
          variant: "bottsNeutral"
        })

        streamChat.upsertUser({                                           // Se actualiza el usuario en la plataforma de StreamChat
          id: existingAgent.id,
          name: existingAgent.name,
          image: avatarUrl
        })

        channel.sendMessage({                                            // Se envía un mensaje al canal de chat
          text: GPTResponseText,
          user: {
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl
          }
        })
      }
    }
  return NextResponse.json({ status: "ok" });
}
