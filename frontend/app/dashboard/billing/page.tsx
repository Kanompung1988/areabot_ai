"use client";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Building2,
  Loader2,
  ExternalLink,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";
import { billingApi } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  message_limit: number;
  bot_limit: number;
}

interface Subscription {
  plan: string;
  status: string;
  message_count: number;
  message_limit: number;
  current_period_end?: string;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([billingApi.plans(), billingApi.subscription()])
      .then(([p, s]) => {
        setPlans(p.data.plans);
        setSub(s.data);
      })
      .catch(() => toast.error("โหลดข้อมูล Billing ไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    setUpgrading(planId);
    try {
      const res = await billingApi.checkout(planId as "pro" | "business");
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || "เกิดข้อผิดพลาด";
      if (detail.includes("not configured")) {
        toast.error("ระบบ Billing ยังไม่พร้อมใช้งาน กรุณาติดต่อ Admin");
      } else {
        toast.error(detail);
      }
    } finally {
      setUpgrading(null);
    }
  };

  const PLAN_ICONS: Record<string, React.ReactNode> = {
    free: <Zap size={20} className="text-emerald-500" />,
    pro: <Crown size={20} className="text-violet-500" />,
    business: <Building2 size={20} className="text-amber-500" />,
  };

  const PLAN_COLORS: Record<string, string> = {
    free: "border-emerald-200 hover:border-emerald-300",
    pro: "border-violet-200 hover:border-violet-300",
    business: "border-amber-200 hover:border-amber-300",
  };

  const PLAN_BADGE: Record<string, string> = {
    free: "bg-emerald-100 text-emerald-700",
    pro: "bg-violet-100 text-violet-700",
    business: "bg-amber-100 text-amber-700",
  };

  const usagePct = sub
    ? Math.min(
        100,
        Math.round((sub.message_count / (sub.message_limit || 1)) * 100),
      )
    : 0;

  if (loading)
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
          Billing &amp; Subscription
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          จัดการแผนบริการและการใช้งาน
        </p>
      </div>

      {/* Current Usage */}
      {sub && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-gray-600" />
              <span className="font-semibold text-gray-900">
                การใช้งานปัจจุบัน
              </span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${PLAN_BADGE[sub.plan] || PLAN_BADGE.free}`}
            >
              {sub.plan}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">ข้อความที่ใช้แล้ว</span>
              <span className="text-gray-900 font-medium">
                {sub.message_count.toLocaleString()} /{" "}
                {sub.message_limit.toLocaleString()} messages
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePct >= 90
                    ? "bg-red-500"
                    : usagePct >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{usagePct}% ใช้ไปแล้ว</p>
          </div>

          {sub.current_period_end && (
            <p className="text-xs text-gray-500">
              รอบบิลสิ้นสุด:{" "}
              <span className="text-gray-900">
                {new Date(sub.current_period_end).toLocaleDateString("th-TH")}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrentPlan = sub?.plan === plan.id;
          const isFree = plan.id === "free";

          return (
            <div
              key={plan.id}
              className={`card p-5 border flex flex-col gap-4 transition-colors ${PLAN_COLORS[plan.id]} ${
                isCurrentPlan ? "ring-2 ring-emerald-200" : ""
              }`}
            >
              {/* Plan Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {PLAN_ICONS[plan.id]}
                  <span className="font-bold text-gray-900 text-lg">
                    {plan.name}
                  </span>
                </div>
                {isCurrentPlan && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    แผนปัจจุบัน
                  </span>
                )}
              </div>

              {/* Price */}
              <div>
                {plan.price === 0 ? (
                  <span className="text-3xl font-black text-gray-900">ฟรี</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-gray-900">
                      ฿{plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500 text-sm mb-1">/เดือน</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      size={14}
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan || isFree || upgrading !== null}
                className={`btn w-full text-sm flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? "btn-ghost opacity-60 cursor-default"
                    : isFree
                      ? "btn-ghost opacity-50 cursor-default"
                      : plan.id === "pro"
                        ? "bg-violet-600 hover:bg-violet-500 text-white border-0"
                        : "bg-amber-500 hover:bg-amber-400 text-black border-0"
                }`}
              >
                {upgrading === plan.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ExternalLink size={14} />
                )}
                {isCurrentPlan
                  ? "แผนปัจจุบัน"
                  : isFree
                    ? "แผนเริ่มต้น"
                    : `อัปเกรดเป็น ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        การชำระเงินผ่าน Stripe — SSL encrypted · ยกเลิกได้ตลอดเวลา
      </p>
    </div>
  );
}
