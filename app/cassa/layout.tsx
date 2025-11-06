import { Metadata } from "next";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      {children}
    </main>
  )
}

export const metadata: Metadata = {
  title: "MyCassa - Cassa",
  description: "Sistema di gestione cassa per eventi",
};