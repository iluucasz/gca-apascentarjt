"use client";

import { ReactNode, useEffect } from "react";
import { classNames } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  acao,
}: {
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-gray-800">{children}</h2>
      {acao}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Botão
// ---------------------------------------------------------------------------
type Variante = "primario" | "secundario" | "perigo" | "fantasma";

export function Botao({
  children,
  onClick,
  variante = "primario",
  type = "button",
  className,
  disabled,
  titulo,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: Variante;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  titulo?: string;
}) {
  const estilos: Record<Variante, string> = {
    primario: "bg-marca-600 text-white hover:bg-marca-700",
    secundario: "bg-marca-50 text-marca-700 hover:bg-marca-100 border border-marca-200",
    perigo: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    fantasma: "text-gray-600 hover:bg-gray-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      className={classNames(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        estilos[variante],
        className
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
type CorBadge =
  | "verde"
  | "azul"
  | "amarelo"
  | "laranja"
  | "vermelho"
  | "cinza"
  | "roxo";

export function Badge({
  children,
  cor = "cinza",
}: {
  children: ReactNode;
  cor?: CorBadge;
}) {
  const cores: Record<CorBadge, string> = {
    verde: "bg-green-100 text-green-800",
    azul: "bg-blue-100 text-blue-800",
    amarelo: "bg-yellow-100 text-yellow-800",
    laranja: "bg-orange-100 text-orange-800",
    vermelho: "bg-red-100 text-red-800",
    cinza: "bg-gray-100 text-gray-700",
    roxo: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cores[cor]
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export function Modal({
  aberto,
  onFechar,
  titulo,
  children,
  largura = "max-w-2xl",
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div
        className={classNames(
          "w-full rounded-2xl bg-white shadow-xl",
          largura
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-800">{titulo}</h3>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campos de formulário
// ---------------------------------------------------------------------------
export function Campo({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={classNames("block", className)}>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={classNames(inputBase, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(inputBase, "min-h-[80px]", props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={classNames(inputBase, "bg-white", props.className)}>
      {props.children}
    </select>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-marca-600 focus:ring-marca-500"
      />
      {label}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Estado vazio
// ---------------------------------------------------------------------------
export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-gray-700">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-gray-500">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Métrica (cartão de número)
// ---------------------------------------------------------------------------
export function Metrica({
  rotulo,
  valor,
  sub,
  cor = "marca",
}: {
  rotulo: string;
  valor: ReactNode;
  sub?: string;
  cor?: "marca" | "azul" | "amarelo" | "vermelho" | "verde";
}) {
  const cores: Record<string, string> = {
    marca: "text-marca-700",
    azul: "text-blue-700",
    amarelo: "text-yellow-700",
    vermelho: "text-red-700",
    verde: "text-green-700",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {rotulo}
      </p>
      <p className={classNames("mt-1 text-2xl font-bold", cores[cor])}>{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </Card>
  );
}
