import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Shield,
  Smartphone,
  ArrowRight,
  Users,
  Calendar,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Event Management",
    description: "Track weddings, housewarmings, festivals & more",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Users,
    title: "Family Groups",
    description: "Collaborate with family members seamlessly",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: ArrowLeftRight,
    title: "Smart Returns",
    description: "Know exactly who you owe and how much",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visualize your contribution history",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Optimized for low-end phones",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data stays within your family",
    color: "from-violet-500 to-purple-600",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 pt-12 pb-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Moi Ledger
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Now tracking contributions digitally
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Never Forget a{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Moi
            </span>{" "}
            Again
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Replace your old notebooks with a modern, secure system to track
            cash contributions at weddings, festivals, and village functions.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 px-8 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/25"
              >
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <LayoutDashboard className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">
            Everything You Need
          </h2>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            A complete solution designed for village families to manage
            contributions effortlessly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 p-10 lg:p-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Go Digital?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join families who trust Moi Ledger to keep their contribution records safe and organized.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="h-14 px-10 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            >
              Create Your Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <span className="text-sm font-semibold text-slate-400">
              Moi Ledger
            </span>
          </div>
          <p className="text-xs text-slate-600">
            © 2026 Moi Ledger. Made with ❤️ for village families.
          </p>
        </div>
      </footer>
    </div>
  );
}
