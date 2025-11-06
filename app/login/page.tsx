"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { login as loginAction } from "@/actions/auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    username: z.string().min(1, "Username obbligatorio"),
    password: z.string().min(1, "Password obbligatoria")
  });

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      console.log('Starting login process...');
      const result = await loginAction(values.username, values.password);
      
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, redirecting to /cassa');
        // Wait a bit for session to be fully set
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = '/cassa'; // Force full page reload to ensure session is loaded
      } else {
        toast.error(result.error || "Credenziali non valide");
        form.reset();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Errore durante il login");
      form.reset();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen w-full flex place-content-center items-center bg-background text-foreground">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="h-screen w-full flex flex-col items-center place-content-center">
            <Card className="w-[350px] bg-card text-card-foreground">
              <CardHeader>
                <div className="relative flex w-full place-content-center pb-6">
                  <Logo className="h-28" />
                </div>
                <CardTitle className="text-center">Accedi - MyCassa</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input autoComplete="off" placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input autoComplete="off" placeholder="Password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => form.reset()}
                  disabled={isLoading}
                >
                  Cancella
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Accesso..." : "Accedi"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
      <div className="absolute bottom-0 text-sm text-muted-foreground">
        <Link href={"https://www.mysagra.com/"} target="_blank" rel="noopener noreferrer">
          {"Powered by"}
          <Button variant={"link"} className="text-primary p-1.5">
            {"MySagra"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
