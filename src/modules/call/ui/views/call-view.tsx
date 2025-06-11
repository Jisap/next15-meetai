"use client"

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";


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

  return (
    <div>
      {JSON.stringify(data, null, 2)}
    </div>
  )
}

