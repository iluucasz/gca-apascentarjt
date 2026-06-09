"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { abasVisiveis } from "@/lib/acl";
import { gerarAlertas } from "@/lib/alertas";
import { PERFIL_LABEL } from "@/lib/types";
import { classNames, iniciais } from "@/lib/utils";

const ABAS: Record<string, { href: string; label: string; icone: string }> = {
  painel: { href: "/painel", label: "Painel Geral", icone: "📊" },
  pessoas: { href: "/pessoas", label: "Pessoas", icone: "👥" },
  grupos: { href: "/grupos", label: "Grupos / GCAs", icone: "🏠" },
  frequencia: { href: "/frequencia", label: "Frequência", icone: "✅" },
  relatorios: { href: "/relatorios", label: "Relatórios", icone: "📝" },
  alertas: { href: "/alertas", label: "Alertas", icone: "⚠️" },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { usuarioAtual, carregado, logout, db } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (carregado && !usuarioAtual) router.replace("/login");
  }, [carregado, usuarioAtual, router]);

  if (!carregado || !usuarioAtual) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Carregando…
      </div>
    );
  }

  const abas = abasVisiveis(usuarioAtual).map((k) => ABAS[k]);
  const qtdAlertas = gerarAlertas(db, usuarioAtual).filter(
    (a) => a.severidade === "alta"
  ).length;

  const NavLinks = () => (
    <nav className="space-y-1">
      {abas.map((aba) => {
        const ativo = pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            onClick={() => setMenuAberto(false)}
            className={classNames(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              ativo
                ? "bg-marca-600 text-white"
                : "text-marca-50 hover:bg-marca-600/40"
            )}
          >
            <span className="flex items-center gap-3">
              <span>{aba.icone}</span>
              {aba.label}
            </span>
            {aba.href === "/alertas" && qtdAlertas > 0 && (
              <span
                className={classNames(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold",
                  ativo ? "bg-white text-marca-700" : "bg-red-500 text-white"
                )}
              >
                {qtdAlertas}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col bg-marca-800 p-4 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-marca-600 text-xl">
            🐑
          </span>
          <div>
            <p className="text-sm font-bold text-white">GCA</p>
            <p className="text-[11px] leading-tight text-marca-200">
              Apascentar Jardim Tropical
            </p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto rounded-xl bg-marca-900/60 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marca-600 text-xs font-semibold text-white">
              {iniciais(usuarioAtual.nome)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">
                {usuarioAtual.nome}
              </p>
              <p className="text-[11px] text-marca-200">
                {PERFIL_LABEL[usuarioAtual.perfil]}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-lg bg-marca-700 py-1.5 text-xs font-medium text-marca-50 hover:bg-marca-600"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-marca-800 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐑</span>
            <span className="font-bold text-white">GCA</span>
          </div>
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="rounded-lg p-2 text-white hover:bg-marca-700"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </header>
        {menuAberto && (
          <div className="border-b border-marca-900 bg-marca-800 p-4 lg:hidden">
            <NavLinks />
            <button
              onClick={logout}
              className="mt-3 w-full rounded-lg bg-marca-700 py-2 text-sm font-medium text-marca-50 hover:bg-marca-600"
            >
              Sair ({usuarioAtual.nome})
            </button>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
