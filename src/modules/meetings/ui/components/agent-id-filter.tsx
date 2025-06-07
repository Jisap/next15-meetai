import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useMeetingsFilter } from "../../hooks/use-meetings-filter";


// Establece en la url el agentId

export const AgentIdFilter = () => {
  
  const [filters, setFilters] = useMeetingsFilter();
  const trpc = useTRPC();
  const [agentSearch, setAgentSearch] = useState("");

  const baseQueryOptions = trpc.agents.getMany.queryOptions({
    pageSize: 100,
    search: agentSearch,
  });
  const { data } = useQuery({                                     // useSuspenseQuery lanza una promesa (recibir datos) y suspende el renderizado hasta que la promesa se resuelva
    ...baseQueryOptions,                                          // Incluye queryKey, queryFn, etc. desde la configuración de tRPC
    retry: 3,                                                     // Reintentará la consulta hasta 3 veces en caso de error -> evitamos el loop infinito por issue de tanstack #8677
  });

  return (
    <CommandSelect
      className="h-9"
      placeholder="Agent"
      options={(data?.items ?? []).map((agent) => ({
        id: agent.id,
        value: agent.id,
        children: (
          <div className="flex items-center gap-x-2">
            <GeneratedAvatar 
              seed={agent.name}
              variant="botttsNeutral"
              className="border size-6"
            />
            <span>{agent.name}</span>

          </div>
        )
      }))}
      onSelect={(value) => setFilters({ agentId: value as string })}
      onSearch={setAgentSearch}
      value={filters.agentId ?? ""}
    />

    
  )
}