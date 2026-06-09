"use client";

import { Alerta, Severidade, TipoAlerta } from "@/lib/alertas";
import { Card } from "./ui";
import { classNames } from "@/lib/utils";

const ICONE: Record<TipoAlerta, string> = {
  faltas_seguidas: "📉",
  grupo_sobrecarregado: "🏋️",
  grupo_diminuindo: "📉",
  familia_nova: "👨‍👩‍👧",
  cuidado_urgente: "🚨",
};

const COR_BORDA: Record<Severidade, string> = {
  alta: "border-l-red-500",
  media: "border-l-orange-400",
  baixa: "border-l-blue-400",
};

const COR_TXT: Record<Severidade, string> = {
  alta: "text-red-600",
  media: "text-orange-600",
  baixa: "text-blue-600",
};

const SEV_LABEL: Record<Severidade, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Informativo",
};

export function CartaoAlerta({ alerta }: { alerta: Alerta }) {
  return (
    <Card className={classNames("border-l-4 p-4", COR_BORDA[alerta.severidade])}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{ICONE[alerta.tipo]}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-gray-800">{alerta.titulo}</p>
            <span
              className={classNames(
                "shrink-0 text-xs font-semibold uppercase",
                COR_TXT[alerta.severidade]
              )}
            >
              {SEV_LABEL[alerta.severidade]}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-600">{alerta.descricao}</p>
        </div>
      </div>
    </Card>
  );
}
