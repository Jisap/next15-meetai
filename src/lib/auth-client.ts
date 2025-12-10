"use client"

// import { polarClient } from "@polar-sh/better-auth"
import { createAuthClient } from "better-auth/react"




export const authClient = createAuthClient({
  // TODO: Re-enable Polar plugin once the createRequire issue is resolved
  // plugins: [polarClient()]
})