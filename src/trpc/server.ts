import { createCallerFactory } from "./init";
import { appRouter } from "./routers/_app";
import { createTRPCContext } from "./init"; // Importa la función para crear el contexto

/**
 * Factory para crear "callers" de tRPC.
 * Un "caller" es una forma de invocar tus procedimientos tRPC desde el lado del servidor
 * directamente, sin pasar por una capa HTTP. Está configurado con tu `appRouter`.
 * @see https://trpc.io/docs/server/server-side-calls
 */
const callerFactory = createCallerFactory(appRouter);

/**
 * Instancia del "caller" de tRPC para uso exclusivo en el servidor.
 * Permite llamar a tus procedimientos tRPC (queries, mutations) como si fueran funciones
 * directas desde Server Components, API Routes, etc.
 * Se inicializa con un contexto (`createTRPCContext`). Si tu contexto es asíncrono,
 * esto utiliza top-level await (soportado en Next.js con módulos ESM).
 */
export const caller = callerFactory(await createTRPCContext());