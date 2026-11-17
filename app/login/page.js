"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { normPhone } from "@/lib/utils";
import { inputCls, btnCls } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const email = id.includes("@") ? id.trim() : `${normPhone(id)}@tenant.app`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const { data: p } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    router.replace(p?.role === "admin" ? "/admin" : "/portal");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8"
      >
        <h1 className="text-xl font-bold text-emerald-700">Rental Manager</h1>
        <div>
          <label className="mb-1 block text-sm text-slate-600">
            Phone number (tenants) or email (landlord)
          </label>
          <input
            className={inputCls}
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Password</label>
          <input
            type="password"
            className={inputCls}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className={`${btnCls} w-full`} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
