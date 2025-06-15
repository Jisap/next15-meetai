import { inngest } from "@/app/inngest/client";
import { helloWorld } from "@/app/inngest/functions";
import { serve } from "inngest/next";

// Inngest es un servicio que te ayuda a ejecutar tareas en segundo plano
// (background jobs) de manera confiable.
// una vez que la transcripción de una llamada esté lista, se llamará a una
// tarea de Inngest para, resumir esa transcripción.

// Estas tareas:
// 1. No bloquean la respuesta al webhook
// 2. Manejan fallos y reintentos
// 3. Puede manejar muchas de estas tareas en paralelo sin sobrecargar tu servidor principal.

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld
  ],
});
