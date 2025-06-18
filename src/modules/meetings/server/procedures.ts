import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agents, meetings, user } from '../../../db/schema';
import { db } from "@/db";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, inArray, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { MeetingStatus, StreamTranscriptItem } from "../types";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import JSONL from "jsonl-parse-stringify";
import { streamChat } from "@/lib/stream-chat";




export const meetingsRouter = createTRPCRouter({

  generateToken: protectedProcedure
    .mutation(async ({ ctx }) => {                                    // Se genera un token para la API de Stream. Este token se utiliza para autenticar al usuario con la API de Stream Video, permitiéndole participar en videollamadas.
      await streamVideo.upsertUsers([                                 // 1º Actualiza o inserta al usuario en Stream Video 
        {
          id: ctx.auth.user.id,
          name: ctx.auth.user.name,
          role: "admin",
          image: 
            ctx.auth.user.image ??
            generateAvatarUri({
              seed: ctx.auth.user.name,
              variant: "initials"
            })
        }
      ])

      const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 2º Define el tiempo de expiración del token. Expira en 1 hora
      const issuedAt = Math.floor(Date.now() / 1000) - 60;         // 3º Define el tiempo de emisión del token (cuando fue generado). 
    
      const token = streamVideo.generateUserToken({                // 4º Genera el token de stream video
        user_id: ctx.auth.user.id,
        exp: expirationTime, // optional
        validity_in_seconds: issuedAt // optional
      })

      return token
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedMeeting] = await db
        .delete(meetings)
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id)
          )
        )
        .returning();

      if (!removedMeeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" })
      }

      return removedMeeting;
    }),

  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedMeeting] = await db
        .update(meetings)
        .set(input)
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id)
          )
        )
        .returning();

      if (!updatedMeeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" })
      }

      return updatedMeeting;
    }),

  create: protectedProcedure
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {                               // 1º Se crea un nuevo meeting en la base de datos y se crea una videollamada en la API de Stream Video
      const [createdMeeting] = await db                                 // Drizzle siempre devuelve un array
        .insert(meetings)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      const call = streamVideo.video.call("default", createdMeeting.id) // 2º Cada vez que creamos un meeting se creará una instancia de call de stream video (inicia la llamada -> getStream inicia el evento call.session_started) (la llamada existe pero aun no ha comenzado porque nadie se ha unido)
      await call.create({                                               // Para configurar la llamada usamos el método create de la API de Stream Video
        data: {
          created_by_id: ctx.auth.user.id,                              // Se establece como creador el id del usuario que creó la reunión
          custom: {                                                     // Se establece información personalizada  
            meetingId: createdMeeting.id,                               // desde las props de la reunión  
            meetingName: createdMeeting.name,
          },
          settings_override: {                                          // Se establecen ajustes expecíficos para la llamada
            transcription: {                                            // Se habilita la transcripción automática -> Esta se inicia cuando se termina la llamada -> dispara el evento call.session_ended -> Cuando se termina la transcripción se dispara el evento call.transcription_ready -> evento a inngest para parsear, enriquecer y resumir la reunion con openai 
              language: "en",
              mode: "auto-on",
              closed_caption_mode: "auto-on",
            },
            recording: {                                                // Se habilita la grabación automática en 1080
              mode: "auto-on",
              quality: "1080p"
            }
          }
        }
      });

      const [existingAgent] = await db                                  // 3ºSe busca en bd el agente asociado al meeting
        .select()
        .from(agents)
        .where(eq(agents.id, createdMeeting.agentId))

      if(!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found"
        })
      }

      await streamVideo.upsertUsers([                                  // 4º Actualiza o inserta el agente en la plataforma de StreamVideo           
        {
          id: existingAgent.id,
          name: existingAgent.name,
          role: "user",
          image: generateAvatarUri({
            seed: existingAgent.name,
            variant: "bottsNeutral"
          })
        }
      ])

      return createdMeeting; //  Finalmente, devuelve el objeto createdMeeting que se insertó en la base de datos al principio.
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),                               // Se seleccionan todas las columnas de la tabla meetings
          agent: agents,                                              // Se seleccionan todos los campos de la tabla agents relacionados con el meeting -> innerJoin
          duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_At))`.as("duration"), // Se agrega una columna de tipo number llamada duration que extrae el tiempo de duración de la reunión
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))           // Una reunión se vinculará con un agente si el agentId en la tabla meetings es igual al id en la tabla agents. -> Como resultado, solo se devolverá la reunión que tenga un agente asociado válido en la tabla agents
        .where(
          and(
            eq(meetings.id, input.id),                                // Filtra los meetings que coincidan con el id especificado
            eq(meetings.userId, ctx.auth.user.id)                     // Filtra los meetings que pertenecen al usuario autenticado

          )
        )

      if (!existingMeeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" })
      }

      return existingMeeting;
    }),

  getMany: protectedProcedure
    .input(                                                             // Filters
      z.object({
        page: z.number().min(1).default(DEFAULT_PAGE),                  // Se espera un número de página
        pageSize: z                                                     // Se espera un tamaño de página
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),                                   // Se espera un termino de búsqueda
        agentId: z.string().nullish(),                                  // Se espera un agentId
        status: z
          .enum([
            MeetingStatus.Upcoming,
            MeetingStatus.Active,
            MeetingStatus.Completed,
            MeetingStatus.Processing,
            MeetingStatus.Cancelled
          ])
          .nullish(),
      })
    )
    .query(async ({ ctx, input }) => {                                  // Consulta recibiendo los filtros y el ctx con el usuario autenticado
      const { search, page, pageSize, status, agentId } = input;
      
      const data = await db                                             // Se obtienen los datos de la tabla meetings
        .select({                                                       // Para ello se seleccionan las columnas de la tabla meetings
          //TODO: Change meetingCount with dynamic count
          meetingCount: sql<number>`5`,                                 // Se agrega una columna de tipo number llamada meetingCount
          ...getTableColumns(meetings),                                 // Se seleccionan todas las columnas de la tabla meetings
          agent: agents,                                                // Se seleccionan todos los campos de la tabla agents relacionados con el meeting -> innerJoin
          duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_At))`.as("duration"), // Se agrega una columna de tipo number llamada duration que extrae el tiempo de duración de la reunión
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))             // Una reunión se vinculará con un agente si el agentId en la tabla meetings es igual al id en la tabla agents. -> Como resultado, solo se devolverán las reuniones que tengan un agente asociado válido en la tabla agents
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),                      // Filtra los "meetings" para que solo se devuelvan aquellos cuyo userId coincida con el ID del usuario autenticado
            search ? ilike(meetings.name, `%${search}%`) : undefined,   // Usamos el operador de comparación ilike para buscar por nombres de meetings que contienen la palabra de búsqueda
            status ? eq(meetings.status, status) : undefined,           // Filtra por status si se especifica
            agentId ? eq(meetings.agentId, agentId) : undefined,        // Filtra por agentId si se especifica
          )
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))           // Ordena los resultados de forma descendente
        .limit(pageSize)                                                // Limita el número de resultados devueltos al pageSize especificado.
        .offset((page - 1) * pageSize)                                  // Omite un número de resultados para implementar la paginación. Por ejemplo, si page es 2 y pageSize es 10, se omitirán los primeros (2-1)*10 = 10 resultados. 

      const [total] = await db                                          // Segunda Consulta a la Base de Datos (Obtener Total de Elementos)                                  
        .select({ count: count() })                                     // count() cuenta el número de filas que coinciden con la clausula where
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))             // Se une la tabla meetings con la tabla agents usando el campo agentId de la tabla meetings
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),                      // Meetings que pertenecen al usuario autenticado
            search ? ilike(meetings.name, `%${search}%`) : undefined,   // meetings cuyo name contiene la palabra de búsqueda
            status ? eq(meetings.status, status) : undefined,           // Filtra por status si se especifica
            agentId ? eq(meetings.agentId, agentId) : undefined,        // Filtra por agentId si se especifica
          )
        )

      const totalPages = Math.ceil(total.count / pageSize);             // Calcula el número total de páginas necesarias para mostrar todos los elementos, dividiendo el conteo total por el tamaño de página y redondeando hacia arriba  

      return {
        items: data,
        total: total.count,
        totalPages,
      }
    }),

  getTranscript: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id)
          )
        )

      if (!existingMeeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" })
      }

      if(!existingMeeting.transcriptUrl) {
        return []
      }

      const transcript = await fetch(existingMeeting.transcriptUrl) // Se obtiene la transcripción de la reunión
        .then((res) => res.text())
        .then((text) => JSONL.parse<StreamTranscriptItem>(text))
        .catch(() => {
          return []
        });

      const speakersIds = [                                         // Se obtienen los ids de los speakers de la transcripción
        ...new Set(transcript.map((item) => item.speaker_id)),
      ]

      const userSpeakers = await db                                 // Se obtienen los userSpeakers de la tabla user
        .select()
        .from(user)
        .where(inArray(user.id, speakersIds))                       // Se filtran los usuarios que pertenecen a los speakers de la transcripción
        .then((users) =>                                            // Se transforman los usuarios en un array de objetos con solo las propiedades id y image
          users.map((user) => ({
            ...user,
            image: 
              user.image ?? generateAvatarUri({
                seed: user.name,
                variant: "initials"
              })
          }))
        )

      const agentSpeakers = await db                                // Se obtienen los agentSpeakers de la tabla agents
        .select()
        .from(agents)
        .where(inArray(agents.id, speakersIds))                     // Se filtran los agentes que pertenecen a los speakers de la transcripción
        .then((agents) =>                                           // Se transforman los agentes en un array de objetos con solo las propiedades id y image
          agents.map((agent) => ({
            ...agent,
            image: generateAvatarUri({
                seed: agent.name,
                variant: "bottsNeutral"
              })
          }))
        )

      const speakers = [...userSpeakers, ...agentSpeakers]           // Se combinan los usuarios y los agentes en un array de objetos
    
      const transcriptWithSpeakers = transcript.map((item) => {      // Se agregan los speakers a cada item de la transcripción
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        )

        if(!speaker) {                                               // Si no se encuentra el speaker en la tabla user o agents, se agrega un speaker desconocido
          return {
            ...item,
            user: {
              name: "Unknown",
              image: generateAvatarUri({
                seed: "Unknown",
                variant: "initials"
              })
            }
          }
        }

        return {                                                     // Si se encuentra el speaker en la tabla user o agents, se agrega el speaker
          ...item,
          user: {
            name: speaker.name,
            image: speaker.image
          }
        }

      })
      
      return transcriptWithSpeakers;                                  // Se devuelve la transcripción con los speakers agregados
    }),

  generateChatToken: protectedProcedure.mutation((async({ ctx }) => { // Se genera un token para la API de Stream Chat
    const token = streamChat.createToken(ctx.auth.user.id)            // Se crea un token para el usuario autenticado
      await streamChat.upsertUser({                                   // Se actualiza el usuario en la plataforma de StreamChat
        id: ctx.auth.user.id,
        role: "admin"
      })
    return token
  }))
      
})