"use client";

import { Badge } from "./ui";
import {
  SituacaoGrupo,
  SituacaoPessoa,
  SITUACAO_GRUPO_LABEL,
  SITUACAO_PESSOA_LABEL,
} from "@/lib/types";

export function BadgeSituacaoPessoa({ s }: { s: SituacaoPessoa }) {
  const cor = {
    membro: "verde",
    novo_convertido: "azul",
    visitante: "roxo",
    afastado: "vermelho",
  }[s] as "verde" | "azul" | "roxo" | "vermelho";
  return <Badge cor={cor}>{SITUACAO_PESSOA_LABEL[s]}</Badge>;
}

export function BadgeSituacaoGrupo({ s }: { s: SituacaoGrupo }) {
  const cor = {
    saudavel: "verde",
    em_crescimento: "azul",
    em_atencao: "amarelo",
    sobrecarregado: "laranja",
    em_risco: "vermelho",
  }[s] as "verde" | "azul" | "amarelo" | "laranja" | "vermelho";
  return <Badge cor={cor}>{SITUACAO_GRUPO_LABEL[s]}</Badge>;
}
