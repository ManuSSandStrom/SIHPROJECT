import { Bell, LogOut, Menu, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminNavigation, facultyNavigation, studentNavigation } from "../../constants/navigation";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../api/client";

export function DashboardShell() {
  const [open, setOpen] = useState(false);
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = useMemo(() => {
    if (user?.role === "admin") return adminNavigation;
    if (user?.role === "faculty") return facultyNavigation;
    return studentNavigation;
  }, [user?.role]);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f9ff_0%,#eef4ff_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col gap-6 border-r border-sky-100 bg-[linear-gradient(180deg,#0b1b39_0%,#17336b_100%)] p-6 text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0`}>
          <div>
            <Link to="/" className="no-underline">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">Smart Classroom</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Unified Campus Workspace</h2>
            </Link>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Signed In</p>
            <h3 className="mt-2 text-lg font-semibold">{user?.fullName}</h3>
            <p className="mt-1 text-sm text-sky-100">{user?.role}</p>
          </div>
          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium no-underline ${
                    isActive || location.pathname === item.to
                      ? "bg-white text-slate-950"
                      : "text-sky-100 hover:bg-white/10"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-sky-100 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700 lg:hidden"
                  onClick={() => setOpen((value) => !value)}
                >
                  {open ? <X size={18} /> : <Menu size={18} />}
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                    Campus Operations
                  </p>
                  <h1 className="text-xl font-semibold text-slate-950">Smart Classroom Management</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/${user?.role}/notifications`} className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-700">
                  <Bell size={18} />
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
