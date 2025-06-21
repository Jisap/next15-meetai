import { baseProcedure, createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { agents, meetings } from '../../../db/schema';
import { db } from "@/db";
import { agentsInsertSchema, agentsUpdateSchema } from "../schemas";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";



export const agentsRouter = createTRPCRouter({

  update: protectedProcedure
    .input(agentsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedAgent] = await db
        .update(agents)
        .set(input)
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, ctx.auth.user.id)
          )
        )
        .returning();

      if (!updatedAgent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" })
      }

      return updatedAgent;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedAgent] = await db
        .delete(agents)
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, ctx.auth.user.id)
          )
        )
        .returning()

      if (!removedAgent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" })
      }

      return removedAgent;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingAgent] = await db
        .select({
          ...getTableColumns(agents),                                         // Se seleccionan todas las columnas de la tabla agents
          // subconsulta: reuniones asignadas al agente
          meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)), // Contamos en la tabla meetings cuantas filas tienen el agentId igual al id del agente que estamos seleccionando
        })
        .from(agents)
        .where(
          and(
            eq(agents.id, input.id),                                          // Filtra los agentes que coincidan con el id especificado
            eq(agents.userId, ctx.auth.user.id)                               // Filtra los agentes que pertenecen al usuario autenticado

          )
        )

      if (!existingAgent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" })
      }

      return existingAgent;
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
      })
    )
    .query(async ({ ctx, input }) => {                                  // Consulta recibiendo los filtros y el ctx con el usuario autenticado
      const { search, page, pageSize } = input;
      const data = await db                                             // Se obtienen los datos de la tabla agents
        .select({                                                       // Para ello se seleccionan las columnas de la tabla agents
          ...getTableColumns(agents),                                   // Se seleccionan todas las columnas de la tabla agents
          // subconsulta: reuniones asignadas al agente
          meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)), // Contamos en la tabla meetings cuantas filas tienen el agentId igual al id del agente que estamos seleccionando
        })
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.auth.user.id),                        // Filtra los "agents" para que solo se devuelvan aquellos cuyo userId coincida con el ID del usuario autenticado
            search ? ilike(agents.name, `%${search}%`) : undefined      // Usamos el operador de comparación ilike para buscar por nombres de agents que contienen la palabra de búsqueda
          )
        )
        .orderBy(desc(agents.createdAt), desc(agents.id))               // Ordena los resultados de forma descendente
        .limit(pageSize)                                                // Limita el número de resultados devueltos al pageSize especificado.
        .offset((page - 1) * pageSize)                                  // Omite un número de resultados para implementar la paginación. Por ejemplo, si page es 2 y pageSize es 10, se omitirán los primeros (2-1)*10 = 10 resultados. 

      const [total] = await db                                          // Segunda Consulta a la Base de Datos (Obtener Total de Elementos)                                  
        .select({ count: count() })                                     // count() cuenta el número de filas que coinciden con la clausula where
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.auth.user.id),                        // Agentes que pertenecen al usuario autenticado
            search ? ilike(agents.name, `%${search}%`) : undefined      // Agentes cuyo name contiene la palabra de búsqueda
          )
        )

      const totalPages = Math.ceil(total.count / pageSize);             // Calcula el número total de páginas necesarias para mostrar todos los elementos, dividiendo el conteo total por el tamaño de página y redondeando hacia arriba  

      return {
        items: data,
        total: total.count,
        totalPages,
      }
    }),
  create: premiumProcedure("agents")                                     // Al usar premiumProcedure verificamos si el usuario tiene acceso a los recursos premium
    .input(agentsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdAgent] = await db // Drizzle siempre devuelve un array
        .insert(agents)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      return createdAgent;
    }),

})