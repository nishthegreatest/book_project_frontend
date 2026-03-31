import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, Save, UserRound } from "lucide-react";
import { Navigate } from "react-router-dom";
import customerService from "../../services/customer.service";
import { getAccessToken } from "../../lib/session";
import type { CustomerInvoice, CustomerProfile } from "../../types/customer.types";

const Profile = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const [profileData, invoiceData] = await Promise.all([
          customerService.getCurrentProfile(),
          customerService.getInvoices(),
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(profileData);
        setInvoices(invoiceData);
        setForm({
          first_name: profileData.first_name ?? "",
          last_name: profileData.last_name ?? "",
          email: profileData.email ?? "",
          phone: profileData.phone ?? "",
          address: profileData.address ?? "",
        });
      } catch (error: any) {
        if (isMounted) {
          setErrorMessage(error?.response?.data?.message || "Unable to load profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="section-wrap py-10">
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await customerService.updateCurrentProfile(profile.id, form);
      const refreshedProfile = await customerService.getCurrentProfile();
      setProfile(refreshedProfile);
      setSuccessMessage("Profile updated successfully.");
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Failed to update profile.");
    }
  };

  return (
    <div className="w-full">
      <main className="section-wrap py-6 lg:py-10 space-y-6">
        <section className="rounded-[2.25rem] border border-white/70 bg-gradient-to-br from-white/95 via-orange-50/45 to-amber-100/40 p-6 md:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-700 font-bold">Customer Profile</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">Manage Your Account</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Keep your personal details up to date so checkout and invoice records stay accurate.
          </p>
        </section>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-6">
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 text-white grid place-items-center shadow-lg shadow-orange-200">
                <UserRound className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-sm text-slate-500">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold">Invoices</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{invoices.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold">Phone</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{profile.phone || "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold">Address</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{profile.address || "Not set"}</p>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">First Name</label>
                <div className="relative mt-2">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Last Name</label>
                <div className="relative mt-2">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Email</label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Phone</label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Address</label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="min-h-28 w-full rounded-xl border border-slate-200 pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Profile;
