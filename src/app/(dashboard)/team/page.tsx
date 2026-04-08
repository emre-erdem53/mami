import { UserPlus, UsersRound } from "lucide-react";
import { addTeamMember, toggleTeamMember } from "@/app/actions/agency";
import { readState } from "@/lib/store";
import { PageHeader } from "@/components/ui/page-header";
import { btnPrimary, btnSecondary, card, input, labelSm } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { pageWrap } from "@/components/ui/page-layout";

export default async function TeamPage() {
  const s = await readState();
  const members = [...s.teamMembers].sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );

  return (
    <div className={cn(pageWrap, "space-y-8")}>
      <PageHeader
        title="Ekip"
        description="Görev atamalarında kullanılacak isimler. Pasif üyeler gri listelenir; atama listelerinde yalnızca aktif üyeler çıkar."
      />

      <form
        action={addTeamMember}
        className={cn(card, "flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-end")}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[200px]">
          <span className={labelSm}>İsim</span>
          <input name="name" required className={input} placeholder="Ad Soyad" />
        </label>
        <label className="flex w-full flex-col gap-1.5 sm:w-56">
          <span className={labelSm}>Rol</span>
          <input
            name="role"
            className={input}
            placeholder="Tasarım, video…"
          />
        </label>
        <button type="submit" className={cn(btnPrimary, "h-10 w-full gap-2 sm:w-auto")}>
          <UserPlus className="size-4" strokeWidth={1.75} />
          Ekle
        </button>
      </form>

      <ul className="space-y-3">
        {members.map((m) => (
          <li key={m.id}>
            <div
              className={cn(
                card,
                "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
                    m.active
                      ? "bg-violet-500/10 text-violet-400 ring-violet-500/20"
                      : "bg-zinc-800 text-zinc-600 ring-white/5"
                  )}
                >
                  <UsersRound className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p
                    className={cn(
                      "font-semibold",
                      m.active ? "text-zinc-100" : "text-zinc-600 line-through"
                    )}
                  >
                    {m.name}
                  </p>
                  {m.role ? (
                    <p className="text-sm text-zinc-500">{m.role}</p>
                  ) : null}
                </div>
              </div>
              <form action={toggleTeamMember.bind(null, m.id)}>
                <button type="submit" className={btnSecondary + " h-9 text-xs"}>
                  {m.active ? "Pasifleştir" : "Aktifleştir"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
