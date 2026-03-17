import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

const formSchema = z.object({
  username: z.email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
}) satisfies z.ZodType<AccessToken>

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/dashboard",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Log In - StatusPulse",
      },
    ],
  }),
})

function Login() {
  const { loginMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="animate-fade-in max-w-sm w-full rounded-xl shadow-sm border p-8">
        <div className="text-center mb-6">
          <Logo variant="full" />
          <p className="text-sm text-muted-foreground mt-2">
            Log in to admin panel
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="email-input"
                        placeholder="user@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                    </div>
                    <FormControl>
                      <PasswordInput
                        data-testid="password-input"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <LoadingButton
                type="submit"
                loading={loginMutation.isPending}
                className="w-full"
              >
                Log In
              </LoadingButton>
            </div>
          </form>
        </Form>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <Appearance />
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Status Page
        </Link>
      </div>
    </div>
  )
}
