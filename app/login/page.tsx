"use client"

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

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
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    login(values.username, values.password, false).then(() => {
      router.push("/cassa");
    }).catch((error) => {
      console.log(error);
      form.reset();
      toast.error("Credenziali non valide");
    });
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
                >
                  Cancella
                </Button>
                <Button type="submit">Accedi</Button>
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
