"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { PERFIL_LABEL } from "@/lib/types";
import { iniciais } from "@/lib/utils";
import { Botao, Input } from "@/components/ui";

export default function LoginPage() {
  const { db, usuarioAtual, login, carregado } = useApp();
  const router = useRouter();
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (carregado && usuarioAtual) router.replace("/painel");
  }, [carregado, usuarioAtual, router]);

  const usuario = db.usuarios.find((u) => u.id === selecionado);

  function entrar() {
    if (!selecionado) return;
    if (login(selecionado, pin.trim())) {
      router.replace("/painel");
    } else {
      setErro("PIN incorreto. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-700 to-marca-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-600 text-2xl text-white">
            🐑
          </div>
          <h1 className="text-xl font-bold text-gray-800">GCA</h1>
          <p className="text-sm text-gray-500">
            Grupo de Crescimento Apascentar
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Ministério Apascentar Jardim Tropical
          </p>
        </div>

        {!usuario ? (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-600">
              Quem está entrando?
            </p>
            <div className="space-y-2">
              {db.usuarios.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelecionado(u.id);
                    setPin("");
                    setErro("");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-colors hover:border-marca-300 hover:bg-marca-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marca-100 text-sm font-semibold text-marca-700">
                    {iniciais(u.nome)}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      {u.nome}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {PERFIL_LABEL[u.perfil]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                setSelecionado(null);
                setErro("");
              }}
              className="mb-4 text-sm text-marca-600 hover:underline"
            >
              ← Trocar de usuário
            </button>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marca-100 text-base font-semibold text-marca-700">
                {iniciais(usuario.nome)}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {usuario.nome}
                </p>
                <p className="text-xs text-gray-500">
                  {PERFIL_LABEL[usuario.perfil]}
                </p>
              </div>
            </div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              PIN de acesso
            </label>
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErro("");
              }}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              placeholder="••••"
              className="text-center text-lg tracking-widest"
            />
            {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
            <Botao onClick={entrar} className="mt-4 w-full" disabled={!pin}>
              Entrar
            </Botao>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          PINs de demonstração: Supervisor <b>1234</b> · João <b>1111</b> · Ana{" "}
          <b>2222</b>
        </p>
      </div>
    </div>
  );
}
