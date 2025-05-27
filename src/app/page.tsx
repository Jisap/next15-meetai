"use client"


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";


export default function Home() {

  const { data: session } = authClient.useSession()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const onSubmit = () => {
    authClient.signUp.email({
      email,
      password,
      name,
    }, {
      onRequest: (ctx) => {
        //show loading
      },
      onSuccess: (ctx) => {
        window.alert("User created successfully");
      },
      onError: (ctx) => {
        window.alert("Something went wrong");
      },
    })
  }

  const onLogin = () => {
    authClient.signIn.email({
      email,
      password
    }, {
      onRequest: (ctx) => {
        //show loading
      },
      onSuccess: (ctx) => {
        window.alert("User login successfully");
      },
      onError: (ctx) => {
        window.alert("Something went wrong");
      },
    })
  }

  if (session) {
    return (
      <div className="p-4 flex flex-col gap-y-4 max-w-md mx-auto">
        <h1>Welcome {session.user.name}</h1>

        <Button onClick={() => authClient.signOut()}>
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-y-4 max-w-md mx-auto">
      <div className="flex flex-col gap-y-4">
        <Input
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={onSubmit}>
          Create User
        </Button>
      </div>

      <div className="flex flex-col gap-y-4">
        <Input
          placeholder="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={onLogin}>
          Login
        </Button>
      </div>
    </div>
  );
}
