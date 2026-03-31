import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import bookService from "../../services/book.service";
import adminService from "../../services/admin.service";
import type { CustomerInvoice } from "../../types/customer.types";

const Dashboard = () => {
  const [totalBook, setTotalBook] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");
        const [bookCountRes, customerCountRes, invoiceData] = await Promise.all([
          bookService.getBookCount(),
          adminService.getCustomerCount(),
          adminService.getInvoices(),
        ]);

        setTotalBook(bookCountRes.total_books);
        setTotalCustomers(customerCountRes.total_customers);
        setInvoices(invoiceData);
      } catch (loadError: any) {
        console.error(loadError);
        setError(loadError?.response?.data?.message || "Unable to load dashboard data.");
      }
    };

    void loadDashboard();
  }, []);

  const handleStatusChange = async (invoiceId: string, status: CustomerInvoice["status"]) => {
    try {
      setError("");
      setSuccess("");
      const updatedInvoice = await adminService.updateInvoiceStatus(invoiceId, status);
      setInvoices((prev) => prev.map((invoice) => (invoice.id === invoiceId ? updatedInvoice : invoice)));
      setSuccess(`Invoice ${invoiceId} updated to ${status}.`);
    } catch (updateError: any) {
      setError(updateError?.response?.data?.message || "Unable to update invoice status.");
    }
  };

  const dashboardMetrics = useMemo(() => {
    const totalRevenue = invoices
      .filter((invoice) => ["paid", "processing", "shipped"].includes(invoice.status))
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);

    const unfulfilledOrders = invoices.filter((invoice) => ["pending", "processing"].includes(invoice.status)).length;
    const deliveredOrders = invoices.filter((invoice) => invoice.status === "shipped").length;

    return {
      totalRevenue,
      unfulfilledOrders,
      deliveredOrders,
    };
  }, [invoices]);

  const stats = [
    {
      label: "Total Books",
      value: totalBook.toLocaleString(),
      change: "Live",
      isPositive: true,
      icon: BookOpen,
      color: "text-orange-600",
      bg: "bg-orange-50",
      trend: [40, 70, 45, 90, 65, 80, 95],
    },
    {
      label: "Active Users",
      value: totalCustomers.toLocaleString(),
      change: "Live",
      isPositive: true,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: [30, 45, 60, 50, 80, 75, 100],
    },
    {
      label: "Total Revenue",
      value: `$${dashboardMetrics.totalRevenue.toFixed(2)}`,
      change: `${invoices.length} orders`,
      isPositive: true,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: [50, 40, 70, 60, 90, 85, 110],
    },
    {
      label: "Unfulfilled Orders",
      value: dashboardMetrics.unfulfilledOrders.toString(),
      change: `${dashboardMetrics.deliveredOrders} shipped`,
      isPositive: dashboardMetrics.unfulfilledOrders === 0,
      icon: TrendingUp,
      color: "text-rose-600",
      bg: "bg-rose-50",
      trend: [90, 80, 70, 75, 60, 55, 40],
    },
  ];

  const recentOrders = invoices.slice(0, 6);

  const topCategories = Object.values(
    invoices
      .flatMap((invoice) => invoice.items)
      .reduce<Record<string, { label: string; val: number }>>((acc, item) => {
        const label = item.author_name || "Unknown";
        acc[label] = acc[label] || { label, val: 0 };
        acc[label].val += item.quantity;
        return acc;
      }, {}),
  )
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold mb-2">Overview</p>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Track store performance and review recent activity.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="group bg-white/85 rounded-3xl p-6 border border-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}>
                  {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>

              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stat.value}</h3>

              <div className="mt-6 flex items-end gap-1 h-8">
                {stat.trend.map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-500 ${stat.color.replace("text", "bg")}`}
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/90 rounded-3xl border border-white/80 shadow-[0_14px_34px_rgba(15,23,42,0.07)] overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live from backend invoices</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{order.id}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">
                        {order.items.map((item) => item.title).join(", ")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{order.customerName}</p>
                      <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`
                          inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter
                          ${order.status === "shipped" ? "bg-emerald-100 text-emerald-700" :
                            order.status === "processing" ? "bg-blue-100 text-blue-700" :
                            order.status === "paid" ? "bg-cyan-100 text-cyan-700" :
                            order.status === "cancelled" ? "bg-rose-100 text-rose-700" :
                            "bg-orange-100 text-orange-700"}
                        `}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-extrabold text-slate-900">${Number(order.total).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => void handleStatusChange(order.id, e.target.value as CustomerInvoice["status"])}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                        >
                          <option value="pending">pending</option>
                          <option value="paid">paid</option>
                          <option value="processing">processing</option>
                          <option value="shipped">shipped</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="text-xl font-bold mb-2 relative z-10">Revenue Summary</h4>
            <p className="text-slate-300 text-sm mb-6 relative z-10 leading-relaxed">
              {invoices.length} invoices processed through the backend.
            </p>
            <div className="w-full py-4 bg-white text-slate-900 font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-black/10">
              ${dashboardMetrics.totalRevenue.toFixed(2)} total revenue
            </div>
          </div>

          <div className="bg-white/90 rounded-3xl p-6 border border-white/80 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <h4 className="text-sm font-extrabold text-slate-900 mb-6 uppercase tracking-wider">Top Performing Authors</h4>
            <div className="space-y-6">
              {topCategories.map((cat) => (
                <div key={cat.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{cat.label}</span>
                    <span className="text-slate-400">{cat.val} sold</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(cat.val * 10, 100)}%` }} />
                  </div>
                </div>
              ))}
              {topCategories.length === 0 && <p className="text-sm text-slate-500">No sales data yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
