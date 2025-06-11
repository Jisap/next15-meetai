"use client"

import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../components/call-provider";


interface Props {
  meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {

  const trpc= useTRPC();
  const queryBaseOptions = trpc.meetings.getOne.queryOptions({ id: meetingId });
  const { data } = useSuspenseQuery({ 
    ...queryBaseOptions,
    retry: 3,
  });

  if(data.status === "completed"){
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState 
          title="Meeting Completed"
          description="You can no longer join this meeting"
        />
      </div>
    )
  }

  return (
    <div className="h-full">
      <CallProvider 
        meetingId={data.id}
        meetingName={data.name}
      />
    </div>
  )
}

