/**
 * Historial del usuario autenticado.
 *
 * Server component: leemos la sesión con `getServerSession`, y si no hay
 * sesión devolvemos la redirección (aunque el proxy ya lo hace, esta es
 * defensa redundante por si el matcher cambia). Renderizamos una tabla
 * simple con los últimos 50 downloads del usuario.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
  spotify: "Spotify",
  vimeo: "Vimeo",
  twitter: "X",
  tiktok: "TikTok",
  generic: "Audio",
  unknown: "?",
};

const FORMAT_LABELS: Record<string, string> = {
  "mp3-320": "MP3 320",
  best: "Mejor disponible",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?from=/history");
  }

  const downloads = await prisma.download.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="flex flex-1 w-full items-start justify-center px-6 py-12">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Historial</h1>
            <p className="text-sm text-foreground/60 mt-1">
              {downloads.length === 0
                ? "Sin descargas todavía."
                : `Últimas ${downloads.length} descargas.`}
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-fuchsia-400 hover:text-fuchsia-300 underline-offset-4 hover:underline"
          >
            ← Volver
          </Link>
        </header>

        {downloads.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-foreground/70">
              Pega un enlace en la página principal para empezar.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-foreground/70 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-left px-4 py-3">Plataforma</th>
                  <th className="text-left px-4 py-3">Formato</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 max-w-[260px] truncate">
                      <div className="font-medium">{d.title}</div>
                      {d.artist && (
                        <div className="text-xs text-foreground/50">{d.artist}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {PLATFORM_LABELS[d.platform ?? "unknown"] ?? d.platform}
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {FORMAT_LABELS[d.format] ?? d.format}
                    </td>
                    <td className="px-4 py-3">
                      {d.status === "completed" ? (
                        <span className="text-emerald-400">✓ listo</span>
                      ) : (
                        <span className="text-rose-400" title={d.errorCode ?? ""}>
                          ✗ {d.errorCode ?? "error"}
                        </span>
                      )}
                      {d.bytes !== null && d.bytes !== undefined && (
                        <span className="text-foreground/40 text-xs ml-2">
                          {(d.bytes / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/60 text-xs">
                      {formatDate(d.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}