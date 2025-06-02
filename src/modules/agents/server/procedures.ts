import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agents } from '../../../db/schema';
import { db } from "@/db";
import { agentsInsertSchema } from "../schemas";
import { z } from "zod";
import { eq, getTableColumns, sql } from "drizzle-orm";
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
    .input( // Filters
      z.object({
        page: z.number().min(1).default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }).optional()
    )
    .query(async() => {
      const data = await db
        .select({
          // TODO: Change to actual count
          meetingCount: sql<number>`5`,   // Se agrega una columna de tipo number llamada meetingCount
          ...getTableColumns(agents),     // Se seleccionan todas las columnas de la tabla agents
        })
        .from(agents)
  
        return data;
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