"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  Database,
  Familia,
  Grupo,
  Pessoa,
  RelatorioEspiritual,
  Reuniao,
  Usuario,
} from "./types";
import { criarSeed } from "./seed";
import { uid, agora } from "./utils";

const DB_KEY = "gca:db:v1";
const SESSION_KEY = "gca:session:v1";

function carregarDb(): Database {
  if (typeof window === "undefined") return criarSeed();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) {
      const seed = criarSeed();
      window.localStorage.setItem(DB_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Database;
  } catch {
    return criarSeed();
  }
}

interface AppContextValue {
  db: Database;
  carregado: boolean;

  // sessão
  usuarioAtual: Usuario | null;
  login: (usuarioId: string, pin: string) => boolean;
  logout: () => void;

  // pessoas
  salvarPessoa: (p: Partial<Pessoa> & { id?: string }) => Pessoa;
  removerPessoa: (id: string) => void;

  // famílias
  salvarFamilia: (f: Partial<Familia> & { id?: string }) => Familia;
  removerFamilia: (id: string) => void;

  // grupos
  salvarGrupo: (g: Partial<Grupo> & { id?: string }) => Grupo;
  removerGrupo: (id: string) => void;

  // reuniões / frequência
  salvarReuniao: (r: Partial<Reuniao> & { id?: string }) => Reuniao;
  removerReuniao: (id: string) => void;

  // relatórios
  salvarRelatorio: (r: Partial<RelatorioEspiritual> & { id?: string }) => RelatorioEspiritual;
  removerRelatorio: (id: string) => void;

  // perigo: restaurar dados de exemplo / limpar
  restaurarExemplo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => criarSeed());
  const [carregado, setCarregado] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  // Carrega na montagem (client)
  useEffect(() => {
    const inicial = carregarDb();
    setDb(inicial);
    const sess = window.localStorage.getItem(SESSION_KEY);
    if (sess && inicial.usuarios.some((u) => u.id === sess)) {
      setUsuarioId(sess);
    }
    setCarregado(true);
  }, []);

  // Persiste sempre que muda
  const persistir = useCallback((novo: Database) => {
    setDb(novo);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DB_KEY, JSON.stringify(novo));
    }
  }, []);

  // ---- Sessão ----
  const login = useCallback(
    (uId: string, pin: string) => {
      const u = db.usuarios.find((x) => x.id === uId);
      if (!u || u.pin !== pin) return false;
      setUsuarioId(u.id);
      window.localStorage.setItem(SESSION_KEY, u.id);
      return true;
    },
    [db.usuarios]
  );

  const logout = useCallback(() => {
    setUsuarioId(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const usuarioAtual = useMemo(
    () => db.usuarios.find((u) => u.id === usuarioId) ?? null,
    [db.usuarios, usuarioId]
  );

  // ---- Helpers genéricos ----
  function upsert<T extends { id: string }>(
    lista: T[],
    item: Partial<T> & { id?: string },
    novoBase: () => T
  ): { lista: T[]; item: T } {
    if (item.id) {
      const idx = lista.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        const atualizado = { ...lista[idx], ...item } as T;
        const copia = [...lista];
        copia[idx] = atualizado;
        return { lista: copia, item: atualizado };
      }
    }
    const novo = { ...novoBase(), ...item, id: item.id ?? novoBase().id } as T;
    return { lista: [...lista, novo], item: novo };
  }

  // ---- Pessoas ----
  const salvarPessoa = useCallback(
    (p: Partial<Pessoa> & { id?: string }) => {
      const res = upsert<Pessoa>(db.pessoas, p, () => ({
        id: uid("p_"),
        nomeCompleto: "",
        situacao: "visitante",
        criadoEm: agora(),
      }));
      persistir({ ...db, pessoas: res.lista });
      return res.item;
    },
    [db, persistir]
  );

  const removerPessoa = useCallback(
    (id: string) => {
      persistir({
        ...db,
        pessoas: db.pessoas.filter((x) => x.id !== id),
        reunioes: db.reunioes.map((r) => ({
          ...r,
          registros: r.registros.filter((reg) => reg.pessoaId !== id),
        })),
        relatorios: db.relatorios.filter((r) => r.pessoaId !== id),
      });
    },
    [db, persistir]
  );

  // ---- Famílias ----
  const salvarFamilia = useCallback(
    (f: Partial<Familia> & { id?: string }) => {
      const res = upsert<Familia>(db.familias, f, () => ({
        id: uid("f_"),
        nome: "",
        criadoEm: agora(),
      }));
      persistir({ ...db, familias: res.lista });
      return res.item;
    },
    [db, persistir]
  );

  const removerFamilia = useCallback(
    (id: string) => {
      persistir({
        ...db,
        familias: db.familias.filter((x) => x.id !== id),
        pessoas: db.pessoas.map((p) =>
          p.familiaId === id ? { ...p, familiaId: undefined, parentesco: undefined } : p
        ),
      });
    },
    [db, persistir]
  );

  // ---- Grupos ----
  const salvarGrupo = useCallback(
    (g: Partial<Grupo> & { id?: string }) => {
      const res = upsert<Grupo>(db.grupos, g, () => ({
        id: uid("g_"),
        nome: "",
        situacao: "saudavel",
        criadoEm: agora(),
      }));
      persistir({ ...db, grupos: res.lista });
      return res.item;
    },
    [db, persistir]
  );

  const removerGrupo = useCallback(
    (id: string) => {
      persistir({
        ...db,
        grupos: db.grupos.filter((x) => x.id !== id),
      });
    },
    [db, persistir]
  );

  // ---- Reuniões ----
  const salvarReuniao = useCallback(
    (r: Partial<Reuniao> & { id?: string }) => {
      const res = upsert<Reuniao>(db.reunioes, r, () => ({
        id: uid("r_"),
        grupoId: "",
        data: agora().slice(0, 10),
        registros: [],
        visitantes: [],
        criadoEm: agora(),
      }));
      persistir({ ...db, reunioes: res.lista });
      return res.item;
    },
    [db, persistir]
  );

  const removerReuniao = useCallback(
    (id: string) => {
      persistir({ ...db, reunioes: db.reunioes.filter((x) => x.id !== id) });
    },
    [db, persistir]
  );

  // ---- Relatórios ----
  const salvarRelatorio = useCallback(
    (r: Partial<RelatorioEspiritual> & { id?: string }) => {
      const res = upsert<RelatorioEspiritual>(db.relatorios, r, () => ({
        id: uid("rel_"),
        pessoaId: "",
        grupoId: "",
        periodo: agora().slice(0, 7),
        data: agora().slice(0, 10),
        lutas: {},
        marcos: {},
        privacidade: "lider_e_supervisor",
        criadoEm: agora(),
      }));
      persistir({ ...db, relatorios: res.lista });
      return res.item;
    },
    [db, persistir]
  );

  const removerRelatorio = useCallback(
    (id: string) => {
      persistir({ ...db, relatorios: db.relatorios.filter((x) => x.id !== id) });
    },
    [db, persistir]
  );

  const restaurarExemplo = useCallback(() => {
    const seed = criarSeed();
    persistir(seed);
  }, [persistir]);

  const value: AppContextValue = {
    db,
    carregado,
    usuarioAtual,
    login,
    logout,
    salvarPessoa,
    removerPessoa,
    salvarFamilia,
    removerFamilia,
    salvarGrupo,
    removerGrupo,
    salvarReuniao,
    removerReuniao,
    salvarRelatorio,
    removerRelatorio,
    restaurarExemplo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
