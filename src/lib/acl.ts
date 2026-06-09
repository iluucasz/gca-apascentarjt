// Regras de acesso por perfil
// supervisor: vê tudo
// líder: vê apenas o seu grupo e os membros/relatórios dele
// auxiliar: acesso limitado ao seu grupo (presença e cadastro básico),
//           NÃO vê observações pastorais dos relatórios

import {
  Database,
  Grupo,
  Pessoa,
  RelatorioEspiritual,
  Reuniao,
  Usuario,
} from "./types";

export function ehSupervisor(u: Usuario | null): boolean {
  return u?.perfil === "supervisor";
}

export function grupoIdsVisiveis(db: Database, u: Usuario | null): string[] {
  if (!u) return [];
  if (u.perfil === "supervisor") return db.grupos.map((g) => g.id);
  return u.grupoId ? [u.grupoId] : [];
}

export function gruposVisiveis(db: Database, u: Usuario | null): Grupo[] {
  const ids = new Set(grupoIdsVisiveis(db, u));
  return db.grupos.filter((g) => ids.has(g.id));
}

export function pessoasVisiveis(db: Database, u: Usuario | null): Pessoa[] {
  if (ehSupervisor(u)) return db.pessoas;
  const ids = new Set(grupoIdsVisiveis(db, u));
  return db.pessoas.filter((p) => p.grupoId && ids.has(p.grupoId));
}

export function reunioesVisiveis(db: Database, u: Usuario | null): Reuniao[] {
  if (ehSupervisor(u)) return db.reunioes;
  const ids = new Set(grupoIdsVisiveis(db, u));
  return db.reunioes.filter((r) => ids.has(r.grupoId));
}

export function relatoriosVisiveis(
  db: Database,
  u: Usuario | null
): RelatorioEspiritual[] {
  if (ehSupervisor(u)) return db.relatorios;
  const ids = new Set(grupoIdsVisiveis(db, u));
  return db.relatorios.filter((r) => ids.has(r.grupoId));
}

// Pode o usuário ver as observações pastorais (campo sensível) deste relatório?
export function podeVerObservacoes(
  u: Usuario | null,
  rel: RelatorioEspiritual
): boolean {
  if (!u) return false;
  if (u.perfil === "supervisor") return true;
  if (u.perfil === "auxiliar") return false; // auxiliar nunca vê observações
  // líder: vê se for do seu grupo e a privacidade permitir
  const doSeuGrupo = rel.grupoId === u.grupoId;
  return doSeuGrupo && rel.privacidade === "lider_e_supervisor";
}

// Permissões de edição
export function podeGerenciarGrupos(u: Usuario | null): boolean {
  return ehSupervisor(u);
}

export function podeEditarPessoa(u: Usuario | null, p?: Pessoa): boolean {
  if (!u) return false;
  if (u.perfil === "supervisor") return true;
  if (!p) return !!u.grupoId; // criar nova no próprio grupo
  return p.grupoId === u.grupoId;
}

export function podeRegistrarFrequencia(u: Usuario | null): boolean {
  // todos os perfis podem registrar frequência (auxiliar inclusive)
  return !!u;
}

export function podeEscreverRelatorio(u: Usuario | null): boolean {
  // auxiliar não escreve relatório espiritual
  return u?.perfil === "supervisor" || u?.perfil === "lider";
}

// Abas visíveis na navegação por perfil
export function abasVisiveis(u: Usuario | null): string[] {
  if (!u) return [];
  const base = ["painel", "pessoas", "grupos", "frequencia", "alertas"];
  if (u.perfil === "auxiliar") {
    // auxiliar: sem relatórios espirituais
    return base;
  }
  return ["painel", "pessoas", "grupos", "frequencia", "relatorios", "alertas"];
}
