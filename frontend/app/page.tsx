import Link from 'next/link';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const isLoggedIn = !!cookies().get('auth_token')?.value;

  return (
    <div className="flex flex-col min-h-screen bg-pageBg text-textPrimary selection:bg-primaryAccent selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-borderLight transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="text-xl font-extrabold text-sidebarDark tracking-tight flex items-center gap-1">
              TestMocker
              <span className="w-2.5 h-2.5 rounded-full bg-primaryAccent inline-block"></span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-textSecondary">
            <a href="#features" className="hover:text-primaryAccent transition-colors">Features</a>
            <a href="#about" className="hover:text-primaryAccent transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primaryAccent/10 text-primaryAccent px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
              🚀 Next-Generation Mock Exams
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
              Ace Your Exams with <span className="text-primaryAccent">Real-Time</span> Analytics
            </h1>
            <p className="text-lg sm:text-xl text-textSecondary leading-relaxed mb-8 max-w-2xl mx-auto">
              Simulate high-fidelity JEE & NEET mock exams. Crop complex questions for instant AI guidance, monitor your timing, and analyze performance indicators.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="shadow-lg shadow-primaryAccent/20">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="shadow-lg shadow-primaryAccent/20">Start Practicing Free</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg">Log In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Interactive UI Mockup */}
          <div className="max-w-5xl mx-auto mt-4 rounded-xl border border-borderLight bg-white p-3 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
              <div className="h-6 flex-1 max-w-md mx-auto bg-pageBg rounded border border-borderLight/60 text-[10px] text-textSecondary flex items-center justify-center font-medium">
                testmocker.ai
              </div>
            </div>
            <div className="overflow-hidden rounded-lg bg-slate-950 aspect-[4/3] relative border border-borderLight/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/dashboard_mockup_real.png"
                alt="TestMocker Dashboard Mockup"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Background Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primaryAccent/5 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white border-t border-b border-borderLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Engineered for Ultimate Success
            </h2>
            <p className="mt-4 text-lg text-textSecondary">
              Everything you need to master your competitive exams, packaged in a smooth and intuitive layout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-pageBg rounded-lg border border-borderLight/60 flex flex-col transition-all hover:shadow-md">
              <span className="text-3xl mb-4">⏱️</span>
              <h3 className="text-lg font-bold mb-2">Simulated Exams</h3>
              <p className="text-textSecondary text-sm leading-relaxed">
                Take tests in a simulated environment matching real-world JEE/NEET patterns with automated timing.
              </p>
            </div>

            <div className="p-6 bg-pageBg rounded-lg border border-borderLight/60 flex flex-col transition-all hover:shadow-md">
              <span className="text-3xl mb-4">📊</span>
              <h3 className="text-lg font-bold mb-2">Speed Analytics</h3>
              <p className="text-textSecondary text-sm leading-relaxed">
                Track how much time you spend on each question. Understand pacing weaknesses and optimize performance.
              </p>
            </div>

            <div className="p-6 bg-pageBg rounded-lg border border-borderLight/60 flex flex-col transition-all hover:shadow-md">
              <span className="text-3xl mb-4">✂️</span>
              <h3 className="text-lg font-bold mb-2">Region Selection</h3>
              <p className="text-textSecondary text-sm leading-relaxed">
                Stuck on a diagram or mathematical formula? Crop any region on the paper with our canvas selector tool.
              </p>
            </div>

            <div className="p-6 bg-pageBg rounded-lg border border-borderLight/60 flex flex-col transition-all hover:shadow-md">
              <span className="text-3xl mb-4">💡</span>
              <h3 className="text-lg font-bold mb-2">Interactive AI Hints</h3>
              <p className="text-textSecondary text-sm leading-relaxed">
                Get step-by-step guidance rather than basic solutions, fostering deep cognitive understanding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6">About TestMocker</h2>
          <p className="text-lg text-textSecondary leading-relaxed max-w-3xl mx-auto mb-10">
            We believe that preparation shouldn\'t be about endless memorization. TestMocker empowers aspirants by converting static mock exams into dynamic learning tools. By identifying exact time sinks and offering granular AI hints, we help students optimize their score potential.
          </p>
          <div className="inline-flex items-center gap-6 p-4 rounded bg-white border border-borderLight mx-auto justify-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-primaryAccent">100%</span>
              <span className="text-[10px] text-textSecondary uppercase tracking-wider font-semibold">Simulated Exam Layout</span>
            </div>
            <div className="w-px h-8 bg-borderLight"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-success">AI-Powered</span>
              <span className="text-[10px] text-textSecondary uppercase tracking-wider font-semibold">Diagnostic Hints</span>
            </div>
            <div className="w-px h-8 bg-borderLight"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-warning">Granular</span>
              <span className="text-[10px] text-textSecondary uppercase tracking-wider font-semibold">Time Audits</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-sidebarDark text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-extrabold sm:text-4xl mb-4">Ready to Accelerate Your Prep?</h2>
          <p className="text-sidebarText text-lg mb-8 max-w-2xl mx-auto">
            Create a free account in seconds and gain access to our custom simulated mock tests, interactive canvas hints, and detailed diagnostics.
          </p>
          <div className="flex justify-center">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="bg-primaryAccent hover:bg-accentHover shadow-xl shadow-primaryAccent/30">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button variant="primary" size="lg" className="bg-primaryAccent hover:bg-accentHover shadow-xl shadow-primaryAccent/30">Create Free Account</Button>
              </Link>
            )}
          </div>
        </div>
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-borderLight py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-base font-extrabold text-sidebarDark flex items-center gap-1 hover:opacity-90 transition-opacity">
              TestMocker
              <span className="w-2 h-2 rounded-full bg-primaryAccent"></span>
            </Link>
            <span className="text-xs text-textSecondary">| © {new Date().getFullYear()} TestMocker. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-textSecondary font-semibold">
            <a href="#" className="hover:text-primaryAccent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primaryAccent transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primaryAccent transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
