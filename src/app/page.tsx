import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen gradient-warm">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Teddy Connect" width={50} height={50} className="dark:drop-shadow-[0_0_12px_rgba(99,102,241,0.7)]" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 text-green-600 dark:text-indigo-400 font-medium hover:text-green-700 dark:hover:text-indigo-300">
            Log In
          </Link>
          <Link href="/register" className="btn-primary">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left side - Text content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-gray-100 leading-tight mb-6">
              Staying Connected Through the
              <span style={{ color: 'var(--brand-red)', fontFamily: 'var(--font-pacifico)' }}> Comfort of Tedd<span className="teddy-heart">y</span></span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
              Teddy Connect helps kids with communication challenges find friends
              who understand them. Through fun activities, shared interests, and
              safe conversations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Get Started - It&apos;s Free
              </Link>
              <Link href="#how-it-works" className="text-lg px-8 py-4 font-semibold text-white rounded-full" style={{ background: 'linear-gradient(135deg, var(--brand-red) 0%, var(--brand-red-dark) 100%)' }}>
                Learn More
              </Link>
            </div>
            <p className="mt-6 text-gray-500 text-sm">
              Parent-supervised. Safe messaging. No personal info shared.
            </p>
          </div>

          {/* Right side - Logo */}
          <div className="flex-1 relative">
            <div className="relative w-[500px] h-[500px] mx-auto flex items-center justify-center">
              <Image src="/logo.png" alt="Teddy Connect" width={600} height={600} className="dark:drop-shadow-[0_0_60px_rgba(99,102,241,0.5)]" quality={100} unoptimized />
            </div>
          </div>
        </div>
      </main>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
            How Teddy Connect Works
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Making friends has never been safer or more fun
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👨‍👩‍👧</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Parents Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Parents create an account and set up profiles for their children
                with interests and preferences.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Find Matches</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We suggest friends based on shared interests like games, art,
                animals, or music. Parents approve all connections.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Connect Safely</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Kids chat using pre-approved messages, emojis, and stickers.
                No pressure, just fun ways to communicate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 gradient-warm">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-gray-100 mb-12">
            Built for Every Child
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card flex gap-4">
              <div className="text-4xl">🎨</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Visual Communication</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Express yourself with pictures, stickers, and emojis.
                  Words are optional here.
                </p>
              </div>
            </div>

            <div className="card flex gap-4">
              <div className="text-4xl">🎮</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Fun Activities</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Structured games and prompts make starting conversations easy and stress-free.
                </p>
              </div>
            </div>

            <div className="card flex gap-4">
              <div className="text-4xl">🔒</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Parent Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Full visibility into your child&apos;s activity. Approve friends,
                  review messages, and set preferences.
                </p>
              </div>
            </div>

            <div className="card flex gap-4">
              <div className="text-4xl">🌟</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Age-Appropriate</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Separate experiences for different age groups: 5-7, 8-10, and 11-13.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Ready to Help Your Child Make Friends?
          </h2>
          <p className="text-gray-600 mb-8">
            Join Teddy Connect today. It&apos;s free, safe, and built with love for families like yours.
          </p>
          <Link href="/register" className="btn-primary text-lg px-10 py-4">
            Create Your Family Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-nunito)', textShadow: '0 2px 8px rgba(0,0,0,0.4)', letterSpacing: '0.02em' }}>
                Teddy Connect
              </span>
            </div>
            <div className="flex gap-6 text-gray-400">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2026 Teddy Connect. Made with love for kids who communicate differently.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
