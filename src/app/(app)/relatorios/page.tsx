"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  relatoriosVisiveis,
  pessoasVisiveis,
  gruposVisiveis,
  podeVerObservacoes,
  podeEscreverRelatorio,
  ehSupervisor,
} from "@/lib/acl";
import {
  Lutas,
  Marcos,
  Privacidade,
  PRIVACIDADE_LABEL,
  RelatorioEspiritual,
} from "@/lib/types";
import {
  Badge,
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
import { formatarData, formatarPeriodo, periodoAtual } from "@/lib/utils";

const LUTAS_LABEL: Record<keyof Lutas, string> = {
  familiar: "Familiar",
  emocional: "Emocional",
  financeira: "Financeira",
  espiritual: "Espiritual",
};

const MARCOS_LABEL: Record<keyof Marcos, string> = {
  reconciliacao: "Reconciliação",
  batismo: "Batismo",
  decisao: "Decisão",
  afastamento: "Afastamento",
};

export default function RelatoriosPage() {
  const { db, usuarioAtual } = useApp();
  const relatorios = relatoriosVisiveis(db, usuarioAtual).sort((a, b) =>
    b.data.localeCompare(a.data)
  );
  const grupos = gruposVisiveis(db, usuarioAtual);

  const [editando, setEditando] = useState<
    RelatorioEspiritual | "novo" | null
  >(null);
  const [detalhe, setDetalhe] = useState<RelatorioEspiritual | null>(null);
  const [filtroGrupo, setFiltroGrupo] = useState("");

  const nomePessoa = (id: string) =>
    db.pessoas.find((p) => p.id === id)?.nomeCompleto ?? "—";
  const nomeGrupo = (id: string) =>
    db.grupos.find((g) => g.id === id)?.nome ?? "—";

  const lista = relatorios.filter((r) =>
    filtroGrupo ? r.grupoId === filtroGrupo : true
  );

  return (
    <div>
      <SectionTitle
        acao={
          podeEscreverRelatorio(usuarioAtual) && (
            <Botao onClick={() => setEditando("novo")}>+ Novo relatório</Botao>
          )
        }
      >
        Relatórios espirituais
      </SectionTitle>

      <div className="mb-4 rounded-lg border border-marca-200 bg-marca-50 px-4 py-3 text-sm text-marca-800">
        🔒 As <b>observações pastorais</b> respeitam a privacidade: o líder vê
        apenas o próprio grupo, e relatórios marcados como “somente supervisor”
        ficam ocultos para os líderes.
      </div>

      {ehSupervisor(usuarioAtual) && grupos.length > 1 && (
        <div className="mb-4">
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
        </div>
      )}

      {lista.length === 0 ? (
        <Vazio
          titulo="Nenhum relatório ainda"
          descricao="Registre o acompanhamento espiritual de uma pessoa."
        />
      ) : (
        <div className="space-y-3">
          {lista.map((r) => {
            const lutasAtivas = Object.entries(r.lutas).filter(([, v]) => v);
            return (
              <Card
                key={r.id}
                className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => setDetalhe(r)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {nomePessoa(r.pessoaId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {nomeGrupo(r.grupoId)} · {formatarPeriodo(r.periodo)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {r.precisaVisita && <Badge cor="laranja">Visita</Badge>}
                    {r.precisaAconselhamento && (
                      <Badge cor="amarelo">Aconselhamento</Badge>
                    )}
                    {lutasAtivas.length > 0 && (
                      <Badge cor="vermelho">
                        {lutasAtivas.length} luta(s)
                      </Badge>
                    )}
                    {r.privacidade === "somente_supervisor" && (
                      <Badge cor="roxo">🔒 Supervisor</Badge>
                    )}
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {detalhe && (
        <DetalheRelatorio
          rel={detalhe}
          onFechar={() => setDetalhe(null)}
          onEditar={() => {
            setEditando(detalhe);
            setDetalhe(null);
          }}
        />
      )}

      {editando && (
        <FormRelatorio
          rel={editando === "novo" ? null : editando}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function ItemSimNao({ label, valor }: { label: string; valor?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
      <span className="text-gray-700">{label}</span>
      <span
        className={valor ? "font-medium text-green-700" : "text-gray-400"}
      >
        {valor ? "Sim" : "Não"}
      </span>
    </div>
  );
}

function DetalheRelatorio({
  rel,
  onFechar,
  onEditar,
}: {
  rel: RelatorioEspiritual;
  onFechar: () => void;
  onEditar: () => void;
}) {
  const { db, usuarioAtual, removerRelatorio } = useApp();
  const pessoa = db.pessoas.find((p) => p.id === rel.pessoaId);
  const verObs = podeVerObservacoes(usuarioAtual, rel);
  const lutasAtivas = Object.entries(rel.lutas)
    .filter(([, v]) => v)
    .map(([k]) => LUTAS_LABEL[k as keyof Lutas]);
  const marcosAtivos = Object.entries(rel.marcos)
    .filter(([, v]) => v)
    .map(([k]) => MARCOS_LABEL[k as keyof Marcos]);
  const podeEditar =
    usuarioAtual?.perfil === "supervisor" ||
    (usuarioAtual?.perfil === "lider" && rel.grupoId === usuarioAtual.grupoId);

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={`Relatório · ${pessoa?.nomeCompleto ?? ""}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {formatarPeriodo(rel.periodo)} · registrado em{" "}
          {formatarData(rel.data)}
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <ItemSimNao label="Frequentando o grupo" valor={rel.frequentandoGrupo} />
          <ItemSimNao label="Indo aos cultos" valor={rel.indoCultos} />
          <ItemSimNao label="Lendo a Bíblia" valor={rel.lendoBiblia} />
          <ItemSimNao label="Em vida de oração" valor={rel.orando} />
          <ItemSimNao label="Precisa de visita" valor={rel.precisaVisita} />
          <ItemSimNao
            label="Precisa de aconselhamento"
            valor={rel.precisaAconselhamento}
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase text-gray-400">
            Lutas
          </p>
          {lutasAtivas.length ? (
            <div className="flex flex-wrap gap-1.5">
              {lutasAtivas.map((l) => (
                <Badge key={l} cor="vermelho">
                  {l}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma luta sinalizada.</p>
          )}
        </div>

        {marcosAtivos.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-gray-400">
              Marcos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {marcosAtivos.map((m) => (
                <Badge key={m} cor="azul">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-gray-400">
            Observações pastorais
            <Badge cor="roxo">🔒 {PRIVACIDADE_LABEL[rel.privacidade]}</Badge>
          </p>
          {verObs ? (
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              {rel.observacoesPastorais?.trim() || "Sem observações."}
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm italic text-gray-400">
              Conteúdo restrito pela privacidade deste relatório.
            </p>
          )}
        </div>

        {podeEditar && (
          <div className="flex justify-between border-t border-gray-100 pt-4">
            <Botao
              variante="perigo"
              onClick={() => {
                if (confirm("Remover este relatório?")) {
                  removerRelatorio(rel.id);
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

function FormRelatorio({
  rel,
  onFechar,
}: {
  rel: RelatorioEspiritual | null;
  onFechar: () => void;
}) {
  const { db, usuarioAtual, salvarRelatorio } = useApp();
  const pessoas = pessoasVisiveis(db, usuarioAtual);

  const [form, setForm] = useState<Partial<RelatorioEspiritual>>(
    rel ?? {
      periodo: periodoAtual(),
      lutas: {},
      marcos: {},
      privacidade: "lider_e_supervisor",
      autorId: usuarioAtual?.id,
    }
  );

  function set<K extends keyof RelatorioEspiritual>(
    k: K,
    v: RelatorioEspiritual[K]
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setLuta(k: keyof Lutas, v: boolean) {
    setForm((f) => ({ ...f, lutas: { ...f.lutas, [k]: v } }));
  }
  function setMarco(k: keyof Marcos, v: boolean) {
    setForm((f) => ({ ...f, marcos: { ...f.marcos, [k]: v } }));
  }

  function salvar() {
    if (!form.pessoaId) {
      alert("Selecione a pessoa.");
      return;
    }
    const pessoa = db.pessoas.find((p) => p.id === form.pessoaId);
    salvarRelatorio({
      ...form,
      grupoId: pessoa?.grupoId ?? form.grupoId ?? "",
    });
    onFechar();
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={rel ? "Editar relatório" : "Novo relatório espiritual"}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Pessoa *">
            <Select
              value={form.pessoaId ?? ""}
              onChange={(e) => set("pessoaId", e.target.value)}
              disabled={!!rel}
            >
              <option value="">— Selecionar —</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomeCompleto}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Período (mês)">
            <Input
              type="month"
              value={form.periodo ?? ""}
              onChange={(e) => set("periodo", e.target.value)}
            />
          </Campo>
        </div>

        <p className="pt-1 text-xs font-semibold uppercase text-marca-600">
          Vida espiritual
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Check
            label="Está frequentando o grupo"
            checked={!!form.frequentandoGrupo}
            onChange={(v) => set("frequentandoGrupo", v)}
          />
          <Check
            label="Está indo aos cultos"
            checked={!!form.indoCultos}
            onChange={(v) => set("indoCultos", v)}
          />
          <Check
            label="Está lendo a Bíblia"
            checked={!!form.lendoBiblia}
            onChange={(v) => set("lendoBiblia", v)}
          />
          <Check
            label="Está orando"
            checked={!!form.orando}
            onChange={(v) => set("orando", v)}
          />
          <Check
            label="Precisa de visita"
            checked={!!form.precisaVisita}
            onChange={(v) => set("precisaVisita", v)}
          />
          <Check
            label="Precisa de aconselhamento"
            checked={!!form.precisaAconselhamento}
            onChange={(v) => set("precisaAconselhamento", v)}
          />
        </div>

        <p className="pt-1 text-xs font-semibold uppercase text-marca-600">
          Está passando por alguma luta?
        </p>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(LUTAS_LABEL) as (keyof Lutas)[]).map((k) => (
            <Check
              key={k}
              label={LUTAS_LABEL[k]}
              checked={!!form.lutas?.[k]}
              onChange={(v) => setLuta(k, v)}
            />
          ))}
        </div>

        <p className="pt-1 text-xs font-semibold uppercase text-marca-600">
          Marcos no período
        </p>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(MARCOS_LABEL) as (keyof Marcos)[]).map((k) => (
            <Check
              key={k}
              label={MARCOS_LABEL[k]}
              checked={!!form.marcos?.[k]}
              onChange={(v) => setMarco(k, v)}
            />
          ))}
        </div>

        <Campo label="Observações pastorais">
          <TextArea
            value={form.observacoesPastorais ?? ""}
            onChange={(e) => set("observacoesPastorais", e.target.value)}
            placeholder="Anotações sensíveis do cuidado pastoral…"
          />
        </Campo>

        <Campo
          label="Privacidade das observações"
          hint="Quem poderá ler as observações pastorais."
        >
          <Select
            value={form.privacidade ?? "lider_e_supervisor"}
            onChange={(e) => set("privacidade", e.target.value as Privacidade)}
          >
            {Object.entries(PRIVACIDADE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Campo>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Botao variante="fantasma" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao onClick={salvar}>Salvar relatório</Botao>
        </div>
      </div>
    </Modal>
  );
}
