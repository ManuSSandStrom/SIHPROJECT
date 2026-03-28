import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { publicNavigation } from "../../constants/navigation";
import { useAuthStore } from "../../store/authStore";

export function PublicShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.55),_transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_55%,#f8fbff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 rounded-[28px] border border-white/80 bg-white/80 px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#1d4ed8_100%)] text-sm font-bold tracking-[0.3em] text-white">
                SC
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Campus ERP
                </p>
                <h1 className="text-lg font-semibold text-slate-950">
                  Smart Classroom Management
                </h1>
              </div>
            </Link>
            <button
              type="button"
              className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700 lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <nav className={`${menuOpen ? "flex" : "hidden"} absolute left-4 right-4 top-[88px] flex-col gap-2 rounded-[24px] border border-sky-100 bg-white p-4 shadow-xl lg:static lg:flex lg:flex-row lg:items-center lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none`}>
              {publicNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium no-underline ${
                      isActive ? "bg-sky-100 text-sky-800" : "text-slate-600 hover:bg-sky-50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="hidden items-center gap-3 lg:flex">
              {user ? (
                <Link
                  to={`/${user.role}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#1d4ed8_100%)] px-5 py-3 text-sm font-semibold text-white no-underline shadow-[0_12px_30px_rgba(29,78,216,0.25)]"
                >
                  <ShieldCheck size={16} />
                  Open Workspace
                </Link>
              ) : (
                <Link
                  to="/student/login"
                  className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 no-underline"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="pb-12 pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
