"use client"

import { Card, CardContent } from "@/components/ui/card"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { OctagonAlertIcon } from "lucide-react"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password is required" })
})


export const SignInView = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form>Colum 1</form>
          <div className="bg-radial from-green-700 to-green-900 relative hidden md:flex flex-col gap-y-4 items-center justify-center">
            <img 
              src="/logo.svg"
              alt="Image"
              className="h-[92px] w-[92px]"
            />
            <p className="text-2xl font-semibold text-white">
              Meet.AI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}