"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  pessoasVisiveis,
  gruposVisiveis,
  podeEditarPessoa,
  ehSupervisor,
} from "@/lib/acl";
import {
  ESTADO_CIVIL_LABEL,
  EstadoCivil,
  Parentesco,
  PARENTESCO_LABEL,
  Pessoa,
  SITUACAO_PESSOA_LABEL,
  SituacaoPessoa,
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
import { BadgeSituacaoPessoa } from "@/components/badges";
import {
  calcularIdade,
  classNames,
  formatarData,
  iniciais,
  linkWhatsApp,
} from "@/lib/utils";

type Aba = "lista" | "familias";

export default function PessoasPage() {
  const app = useApp();
  const { db, usuarioAtual } = app;
  const pessoas = pessoasVisiveis(db, usuarioAtual);
  const grupos = gruposVisiveis(db, usuarioAtual);

  const [aba, setAba] = useState<Aba>("lista");
  const [busca, setBusca] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [editando, setEditando] = useState<Pessoa | "novo" | null>(null);
  const [detalhe, setDetalhe] = useState<Pessoa | null>(null);

  const filtradas = useMemo(() => {
    return pessoas
      .filter((p) =>
        busca
          ? p.nomeCompleto.toLowerCase().includes(busca.toLowerCase())
          : true
      )
      .filter((p) => (filtroGrupo ? p.grupoId === filtroGrupo : true))
      .filter((p) => (filtroSituacao ? p.situacao === filtroSituacao : true))
      .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
  }, [pessoas, busca, filtroGrupo, filtroSituacao]);

  const nomeGrupo = (id?: string) =>
    db.grupos.find((g) => g.id === id)?.nome ?? "—";

  return (
    <div>
      <SectionTitle
        acao={
          podeEditarPessoa(usuarioAtual) && (
            <Botao onClick={() => setEditando("novo")}>+ Nova pessoa</Botao>
          )
        }
      >
        Pessoas
      </SectionTitle>

      {/* abas internas */}
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1">
        {(["lista", "familias"] as Aba[]).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={classNames(
              "rounded-md px-4 py-1.5 text-sm font-medium",
              aba === a
                ? "bg-marca-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {a === "lista" ? "Lista" : "Árvore familiar"}
          </button>
        ))}
      </div>

      {aba === "lista" ? (
        <>
          {/* filtros */}
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Buscar por nome…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-xs"
            />
            {ehSupervisor(usuarioAtual) && (
              <Select
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                className="max-w-xs"
              >
                <option value="">Todos os grupos</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </Select>
            )}
            <Select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="max-w-xs"
            >
              <option value="">Todas as situações</option>
              {Object.entries(SITUACAO_PESSOA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          {filtradas.length === 0 ? (
            <Vazio
              titulo="Nenhuma pessoa encontrada"
              descricao="Ajuste os filtros ou cadastre uma nova pessoa."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.map((p) => (
                <Card
                  key={p.id}
                  className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => setDetalhe(p)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-marca-100 text-sm font-semibold text-marca-700">
                      {iniciais(p.nomeCompleto)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-800">
                        {p.nomeCompleto}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {nomeGrupo(p.grupoId)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <BadgeSituacaoPessoa s={p.situacao} />
                        {p.cuidadoUrgente && (
                          <span className="text-xs font-medium text-red-600">
                            ⚠ Cuidado urgente
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <ArvoreFamiliar onAbrir={(p) => setDetalhe(p)} />
      )}

      {/* Modal de detalhe */}
      {detalhe && (
        <DetalhePessoa
          pessoa={detalhe}
          onFechar={() => setDetalhe(null)}
          onEditar={() => {
            setEditando(detalhe);
            setDetalhe(null);
          }}
        />
      )}

      {/* Modal de formulário */}
      {editando && (
        <FormPessoa
          pessoa={editando === "novo" ? null : editando}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detalhe da pessoa
// ---------------------------------------------------------------------------
function DetalhePessoa({
  pessoa,
  onFechar,
  onEditar,
}: {
  pessoa: Pessoa;
  onFechar: () => void;
  onEditar: () => void;
}) {
  const { db, usuarioAtual, removerPessoa } = useApp();
  const grupo = db.grupos.find((g) => g.id === pessoa.grupoId);
  const familia = db.familias.find((f) => f.id === pessoa.familiaId);
  const familiares = db.pessoas.filter(
    (p) => p.familiaId && p.familiaId === pessoa.familiaId && p.id !== pessoa.id
  );
  const idade = calcularIdade(pessoa.dataNascimento);
  const wpp = linkWhatsApp(pessoa.telefone);
  const podeEditar = podeEditarPessoa(usuarioAtual, pessoa);

  return (
    <Modal aberto onFechar={onFechar} titulo={pessoa.nomeCompleto}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeSituacaoPessoa s={pessoa.situacao} />
          {pessoa.cuidadoUrgente && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              ⚠ Cuidado urgente
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Info rotulo="Nascimento">
            {formatarData(pessoa.dataNascimento)}
            {idade !== null && ` (${idade} anos)`}
          </Info>
          <Info rotulo="Estado civil">
            {pessoa.estadoCivil
              ? ESTADO_CIVIL_LABEL[pessoa.estadoCivil]
              : "—"}
          </Info>
          <Info rotulo="Telefone / WhatsApp">
            {pessoa.telefone ? (
              wpp ? (
                <a
                  href={wpp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-marca-600 hover:underline"
                >
                  {pessoa.telefone} 💬
                </a>
              ) : (
                pessoa.telefone
              )
            ) : (
              "—"
            )}
          </Info>
          <Info rotulo="Profissão">{pessoa.profissao || "—"}</Info>
          <Info rotulo="Endereço">{pessoa.endereco || "—"}</Info>
          <Info rotulo="Bairro">{pessoa.bairro || "—"}</Info>
          <Info rotulo="Grupo / GCA">{grupo?.nome || "—"}</Info>
          <Info rotulo="Família">{familia?.nome || "—"}</Info>
        </dl>

        {pessoa.observacoes && (
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="mb-1 text-xs font-medium uppercase text-gray-400">
              Observações
            </p>
            {pessoa.observacoes}
          </div>
        )}

        {familia && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-gray-400">
              {familia.nome}
            </p>
            {familiares.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhum outro familiar cadastrado.
              </p>
            ) : (
              <ul className="space-y-1">
                {familiares.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-800">{f.nomeCompleto}</span>
                    <span className="text-xs text-gray-500">
                      {f.parentesco ? PARENTESCO_LABEL[f.parentesco] : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {podeEditar && (
          <div className="flex justify-between border-t border-gray-100 pt-4">
            <Botao
              variante="perigo"
              onClick={() => {
                if (
                  confirm(
                    `Remover ${pessoa.nomeCompleto}? Esta ação não pode ser desfeita.`
                  )
                ) {
                  removerPessoa(pessoa.id);
                  onFechar();
                }
              }}
            >
              Remover
            </Botao>
            <Botao onClick={onEditar}>Editar</Botao>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Info({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {rotulo}
      </dt>
      <dd className="mt-0.5 text-gray-800">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulário de pessoa
// ---------------------------------------------------------------------------
function FormPessoa({
  pessoa,
  onFechar,
}: {
  pessoa: Pessoa | null;
  onFechar: () => void;
}) {
  const { db, usuarioAtual, salvarPessoa, salvarFamilia } = useApp();
  const grupos = gruposVisiveis(db, usuarioAtual);
  const grupoPadrao =
    pessoa?.grupoId ?? (usuarioAtual?.grupoId || grupos[0]?.id || "");

  const [form, setForm] = useState<Partial<Pessoa>>(
    pessoa ?? {
      nomeCompleto: "",
      situacao: "visitante",
      grupoId: grupoPadrao,
    }
  );
  const [novaFamilia, setNovaFamilia] = useState("");

  function set<K extends keyof Pessoa>(k: K, v: Pessoa[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function salvar() {
    if (!form.nomeCompleto?.trim()) {
      alert("Informe o nome completo.");
      return;
    }
    let familiaId = form.familiaId;
    if (novaFamilia.trim()) {
      const f = salvarFamilia({ nome: novaFamilia.trim() });
      familiaId = f.id;
    }
    salvarPessoa({ ...form, familiaId });
    onFechar();
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={pessoa ? "Editar pessoa" : "Nova pessoa"}
    >
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase text-marca-600">
          Dados pessoais
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome completo *" className="sm:col-span-2">
            <Input
              value={form.nomeCompleto ?? ""}
              onChange={(e) => set("nomeCompleto", e.target.value)}
              autoFocus
            />
          </Campo>
          <Campo label="Data de nascimento">
            <Input
              type="date"
              value={form.dataNascimento ?? ""}
              onChange={(e) => set("dataNascimento", e.target.value)}
            />
          </Campo>
          <Campo label="Telefone / WhatsApp">
            <Input
              value={form.telefone ?? ""}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(11) 90000-0000"
            />
          </Campo>
          <Campo label="Estado civil">
            <Select
              value={form.estadoCivil ?? ""}
              onChange={(e) =>
                set("estadoCivil", (e.target.value || undefined) as EstadoCivil)
              }
            >
              <option value="">—</option>
              {Object.entries(ESTADO_CIVIL_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Profissão">
            <Input
              value={form.profissao ?? ""}
              onChange={(e) => set("profissao", e.target.value)}
            />
          </Campo>
          <Campo label="Endereço">
            <Input
              value={form.endereco ?? ""}
              onChange={(e) => set("endereco", e.target.value)}
            />
          </Campo>
          <Campo label="Bairro">
            <Input
              value={form.bairro ?? ""}
              onChange={(e) => set("bairro", e.target.value)}
            />
          </Campo>
        </div>

        <p className="pt-2 text-xs font-semibold uppercase text-marca-600">
          Vínculo
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Grupo / GCA">
            <Select
              value={form.grupoId ?? ""}
              onChange={(e) => set("grupoId", e.target.value || undefined)}
              disabled={usuarioAtual?.perfil !== "supervisor"}
            >
              <option value="">—</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Situação">
            <Select
              value={form.situacao ?? "visitante"}
              onChange={(e) => set("situacao", e.target.value as SituacaoPessoa)}
            >
              {Object.entries(SITUACAO_PESSOA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Campo>
        </div>

        <p className="pt-2 text-xs font-semibold uppercase text-marca-600">
          Família
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Família existente">
            <Select
              value={form.familiaId ?? ""}
              onChange={(e) => {
                set("familiaId", e.target.value || undefined);
                setNovaFamilia("");
              }}
            >
              <option value="">— Sem família / nova abaixo</option>
              {db.familias.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Ou criar nova família" hint="Ex.: Família Silva">
            <Input
              value={novaFamilia}
              onChange={(e) => setNovaFamilia(e.target.value)}
              placeholder="Família…"
            />
          </Campo>
          <Campo label="Grau de parentesco">
            <Select
              value={form.parentesco ?? ""}
              onChange={(e) =>
                set("parentesco", (e.target.value || undefined) as Parentesco)
              }
            >
              <option value="">—</option>
              {Object.entries(PARENTESCO_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Campo>
        </div>

        <p className="pt-2 text-xs font-semibold uppercase text-marca-600">
          Cuidado pastoral
        </p>
        <div className="space-y-3">
          <Check
            label="Marcar como cuidado urgente (gera alerta)"
            checked={!!form.cuidadoUrgente}
            onChange={(v) => set("cuidadoUrgente", v)}
          />
          <Campo label="Observações">
            <TextArea
              value={form.observacoes ?? ""}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </Campo>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Botao variante="fantasma" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Árvore familiar
// ---------------------------------------------------------------------------
function ArvoreFamiliar({ onAbrir }: { onAbrir: (p: Pessoa) => void }) {
  const { db, usuarioAtual } = useApp();
  const pessoas = pessoasVisiveis(db, usuarioAtual);
  const familias = db.familias.filter((f) =>
    pessoas.some((p) => p.familiaId === f.id)
  );
  const semFamilia = pessoas.filter((p) => !p.familiaId);

  if (familias.length === 0 && semFamilia.length === 0) {
    return <Vazio titulo="Nenhuma família cadastrada ainda" />;
  }

  const ordemParentesco: Record<Parentesco, number> = {
    esposo: 0,
    esposa: 1,
    pai: 2,
    mae: 3,
    filho: 4,
    filha: 5,
    outro: 6,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {familias.map((f) => {
        const membros = pessoas
          .filter((p) => p.familiaId === f.id)
          .sort(
            (a, b) =>
              (a.parentesco ? ordemParentesco[a.parentesco] : 9) -
              (b.parentesco ? ordemParentesco[b.parentesco] : 9)
          );
        return (
          <Card key={f.id} className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🌳</span>
              <h3 className="font-semibold text-gray-800">{f.nome}</h3>
              <span className="ml-auto text-xs text-gray-400">
                {membros.length} membro(s)
              </span>
            </div>
            <ul className="space-y-2 border-l-2 border-marca-200 pl-4">
              {membros.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => onAbrir(m)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-marca-100 text-[11px] font-semibold text-marca-700">
                      {iniciais(m.nomeCompleto)}
                    </span>
                    <span className="text-sm text-gray-800 hover:text-marca-700">
                      {m.nomeCompleto}
                    </span>
                    {m.parentesco && (
                      <span className="ml-auto text-xs text-gray-400">
                        {PARENTESCO_LABEL[m.parentesco]}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {semFamilia.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-gray-800">
            Sem família vinculada
          </h3>
          <ul className="space-y-2">
            {semFamilia.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => onAbrir(m)}
                  className="text-sm text-gray-700 hover:text-marca-700"
                >
                  {m.nomeCompleto}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
