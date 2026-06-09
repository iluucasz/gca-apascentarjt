// Motor de alertas automáticos do GCA
import { Database, Pessoa, Usuario } from "./types";
import { pessoasVisiveis, gruposVisiveis, reunioesVisiveis } from "./acl";
import { diasDesde } from "./utils";

export type TipoAlerta =
  | "faltas_seguidas"
  | "grupo_sobrecarregado"
  | "grupo_diminuindo"
  | "familia_nova"
  | "cuidado_urgente";

export type Severidade = "alta" | "media" | "baixa";

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  severidade: Severidade;
  titulo: string;
  descricao: string;
  grupoId?: string;
  pessoaId?: string;
}

const DIAS_FAMILIA_NOVA = 14;

export function gerarAlertas(db: Database, u: Usuario | null): Alerta[] {
  const alertas: Alerta[] = [];
  const pessoas = pessoasVisiveis(db, u);
  const grupos = gruposVisiveis(db, u);
  const reunioes = reunioesVisiveis(db, u);
  const grupoIds = new Set(grupos.map((g) => g.id));

  const nomeGrupo = (id?: string) =>
    db.grupos.find((g) => g.id === id)?.nome ?? "Grupo";

  // 1. Pessoa faltou 3+ vezes seguidas (nas últimas reuniões do seu grupo)
  for (const p of pessoas) {
    const faltas = faltasConsecutivas(db, p);
    if (faltas >= 3) {
      alertas.push({
        id: `falta_${p.id}`,
        tipo: "faltas_seguidas",
        severidade: "alta",
        titulo: `${p.nomeCompleto} faltou ${faltas}× seguidas`,
        descricao: `Sem presença nas últimas ${faltas} reuniões do ${nomeGrupo(
          p.grupoId
        )}. Considere uma ligação ou visita.`,
        grupoId: p.grupoId,
        pessoaId: p.id,
      });
    }
  }

  // 2. Cuidado urgente
  for (const p of pessoas) {
    if (p.cuidadoUrgente) {
      alertas.push({
        id: `urgente_${p.id}`,
        tipo: "cuidado_urgente",
        severidade: "alta",
        titulo: `${p.nomeCompleto} marcada(o) como cuidado urgente`,
        descricao:
          p.observacoes?.trim() ||
          "Pessoa sinalizada para cuidado pastoral imediato.",
        grupoId: p.grupoId,
        pessoaId: p.id,
      });
    }
  }

  // 3. Grupo sobrecarregado
  for (const g of grupos) {
    if (g.situacao === "sobrecarregado") {
      const qtd = db.pessoas.filter((p) => p.grupoId === g.id).length;
      alertas.push({
        id: `sobrecarga_${g.id}`,
        tipo: "grupo_sobrecarregado",
        severidade: "media",
        titulo: `${g.nome} está sobrecarregado`,
        descricao: `${g.liderNome ?? "Líder"} pode precisar de apoio${
          qtd ? ` (${qtd} pessoas no grupo)` : ""
        }. Avalie multiplicar o grupo ou enviar um auxiliar.`,
        grupoId: g.id,
      });
    }
    if (g.situacao === "em_risco") {
      alertas.push({
        id: `risco_${g.id}`,
        tipo: "grupo_diminuindo",
        severidade: "alta",
        titulo: `${g.nome} está em risco`,
        descricao: "Grupo sinalizado como em risco. Requer atenção do supervisor.",
        grupoId: g.id,
      });
    }
  }

  // 4. Grupo diminuindo (tendência de presença em queda)
  for (const g of grupos) {
    const tendencia = tendenciaPresenca(db, g.id);
    if (tendencia && tendencia.caindo) {
      alertas.push({
        id: `queda_${g.id}`,
        tipo: "grupo_diminuindo",
        severidade: "media",
        titulo: `${g.nome} está diminuindo`,
        descricao: `Presença caiu de ${tendencia.anterior} para ${tendencia.atual} nas últimas reuniões.`,
        grupoId: g.id,
      });
    }
  }

  // 5. Família nova cadastrada
  for (const f of db.familias) {
    const d = diasDesde(f.criadoEm);
    if (d !== null && d <= DIAS_FAMILIA_NOVA) {
      // verifica se há pessoas dessa família em grupo visível
      const pessoasFam = db.pessoas.filter((p) => p.familiaId === f.id);
      const visivel =
        u?.perfil === "supervisor" ||
        pessoasFam.some((p) => p.grupoId && grupoIds.has(p.grupoId));
      if (visivel) {
        alertas.push({
          id: `familia_${f.id}`,
          tipo: "familia_nova",
          severidade: "baixa",
          titulo: `Nova família cadastrada: ${f.nome}`,
          descricao: `${pessoasFam.length} pessoa(s) vinculada(s). Acolha e acompanhe.`,
        });
      }
    }
  }

  const ordem: Record<Severidade, number> = { alta: 0, media: 1, baixa: 2 };
  return alertas.sort((a, b) => ordem[a.severidade] - ordem[b.severidade]);
}

// Quantas reuniões consecutivas (a partir da mais recente) a pessoa faltou
export function faltasConsecutivas(db: Database, p: Pessoa): number {
  if (!p.grupoId) return 0;
  const reunioes = db.reunioes
    .filter((r) => r.grupoId === p.grupoId)
    .sort((a, b) => b.data.localeCompare(a.data));
  let faltas = 0;
  for (const r of reunioes) {
    const reg = r.registros.find((x) => x.pessoaId === p.id);
    if (!reg) break; // não estava na lista — para de contar
    if (reg.presente) break;
    faltas++;
  }
  return faltas;
}

interface Tendencia {
  atual: number;
  anterior: number;
  caindo: boolean;
}

// Compara presença da última reunião com a anterior
export function tendenciaPresenca(db: Database, grupoId: string): Tendencia | null {
  const reunioes = db.reunioes
    .filter((r) => r.grupoId === grupoId)
    .sort((a, b) => b.data.localeCompare(a.data));
  if (reunioes.length < 2) return null;
  const atual = reunioes[0].registros.filter((r) => r.presente).length;
  const anterior = reunioes[1].registros.filter((r) => r.presente).length;
  return { atual, anterior, caindo: atual < anterior };
}
