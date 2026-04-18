import { Link } from "wouter";
import { Film, Users, MessageSquare, Briefcase, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = ["Actor", "Director", "Cameraman", "Editor", "Music", "Writer", "Producer"];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <Film className="w-6 h-6" />
          <span className="font-serif italic">CineConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 flex flex-col items-center text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Film className="w-4 h-4" />
            The Film Industry Network
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Where <span className="text-primary italic font-serif">Film Careers</span><br />
            Come to Life
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Connect with actors, directors, editors, and every crew member you need. Post projects, find collaborators, and build your film career — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 gap-2">
                Join CineConnect <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="border-border font-semibold px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Roles strip */}
      <section className="py-10 px-6 border-y border-border bg-card/30">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-5 uppercase tracking-widest font-medium">Built for every role in film</p>
          <div className="flex flex-wrap justify-center gap-3">
            {ROLES.map((role) => (
              <span key={role} className="px-4 py-2 rounded-full border border-primary/30 text-primary/80 text-sm font-medium bg-primary/5">
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything you need to <span className="text-primary">create together</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "Find Talent", desc: "Search professionals by role, skill, and location. Connect with the right people for your project." },
              { icon: MessageSquare, title: "Real-time Chat", desc: "Message anyone directly. Build relationships that lead to collaborations." },
              { icon: Briefcase, title: "Post Projects", desc: "List roles you're hiring for. Receive applications and contact candidates instantly." },
              { icon: Star, title: "Build Reputation", desc: "Get rated after projects. Verified badges and reviews help you stand out." },
            ].map((feature) => (
              <div key={feature.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-border bg-card/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to start your next project?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of film professionals already on CineConnect.</p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 gap-2">
              Create Your Profile <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2 text-foreground font-semibold">
          <Film className="w-4 h-4 text-primary" />
          CineConnect
        </div>
        <p>The professional network for film industry creatives.</p>
      </footer>
    </div>
  );
}
