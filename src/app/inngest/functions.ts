import { inngest } from "@/app/inngest/client";
import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";

const summarizer = createAgent({
  name: "summarizer",
  system: `
  You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z
  `.trim(),
  model: openai({ model: "gpt-40", apiKey: process.env.OPENAI_API_KEY }),
})


export const meetingsProcessing = inngest.createFunction( // Se activa cuando en el webhook de getStream de dispara el evento "call.transcription_ready" -> event "meetings/processing"

  // Esta función recibe el meetingId de la reunión y la transcriptUrl de la reunión


  { id: "meetings/processing" },
  { event: "meetings/processing" },

  async ({ event, step }) => {

    const response = await step.run("fetch-transcript", async () => {           // Se obtiene la transcripción de la reunión
      return fetch(event.data.transcriptUrl).then((res) => res.text())
    });

    const transcript = await step.run("parse-transcript", async () => {         // Se parsea la transcripción
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {  // Se agregan los speakers a la transcripción
      const speakersIds = [
        ...new Set(transcript.map((item) => item.speaker_id))
      ];


      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakersIds))
        .then((users) =>
          users.map((user) => ({
            ...user,
          }))
        )

      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakersIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
          }))
        )

      const speakers = [...userSpeakers, ...agentSpeakers];                      // Se combinan los speakers de los usuarios y los agentes

      return transcript.map((item) => {                                          // Se agregan los speakers a cada item de la transcripción
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if (!speaker) {
          return {
            ...item,
            user: {
              name: "Unknown",
            }
          }
        }

        return {
          ...item,
          user: {
            name: speaker.name,
          }
        }
      })
    })

    const { output } = await summarizer.run(                             // Genera el resumen de la transcripción
      "Summarize the following transcript" +                             // Utiliza un "agente" de Inngest llamado summarizer. 
      JSONL.stringify(transcriptWithSpeakers)                            // Este agente está configurado para usar el modelo gpt-4o de OpenAI.
    )

    await step.run("save-summary", async () => {                         // Guarda el resumen en bd@functions
      await db
        .update(meetings)
        .set({
          summary: (output[0] as TextMessage).content as string,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId))
    })  
  }                               
);