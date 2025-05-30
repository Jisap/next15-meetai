import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';


/**
 * Router principal de la aplicación.
 * Aquí se agrupan todos los sub-routers y procedimientos de tu API.
 */
export const appRouter = createTRPCRouter({
  
  hello: baseProcedure                                // Ejemplo de un procedimiento público (query)
    .input(
      z.object({   
        text: z.string(),                             // Define la entrada esperada: un objeto con una propiedad 'text' de tipo string.
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),  
  // Aquí puedes añadir más routers o procedimientos.
  // por ejemplo: userRouter, postRouter, etc.
});

// export type definition of API
/** Tipo inferido del `appRouter`. Se utiliza en el cliente para obtener tipado de extremo a extremo. */
export type AppRouter = typeof appRouter;