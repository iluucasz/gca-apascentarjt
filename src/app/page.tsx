"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

export default function Home() {
  const { usuarioAtual, carregado } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!carregado) return;
    router.replace(usuarioAtual ? "/painel" : "/login");
  }, [carregado, usuarioAtual, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-400">
      Carregando…
    </div>
  );
}
