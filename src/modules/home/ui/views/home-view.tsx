"use client"


import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";



export const HomeView = () => {

  const trpc = useTRPC();
  const{ data } = useQuery(trpc.hello.queryOptions({
    text: "world"
  }))


  // const router = useRouter();

  // const { data: session } = authClient.useSession();

  // if (!session) {
  //   return <div>Loading...</div>
  // }

  return (
    <div className="p-4 flex flex-col gap-y-4 max-w-md mx-auto">
      {/* <h1>Welcome {session.user.name}</h1>

      <Button onClick={() => authClient.signOut({
        fetchOptions: {
          onSuccess: () => router.push("/sign-in")
        }})}
      >
        Sign Out
      </Button> */}

      {data?.greeting}
    </div>
  );
}
