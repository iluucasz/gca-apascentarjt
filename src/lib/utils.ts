// Utilitários gerais

export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36).slice(-4);
  return `${prefix}${t}${rnd}`;
}

export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function agora(): string {
  return new Date().toISOString();
}

export function periodoAtual(): string {
  return new Date().toISOString().slice(0, 7); // yyyy-mm
}

export function formatarData(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatarPeriodo(periodo?: string): string {
  if (!periodo) return "—";
  const [ano, mes] = periodo.split("-");
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const idx = parseInt(mes, 10) - 1;
  return `${meses[idx] ?? mes}/${ano}`;
}

export function calcularIdade(dataNascimento?: string): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento + "T00:00:00");
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function diasDesde(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

// Link WhatsApp a partir de telefone brasileiro
export function linkWhatsApp(telefone?: string): string | null {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const comDDI = digitos.startsWith("55") ? digitos : "55" + digitos;
  return `https://wa.me/${comDDI}`;
}
