"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  pessoasVisiveis,
  gruposVisiveis,
  reunioesVisiveis,
  ehSupervisor,
} from "@/lib/acl";
import { gerarAlertas, tendenciaPresenca } from "@/lib/alertas";
import { PERFIL_LABEL, SITUACAO_PESSOA_LABEL, SituacaoPessoa } from "@/lib/types";
import { Botao, Card, Metrica, SectionTitle } from "@/components/ui";
import { BadgeSituacaoGrupo } from "@/components/badges";
import { CartaoAlerta } from "@/components/alertas-ui";

export default function PainelPage() {
  const { db, usuarioAtual, restaurarExemplo } = useApp();
  const pessoas = pessoasVisiveis(db, usuarioAtual);
  const grupos = gruposVisiveis(db, usuarioAtual);
  const reunioes = reunioesVisiveis(db, usuarioAtual);
  const alertas = gerarAlertas(db, usuarioAtual);

  const sup = ehSupervisor(usuarioAtual);
  const visitantes = pessoas.filter((p) => p.situacao === "visitante").length;
  const afastados = pessoas.filter((p) => p.situacao === "afastado").length;
  const urgentes = pessoas.filter((p) => p.cuidadoUrgente).length;

  // contagem por situação
  const porSituacao = (Object.keys(SITUACAO_PESSOA_LABEL) as SituacaoPessoa[]).map(
    (s) => ({
      s,
      n: pessoas.filter((p) => p.situacao === s).length,
    })
  );
  const total = pessoas.length || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Olá, {usuarioAtual?.nome.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500">
            {usuarioAtual && PERFIL_LABEL[usuarioAtual.perfil]} ·{" "}
            {sup
              ? "Visão geral de todos os grupos"
              : "Visão do seu grupo"}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica rotulo="Pessoas" valor={pessoas.length} />
        <Metrica rotulo={sup ? "Grupos" : "Reuniões"} valor={sup ? grupos.length : reunioes.length} cor="azul" />
        <Metrica rotulo="Visitantes" valor={visitantes} cor="verde" />
        <Metrica
          rotulo="Cuidado urgente"
          valor={urgentes}
          cor={urgentes ? "vermelho" : "marca"}
        />
      </div>

      {/* Alertas prioritários */}
      <div>
        <SectionTitle
          acao={
            <Link href="/alertas">
              <Botao variante="secundario">Ver todos</Botao>
            </Link>
          }
        >
          Alertas prioritários
        </SectionTitle>
        {alertas.length === 0 ? (
          <Card className="p-6 text-center text-sm text-gray-500">
            🎉 Nenhum alerta no momento. Todo o rebanho sob cuidado.
          </Card>
        ) : (
          <div className="space-y-2">
            {alertas.slice(0, 4).map((a) => (
              <CartaoAlerta key={a.id} alerta={a} />
            ))}
            {alertas.length > 4 && (
              <p className="pt-1 text-center text-xs text-gray-400">
                + {alertas.length - 4} outros alertas
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Situação das pessoas */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-gray-800">
            Situação das pessoas
          </h3>
          <div className="space-y-3">
            {porSituacao.map(({ s, n }) => (
              <div key={s}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">
                    {SITUACAO_PESSOA_LABEL[s]}
                  </span>
                  <span className="font-medium text-gray-800">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-marca-500"
                    style={{ width: `${(n / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {afastados > 0 && (
            <p className="mt-4 text-xs text-red-600">
              ⚠ {afastados} pessoa(s) afastada(s) — atenção pastoral.
            </p>
          )}
        </Card>

        {/* Saúde dos grupos */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-gray-800">
            Saúde dos grupos
          </h3>
          {grupos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum grupo.</p>
          ) : (
            <ul className="space-y-3">
              {grupos.map((g) => {
                const qtd = db.pessoas.filter((p) => p.grupoId === g.id).length;
                const tend = tendenciaPresenca(db, g.id);
                return (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {g.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {qtd} pessoas
                        {tend &&
                          ` · presença ${tend.anterior}→${tend.atual} ${
                            tend.caindo ? "↓" : "↑"
                          }`}
                      </p>
                    </div>
                    <BadgeSituacaoGrupo s={g.situacao} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {sup && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-gray-500">
            Dados salvos automaticamente no seu navegador (sem servidor).
          </p>
          <Botao
            variante="fantasma"
            onClick={() => {
              if (
                confirm(
                  "Restaurar os dados de exemplo? Isto substitui TODOS os dados atuais."
                )
              ) {
                restaurarExemplo();
              }
            }}
          >
            Restaurar dados de exemplo
          </Botao>
        </Card>
      )}
    </div>
  );
}
