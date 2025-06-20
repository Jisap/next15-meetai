"use client"

import { ErrorState } from "@/components/error-state"
import { LoadingState } from "@/components/loading-state"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"
import { trpc } from '../../../../trpc/server';

export const UpgradeViewLoading = () => {
  return (
    <LoadingState 
      title="Loading" 
      description="This may take a few seconds"
    />
  )
}

export const UpgradeViewError = () => {
  return <ErrorState 
    title="Error"
    description="Please try again later"
  />
}

export const UpgradeView = () => {

  const trpc = useTRPC();
  const baseQueryOptions = trpc.premium.getCurrentSubscription.queryOptions();
  const { data: currentSubscription } = useSuspenseQuery({                      // Por defecto los usuarios tienen un plan free
    ...baseQueryOptions,
    retry: 3,
  })


  return (
    <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-10">
      <div className="mt-4 flex-1 flex flex-col gap-y-10 items-center">
        <h5 className="font-medium text-3xl md:text-3xl">
          You are on the{" "}
          <span className="font-semibold text-primary">
            {currentSubscription?.name ?? "Free"}
          </span>{" "}
          plan
        </h5>
      </div>
    </div>
  )
}

