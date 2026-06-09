"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { gruposVisiveis, podeGerenciarGrupos } from "@/lib/acl";
import { Grupo, SITUACAO_GRUPO_LABEL, SituacaoGrupo } from "@/lib/types";
import {
  Botao,
  Campo,
  Card,
  Input,
  Modal,
  SectionTitle,
  Select,
  Vazio,
} from "@/components/ui";
import { BadgeSituacaoGrupo } from "@/components/badges";

export default function GruposPage() {
  const { db, usuarioAtual } = useApp();
  const grupos = gruposVisiveis(db, usuarioAtual);
  const podeGerenciar = podeGerenciarGrupos(usuarioAtual);
  const [editando, setEditando] = useState<Grupo | "novo" | null>(null);

  const contar = (grupoId: string) =>
    db.pessoas.filter((p) => p.grupoId === grupoId).length;

  return (
    <div>
      <SectionTitle
        acao={
          podeGerenciar && (
            <Botao onClick={() => setEditando("novo")}>+ Novo grupo</Botao>
          )
        }
      >
        Grupos / GCAs
      </SectionTitle>

      {grupos.length === 0 ? (
        <Vazio
          titulo="Nenhum grupo cadastrado"
          descricao="Cadastre um GCA para começar o acompanhamento."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grupos.map((g) => {
            const qtd = contar(g.id);
            return (
              <Card key={g.id} className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{g.nome}</h3>
                    <p className="text-sm text-gray-500">
                      Líder: {g.liderNome || "—"}
                    </p>
                  </div>
                  <BadgeSituacaoGrupo s={g.situacao} />
                </div>

                <dl className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                  <Linha rotulo="Auxiliar" valor={g.auxiliarNome} />
                  <Linha rotulo="Anfitrião" valor={g.anfitriaoNome} />
                  <Linha
                    rotulo="Encontro"
                    valor={
                      g.diaSemana || g.horario
                        ? `${g.diaSemana ?? ""} ${g.horario ?? ""}`.trim()
                        : undefined
                    }
                  />
                  <Linha rotulo="Supervisor" valor={g.supervisorNome} />
                  <Linha rotulo="Endereço" valor={g.endereco} span />
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm font-medium text-marca-700">
                    👥 {qtd} {qtd === 1 ? "pessoa" : "pessoas"}
                  </span>
                  {podeGerenciar && (
                    <Botao
                      variante="secundario"
                      onClick={() => setEditando(g)}
                    >
                      Editar
                    </Botao>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editando && (
        <FormGrupo
          grupo={editando === "novo" ? null : editando}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  span,
}: {
  rotulo: string;
  valor?: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{rotulo}</dt>
      <dd className="text-gray-700">{valor || "—"}</dd>
    </div>
  );
}

function FormGrupo({
  grupo,
  onFechar,
}: {
  grupo: Grupo | null;
  onFechar: () => void;
}) {
  const { db, salvarGrupo, removerGrupo } = useApp();
  const lideres = db.usuarios.filter((u) => u.perfil === "lider");
  const [form, setForm] = useState<Partial<Grupo>>(
    grupo ?? { nome: "", situacao: "saudavel" }
  );

  function set<K extends keyof Grupo>(k: K, v: Grupo[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function salvar() {
    if (!form.nome?.trim()) {
      alert("Informe o nome do grupo.");
      return;
    }
    salvarGrupo(form);
    onFechar();
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={grupo ? "Editar grupo" : "Novo grupo / GCA"}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome do grupo *" className="sm:col-span-2">
            <Input
              value={form.nome ?? ""}
              onChange={(e) => set("nome", e.target.value)}
              autoFocus
            />
          </Campo>
          <Campo label="Líder">
            <Select
              value={form.liderId ?? ""}
              onChange={(e) => {
                const u = lideres.find((x) => x.id === e.target.value);
                set("liderId", e.target.value || undefined);
                set("liderNome", u?.nome ?? form.liderNome ?? "");
              }}
            >
              <option value="">— Selecionar líder cadastrado —</option>
              {lideres.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Nome do líder (livre)">
            <Input
              value={form.liderNome ?? ""}
              onChange={(e) => set("liderNome", e.target.value)}
            />
          </Campo>
          <Campo label="Auxiliar">
            <Input
              value={form.auxiliarNome ?? ""}
              onChange={(e) => set("auxiliarNome", e.target.value)}
            />
          </Campo>
          <Campo label="Anfitrião">
            <Input
              value={form.anfitriaoNome ?? ""}
              onChange={(e) => set("anfitriaoNome", e.target.value)}
            />
          </Campo>
          <Campo label="Supervisor responsável">
            <Input
              value={form.supervisorNome ?? ""}
              onChange={(e) => set("supervisorNome", e.target.value)}
            />
          </Campo>
          <Campo label="Situação do grupo">
            <Select
              value={form.situacao ?? "saudavel"}
              onChange={(e) => set("situacao", e.target.value as SituacaoGrupo)}
            >
              {Object.entries(SITUACAO_GRUPO_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Dia da semana">
            <Input
              value={form.diaSemana ?? ""}
              onChange={(e) => set("diaSemana", e.target.value)}
              placeholder="Ex.: Quinta-feira"
            />
          </Campo>
          <Campo label="Horário">
            <Input
              value={form.horario ?? ""}
              onChange={(e) => set("horario", e.target.value)}
              placeholder="Ex.: 19:30"
            />
          </Campo>
          <Campo label="Endereço do encontro" className="sm:col-span-2">
            <Input
              value={form.endereco ?? ""}
              onChange={(e) => set("endereco", e.target.value)}
            />
          </Campo>
        </div>

        <div className="flex justify-between border-t border-gray-100 pt-4">
          {grupo ? (
            <Botao
              variante="perigo"
              onClick={() => {
                if (confirm(`Remover o grupo "${grupo.nome}"?`)) {
                  removerGrupo(grupo.id);
                  onFechar();
                }
              }}
            >
              Remover
            </Botao>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Botao variante="fantasma" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao onClick={salvar}>Salvar</Botao>
          </div>
        </div>
      </div>
    </Modal>
  );
}
