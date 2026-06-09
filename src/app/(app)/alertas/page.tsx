"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { gerarAlertas, TipoAlerta } from "@/lib/alertas";
import { Card, SectionTitle, Vazio } from "@/components/ui";
import { CartaoAlerta } from "@/components/alertas-ui";
import { classNames } from "@/lib/utils";

const FILTROS: { k: TipoAlerta | "todos"; label: string }[] = [
  { k: "todos", label: "Todos" },
  { k: "cuidado_urgente", label: "🚨 Cuidado urgente" },
  { k: "faltas_seguidas", label: "📉 Faltas seguidas" },
  { k: "grupo_sobrecarregado", label: "🏋️ Sobrecarga" },
  { k: "grupo_diminuindo", label: "📉 Grupo diminuindo" },
  { k: "familia_nova", label: "👨‍👩‍👧 Famílias novas" },
];

export default function AlertasPage() {
  const { db, usuarioAtual } = useApp();
  const alertas = gerarAlertas(db, usuarioAtual);
  const [filtro, setFiltro] = useState<TipoAlerta | "todos">("todos");

  const lista = alertas.filter((a) =>
    filtro === "todos" ? true : a.tipo === filtro
  );

  const altas = alertas.filter((a) => a.severidade === "alta").length;

  return (
    <div>
      <SectionTitle>Alertas automáticos</SectionTitle>

      <p className="mb-4 text-sm text-gray-500">
        O sistema observa frequência, situação dos grupos e cuidado pastoral
        para que ninguém passe despercebido.
        {altas > 0 && (
          <span className="ml-1 font-medium text-red-600">
            {altas} alerta(s) de alta prioridade.
          </span>
        )}
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const qtd =
            f.k === "todos"
              ? alertas.length
              : alertas.filter((a) => a.tipo === f.k).length;
          return (
            <button
              key={f.k}
              onClick={() => setFiltro(f.k)}
              className={classNames(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                filtro === f.k
                  ? "bg-marca-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              {f.label}
              {qtd > 0 && (
                <span
                  className={classNames(
                    "ml-1.5 rounded-full px-1.5 text-xs",
                    filtro === f.k
                      ? "bg-white/20"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {qtd}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {lista.length === 0 ? (
        <Vazio
          titulo="Nenhum alerta nesta categoria"
          descricao="Continue acompanhando — os alertas aparecem automaticamente."
        />
      ) : (
        <div className="space-y-2">
          {lista.map((a) => (
            <CartaoAlerta key={a.id} alerta={a} />
          ))}
        </div>
      )}
    </div>
  );
}
