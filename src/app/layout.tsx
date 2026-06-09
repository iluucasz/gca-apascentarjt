import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "GCA — Acompanhamento Pastoral",
  description:
    "Grupo de Crescimento Apascentar — Ministério Apascentar Jardim Tropical",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
