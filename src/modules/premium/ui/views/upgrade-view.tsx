"use client"

import { ErrorState } from "@/components/error-state"
import { LoadingState } from "@/components/loading-state"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"

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
  return (
    <div>
      UpgradeView
    </div>
  )
}

