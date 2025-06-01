import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agents } from '../../../db/schema';
import { db } from "@/db";
import { agentsInsertSchema } from "../schemas";
import { z } from "zod";
import { eq } from "drizzle-orm";



export const agentsRouter = createTRPCRouter({
  // TODO: Change to protectedProcedure
  getOne: baseProcedure
    .input( z.object({ id: z.string() }))
    .query(async({ input }) => {
      const [existingAgent] = await db
      .select()
      .from(agents)
      .where(
        eq(agents.id, input.id)
      )
       
      return existingAgent;
  }),
  // TODO: Change to protectedProcedure
  getMany: baseProcedure.query(async() => {
    const data = await db
      .select()
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