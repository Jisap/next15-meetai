import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agents } from '../../../db/schema';
import { db } from "@/db";
import { agentsInsertSchema } from "../schemas";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import page from "@/app/(dashboard)/meetings/page";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";



export const agentsRouter = createTRPCRouter({
 
  getOne: protectedProcedure
    .input( z.object({ id: z.string() }))
    .query(async({ input }) => {
      const [existingAgent] = await db
      .select({
        // TODO: Change to actual count
        meetingCount: sql<number>`5`,   // Se agrega una columna de tipo number llamada meetingCount
        ...getTableColumns(agents),     // Se seleccionan todas las columnas de la tabla agents
      })
      .from(agents)
      .where(
        eq(agents.id, input.id)
      )
       
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
    .query(async({ ctx, input}) => {                                    // Consulta recibiendo los filtros y el ctx con el usuario autenticado
      const { search, page, pageSize } = input;
      const data = await db                                             // Se obtienen los datos de la tabla agents
        .select({                                                       // Para ello se seleccionan las columnas de la tabla agents
          // TODO: Change to actual count
          meetingCount: sql<number>`5`,                                 // Se agrega una columna de tipo number llamada meetingCount
          ...getTableColumns(agents),                                   // Se seleccionan todas las columnas de la tabla agents
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
  create: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async({ input, ctx }) => {
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