// Modelo de dados do GCA — Grupo de Crescimento Apascentar
// Ministério Apascentar Jardim Tropical

export type Perfil = "supervisor" | "lider" | "auxiliar";

export const PERFIL_LABEL: Record<Perfil, string> = {
  supervisor: "Supervisor / Admin",
  lider: "Líder",
  auxiliar: "Auxiliar",
};

export interface Usuario {
  id: string;
  nome: string;
  perfil: Perfil;
  pin: string; // PIN local (4+ dígitos)
  grupoId?: string; // grupo do líder/auxiliar
}

// ---------------------------------------------------------------------------
// Pessoas e Famílias
// ---------------------------------------------------------------------------

export type SituacaoPessoa =
  | "visitante"
  | "membro"
  | "novo_convertido"
  | "afastado";

export const SITUACAO_PESSOA_LABEL: Record<SituacaoPessoa, string> = {
  visitante: "Visitante",
  membro: "Membro",
  novo_convertido: "Novo convertido",
  afastado: "Afastado",
};

export type EstadoCivil =
  | "solteiro"
  | "casado"
  | "uniao_estavel"
  | "divorciado"
  | "viuvo";

export const ESTADO_CIVIL_LABEL: Record<EstadoCivil, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  uniao_estavel: "União estável",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
};

export type Parentesco =
  | "esposo"
  | "esposa"
  | "filho"
  | "filha"
  | "pai"
  | "mae"
  | "outro";

export const PARENTESCO_LABEL: Record<Parentesco, string> = {
  esposo: "Esposo",
  esposa: "Esposa",
  filho: "Filho",
  filha: "Filha",
  pai: "Pai",
  mae: "Mãe",
  outro: "Outro",
};

export interface Familia {
  id: string;
  nome: string; // ex.: "Família Silva"
  criadoEm: string;
}

export interface Pessoa {
  id: string;
  nomeCompleto: string;
  dataNascimento?: string; // ISO yyyy-mm-dd
  telefone?: string; // WhatsApp
  endereco?: string;
  bairro?: string;
  estadoCivil?: EstadoCivil;
  profissao?: string;
  grupoId?: string;
  situacao: SituacaoPessoa;
  familiaId?: string;
  parentesco?: Parentesco; // papel dentro da família
  cuidadoUrgente?: boolean;
  observacoes?: string;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Grupos / GCAs
// ---------------------------------------------------------------------------

export type SituacaoGrupo =
  | "saudavel"
  | "em_crescimento"
  | "em_atencao"
  | "sobrecarregado"
  | "em_risco";

export const SITUACAO_GRUPO_LABEL: Record<SituacaoGrupo, string> = {
  saudavel: "Saudável",
  em_crescimento: "Em crescimento",
  em_atencao: "Em atenção",
  sobrecarregado: "Sobrecarregado",
  em_risco: "Em risco",
};

export interface Grupo {
  id: string;
  nome: string;
  liderId?: string; // usuário líder
  liderNome?: string;
  auxiliarNome?: string;
  anfitriaoNome?: string;
  endereco?: string;
  diaSemana?: string;
  horario?: string;
  supervisorNome?: string;
  situacao: SituacaoGrupo;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Frequência / Reuniões
// ---------------------------------------------------------------------------

export interface RegistroPresenca {
  pessoaId: string;
  presente: boolean;
  motivoAusencia?: string;
  precisaLigacao?: boolean;
  precisaVisita?: boolean;
}

export interface Visitante {
  nome: string;
  telefone?: string;
  observacao?: string;
}

export interface Reuniao {
  id: string;
  grupoId: string;
  data: string; // ISO yyyy-mm-dd
  tema?: string;
  registros: RegistroPresenca[];
  visitantes: Visitante[];
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Relatório Espiritual
// ---------------------------------------------------------------------------

export interface Lutas {
  familiar?: boolean;
  emocional?: boolean;
  financeira?: boolean;
  espiritual?: boolean;
}

export interface Marcos {
  reconciliacao?: boolean;
  batismo?: boolean;
  decisao?: boolean;
  afastamento?: boolean;
}

// Quem pode ver as observações pastorais (campo sensível)
export type Privacidade = "lider_e_supervisor" | "somente_supervisor";

export const PRIVACIDADE_LABEL: Record<Privacidade, string> = {
  lider_e_supervisor: "Líder do grupo e Supervisor",
  somente_supervisor: "Somente Supervisor",
};

export interface RelatorioEspiritual {
  id: string;
  pessoaId: string;
  grupoId: string;
  autorId?: string; // usuário que preencheu
  periodo: string; // yyyy-mm
  data: string; // ISO
  frequentandoGrupo?: boolean;
  indoCultos?: boolean;
  lendoBiblia?: boolean;
  orando?: boolean;
  precisaVisita?: boolean;
  precisaAconselhamento?: boolean;
  lutas: Lutas;
  marcos: Marcos;
  observacoesPastorais?: string;
  privacidade: Privacidade;
  criadoEm: string;
}

// ---------------------------------------------------------------------------
// Banco completo (persistido em localStorage)
// ---------------------------------------------------------------------------

export interface Database {
  usuarios: Usuario[];
  familias: Familia[];
  pessoas: Pessoa[];
  grupos: Grupo[];
  reunioes: Reuniao[];
  relatorios: RelatorioEspiritual[];
}
