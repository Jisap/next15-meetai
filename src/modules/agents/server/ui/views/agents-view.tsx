"use client"

import { ErrorState } from "@/components/error-state"
import { LoadingState } from "@/components/loading-state"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query"



export const AgentsView = () => {

  const trpc = useTRPC()
  const{ data, isLoading, isError } = useQuery(trpc.agents.getMany.queryOptions())

  if(isLoading){
    return (
      <div className="flex flex-1 min-h-screen">
        <LoadingState 
          title="Loading Agents"
          description="This may take a few seconds..."
        />
      </div>
    )
  }

  if(isError){
    return (
      <div className="flex flex-1 min-h-screen">
        <ErrorState 
          title="Error Loading Agents"
          description="There was an error loading the agents. Please try again later."
        />
      </div>
    )
  }

  return (
    <div>
      {JSON.stringify(data, null, 2)}
    </div>
  )
}

