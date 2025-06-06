

import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type MeetingGetOne = inferRouterOutputs<AppRouter>["meetings"]["getOne"]; // Se infiere el tipo de la función getOne de Meetings
export type MeetingGetMany = inferRouterOutputs<AppRouter>["meetings"]["getMany"]["items"]; // Se infiere el tipo de la función getMany de Meetings