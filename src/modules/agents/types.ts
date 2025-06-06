

import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type AgentGetOne = inferRouterOutputs<AppRouter>["agents"]["getOne"]; // Se infiere el tipo de la función getOne de agents
export type AgentGetMany = inferRouterOutputs<AppRouter>["agents"]["getMany"]["items"]; // Se infiere el tipo de la función getMany de agents