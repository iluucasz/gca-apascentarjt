"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  gruposVisiveis,
  reunioesVisiveis,
  ehSupervisor,
} from "@/lib/acl";
import {
  RegistroPresenca,
  Reuniao,
  Visitante,
} from "@/lib/types";
import {
  Botao,
  Campo,
  Card,
  Check,
  Input,
  Modal,
  SectionTitle,
  Select,
  TextArea,
  Vazio,
} from "@/components/ui";
import { classNames, formatarData, hoje } from "@/lib/utils";

export default function FrequenciaPage() {
  const { db, usuarioAtual } = useApp();
  const grupos = gruposVisiveis(db, usuarioAtual);
  const reunioes = reunioesVisiveis(db, usuarioAtual).sort((a, b) =>
    b.data.localeCompare(a.data)
  );

  const [grupoSel, setGrupoSel] = useState(
    usuarioAtual?.grupoId || grupos[0]?.id || ""
  );
  const [chamada, setChamada] = useState<Reuniao | "nova" | null>(null);

  const reunioesGrupo = reunioes.filter((r) =>
    grupoSel ? r.grupoId === grupoSel : true
  );

  const nomeGrupo = (id: string) =>
    db.grupos.find((g) => g.id === id)?.nome ?? "—";

  return (
    <div>
      <SectionTitle
        acao={
          grupoSel && (
            <Botao onClick={() => setChamada("nova")}>+ Nova chamada</Botao>
          )
        }
      >
        Frequência
      </SectionTitle>

      {ehSupervisor(usuarioAtual) && grupos.length > 1 && (
        <div className="mb-4">
          <Select
            value={grupoSel}
            onChange={(e) => setGrupoSel(e.target.value)}
            className="max-w-xs"
          >
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </Select>
        </div>
      )}

      {reunioesGrupo.length === 0 ? (
        <Vazio
          titulo="Nenhuma reunião registrada"
          descricao="Registre a primeira chamada deste grupo."
        />
      ) : (
        <div className="space-y-3">
          {reunioesGrupo.map((r) => {
            const presentes = r.registros.filter((x) => x.presente).length;
            const ausentes = r.registros.filter((x) => !x.presente).length;
            const cuidado = r.registros.filter(
              (x) => x.precisaLigacao || x.precisaVisita
            ).length;
            return (
              <Card
                key={r.id}
                className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => setChamada(r)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {formatarData(r.data)}
                      {ehSupervisor(usuarioAtual) && (
                        <span className="ml-2 text-xs text-gray-400">
                          {nomeGrupo(r.grupoId)}
                        </span>
                      )}
                    </p>
                    {r.tema && (
                      <p className="text-sm text-gray-500">{r.tema}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-green-700">✅ {presentes}</span>
                    <span className="text-gray-400">✖ {ausentes}</span>
                    {r.visitantes.length > 0 && (
                      <span className="text-purple-700">
                        🙋 {r.visitantes.length} visit.
                      </span>
                    )}
                    {cuidado > 0 && (
                      <span className="text-orange-600">
                        📞 {cuidado} p/ cuidar
                      </span>
                    )}
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {chamada && grupoSel && (
        <FormChamada
          reuniao={chamada === "nova" ? null : chamada}
          grupoId={chamada === "nova" ? grupoSel : chamada.grupoId}
          onFechar={() => setChamada(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulário de chamada
// ---------------------------------------------------------------------------
function FormChamada({
  reuniao,
  grupoId,
  onFechar,
}: {
  reuniao: Reuniao | null;
  grupoId: string;
  onFechar: () => void;
}) {
  const { db, usuarioAtual, salvarReuniao, removerReuniao } = useApp();
  const membros = useMemo(
    () =>
      db.pessoas
        .filter((p) => p.grupoId === grupoId)
        .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)),
    [db.pessoas, grupoId]
  );

  const [data, setData] = useState(reuniao?.data ?? hoje());
  const [tema, setTema] = useState(reuniao?.tema ?? "");
  const [registros, setRegistros] = useState<Record<string, RegistroPresenca>>(
    () => {
      const map: Record<string, RegistroPresenca> = {};
      for (const m of membros) {
        const existente = reuniao?.registros.find((r) => r.pessoaId === m.id);
        map[m.id] = existente ?? { pessoaId: m.id, presente: true };
      }
      return map;
    }
  );
  const [visitantes, setVisitantes] = useState<Visitante[]>(
    reuniao?.visitantes ?? []
  );

  function atualizar(pessoaId: string, patch: Partial<RegistroPresenca>) {
    setRegistros((r) => ({
      ...r,
      [pessoaId]: { ...r[pessoaId], ...patch },
    }));
  }

  function salvar() {
    salvarReuniao({
      id: reuniao?.id,
      grupoId,
      data,
      tema: tema.trim() || undefined,
      registros: Object.values(registros),
      visitantes: visitantes.filter((v) => v.nome.trim()),
    });
    onFechar();
  }

  const nomeGrupo = db.grupos.find((g) => g.id === grupoId)?.nome ?? "";

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={reuniao ? "Editar chamada" : "Nova chamada"}
      largura="max-w-3xl"
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-500">{nomeGrupo}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Data da reunião">
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </Campo>
          <Campo label="Tema / assunto">
            <Input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex.: O Bom Pastor"
            />
          </Campo>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-marca-600">
            Presença ({membros.length} membros)
          </p>
          {membros.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhuma pessoa cadastrada neste grupo ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {membros.map((m) => {
                const reg = registros[m.id];
                return (
                  <div
                    key={m.id}
                    className={classNames(
                      "rounded-lg border p-3",
                      reg.presente
                        ? "border-green-200 bg-green-50/50"
                        : "border-gray-200 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-800">
                        {m.nomeCompleto}
                      </span>
                      <div className="inline-flex overflow-hidden rounded-lg border border-gray-300">
                        <button
                          onClick={() => atualizar(m.id, { presente: true })}
                          className={classNames(
                            "px-3 py-1 text-sm font-medium",
                            reg.presente
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-600"
                          )}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => atualizar(m.id, { presente: false })}
                          className={classNames(
                            "px-3 py-1 text-sm font-medium",
                            !reg.presente
                              ? "bg-red-500 text-white"
                              : "bg-white text-gray-600"
                          )}
                        >
                          Ausente
                        </button>
                      </div>
                    </div>
                    {!reg.presente && (
                      <div className="mt-3 space-y-2">
                        <Input
                          value={reg.motivoAusencia ?? ""}
                          onChange={(e) =>
                            atualizar(m.id, { motivoAusencia: e.target.value })
                          }
                          placeholder="Motivo da ausência"
                        />
                        <div className="flex flex-wrap gap-4">
                          <Check
                            label="Precisa de ligação"
                            checked={!!reg.precisaLigacao}
                            onChange={(v) =>
                              atualizar(m.id, { precisaLigacao: v })
                            }
                          />
                          <Check
                            label="Precisa de visita"
                            checked={!!reg.precisaVisita}
                            onChange={(v) =>
                              atualizar(m.id, { precisaVisita: v })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Visitantes */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-marca-600">
              Visitantes
            </p>
            <Botao
              variante="secundario"
              onClick={() =>
                setVisitantes((v) => [...v, { nome: "", telefone: "" }])
              }
            >
              + Adicionar visitante
            </Botao>
          </div>
          {visitantes.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum visitante.</p>
          ) : (
            <div className="space-y-2">
              {visitantes.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={v.nome}
                    onChange={(e) =>
                      setVisitantes((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, nome: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Nome do visitante"
                  />
                  <Input
                    value={v.telefone ?? ""}
                    onChange={(e) =>
                      setVisitantes((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, telefone: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Telefone"
                    className="max-w-[160px]"
                  />
                  <Botao
                    variante="fantasma"
                    onClick={() =>
                      setVisitantes((arr) => arr.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </Botao>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-gray-100 pt-4">
          {reuniao && usuarioAtual?.perfil === "supervisor" ? (
            <Botao
              variante="perigo"
              onClick={() => {
                if (confirm("Remover esta chamada?")) {
                  removerReuniao(reuniao.id);
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
            <Botao onClick={salvar}>Salvar chamada</Botao>
          </div>
        </div>
      </div>
    </Modal>
  );
}
