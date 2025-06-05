import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { meetings } from '../../../db/schema';
import { db } from "@/db";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema } from "../schemas";



export const meetingsRouter = createTRPCRouter({

  create: protectedProcedure
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdMeeting] = await db // Drizzle siempre devuelve un array
        .insert(meetings)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      // TODO: Create Stream Call, upsert Stream Users

      return createdMeeting;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),              // Se seleccionan todas las columnas de la tabla meetings
        })
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.id),               // Filtra los meetings que coincidan con el id especificado
            eq(meetings.userId, ctx.auth.user.id)    // Filtra los meetings que pertenecen al usuario autenticado

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
      })
    )
    .query(async ({ ctx, input }) => {                                  // Consulta recibiendo los filtros y el ctx con el usuario autenticado
      const { search, page, pageSize } = input;
      const data = await db                                             // Se obtienen los datos de la tabla meetings
        .select({                                                       // Para ello se seleccionan las columnas de la tabla meetings
          // TODO: Change to actual count
          meetingCount: sql<number>`5`,                                 // Se agrega una columna de tipo number llamada meetingCount
          ...getTableColumns(meetings),                                 // Se seleccionan todas las columnas de la tabla meetings
        })
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),                      // Filtra los "meetings" para que solo se devuelvan aquellos cuyo userId coincida con el ID del usuario autenticado
            search ? ilike(meetings.name, `%${search}%`) : undefined    // Usamos el operador de comparación ilike para buscar por nombres de meetings que contienen la palabra de búsqueda
          )
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))           // Ordena los resultados de forma descendente
        .limit(pageSize)                                                // Limita el número de resultados devueltos al pageSize especificado.
        .offset((page - 1) * pageSize)                                  // Omite un número de resultados para implementar la paginación. Por ejemplo, si page es 2 y pageSize es 10, se omitirán los primeros (2-1)*10 = 10 resultados. 

      const [total] = await db                                          // Segunda Consulta a la Base de Datos (Obtener Total de Elementos)                                  
        .select({ count: count() })                                     // count() cuenta el número de filas que coinciden con la clausula where
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),                      // Meetings que pertenecen al usuario autenticado
            search ? ilike(meetings.name, `%${search}%`) : undefined    // meetings cuyo name contiene la palabra de búsqueda
          )
        )

      const totalPages = Math.ceil(total.count / pageSize);             // Calcula el número total de páginas necesarias para mostrar todos los elementos, dividiendo el conteo total por el tamaño de página y redondeando hacia arriba  

      return {
        items: data,
        total: total.count,
        totalPages,
      }
    }),

})