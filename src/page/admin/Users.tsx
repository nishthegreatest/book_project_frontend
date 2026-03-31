import { Users as UsersIcon, Shield, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import adminService from "../../services/admin.service";
import authService from "../../services/auth.service";
import type { CustomerInvoice } from "../../types/customer.types";

const Users = () => {
  const [customerCount, setCustomerCount] = useState(0);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [adminName, setAdminName] = useState("Admin");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUserInsights = async () => {
      try {
        setError("");
        const [countResponse, invoiceData, currentUser] = await Promise.all([
          adminService.getCustomerCount(),
          adminService.getInvoices(),
          authService.getCurrentUser(),
        ]);

        setCustomerCount(countResponse.total_customers);
        setInvoices(invoiceData);
        setAdminName(currentUser.name || currentUser.email);
      } catch (loadError: any) {
        setError(loadError?.response?.data?.message || "Unable to load user insights.");
      }
    };

    void loadUserInsights();
  }, []);

  const metrics = useMemo(() => {
    const uniqueCustomers = new Set(invoices.map((invoice) => invoice.customerEmail)).size;
    const newThisWeek = new Set(
      invoices
        .filter((invoice) => Date.now() - new Date(invoice.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000)
        .map((invoice) => invoice.customerEmail),
    ).size;

    return [
      { label: "Total Users", value: customerCount.toLocaleString(), icon: UsersIcon, color: "text-orange-600 bg-orange-50" },
      { label: "Admins", value: "1", icon: Shield, color: "text-blue-600 bg-blue-50" },
      { label: "Active Customers", value: uniqueCustomers.toLocaleString(), icon: UserRound, color: "text-emerald-600 bg-emerald-50" },
      { label: "New This Week", value: newThisWeek.toLocaleString(), icon: UserRound, color: "text-violet-600 bg-violet-50" },
    ];
  }, [customerCount, invoices]);

  const recentActivity = useMemo(() => {
    const activities = invoices.slice(0, 6).map((invoice) => ({
      id: invoice.id,
      text: `${invoice.customerEmail} placed ${invoice.id} with status ${invoice.status}`,
      createdAt: invoice.createdAt,
    }));

    activities.unshift({
      id: "admin-session",
      text: `${adminName} is currently authenticated as admin`,
      createdAt: new Date().toISOString(),
    });

    return activities.slice(0, 6);
  }, [adminName, invoices]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold mb-2">Community</p>
          <h1 className="text-3xl font-bold text-slate-900">Users Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor customer activity and role distribution.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white/90 border border-white/80 rounded-3xl p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
              <div className={`h-10 w-10 rounded-xl grid place-items-center ${item.color}`}>
                <Icon size={18} />
              </div>
              <p className="text-sm text-slate-500 mt-4">{item.label}</p>
              <h3 className="text-2xl font-extrabold text-slate-900">{item.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="bg-white/90 rounded-3xl border border-white/80 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
        <h2 className="font-bold text-slate-900 mb-4">Recent User Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
              <p>{item.text}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
              No user activity yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
