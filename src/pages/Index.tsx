import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, Users, BookOpen, GraduationCap } from "lucide-react";
import { useState } from "react";
import { Tutorial } from "@/components/game/Tutorial";

const Index = () => {
  const [tutorialOpen, setTutorialOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <header className="text-center max-w-xl animate-fade-in">
        <h1 className="font-display text-5xl sm:text-6xl text-saffron font-bold tracking-tight">
          Aadu Puli Attam
        </h1>
        <p className="mt-3 text-muted-foreground text-base sm:text-lg">
          The ancient game of tigers &amp; goats
        </p>
      </header>

      <div
        className="my-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-card shadow-elev flex items-center justify-center animate-float-y paper-texture"
        aria-hidden
      >
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-teak-gradient flex items-center justify-center text-5xl sm:text-6xl shadow-soft">
          🐅
        </div>
      </div>

      <nav className="w-full max-w-md space-y-3 animate-scale-in" aria-label="Game modes">
        <Button asChild size="lg" className="w-full h-14 text-base bg-teak-gradient shadow-soft justify-start gap-3">
          <Link to="/play?mode=vs-ai-tigers">
            <Bot className="h-5 w-5" /> Play vs AI <span className="text-xs opacity-80 ml-auto">(you are 🐐 goats)</span>
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full h-14 text-base bg-card/70 justify-start gap-3 border-2">
          <Link to="/play?mode=vs-ai-goats">
            <Bot className="h-5 w-5 text-accent" /> Play vs AI <span className="text-xs opacity-70 ml-auto">(you are 🐅 tigers)</span>
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full h-14 text-base bg-card/70 justify-start gap-3 border-2">
          <Link to="/play?mode=pass-and-play">
            <Users className="h-5 w-5 text-accent" /> Pass &amp; Play
            <span className="text-xs opacity-70 ml-auto">2 players, 1 device</span>
          </Link>
        </Button>
      </nav>

      <div className="mt-8 flex items-center gap-8 text-sm">
        <button
          onClick={() => setTutorialOpen(true)}
          className="flex flex-col items-center gap-1.5 hover:text-accent transition-colors"
        >
          <GraduationCap className="h-6 w-6 text-accent" />
          <span>Tutorial</span>
        </button>
        <Link to="/rules" className="flex flex-col items-center gap-1.5 hover:text-accent transition-colors">
          <BookOpen className="h-6 w-6 text-accent" />
          <span>How to Play</span>
        </Link>
      </div>

      <footer className="mt-16 text-xs text-muted-foreground">
        Crafted with ❤️ — a tribute to the bazaars of Tamil Nadu.
      </footer>

      <Tutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </main>
  );
};

export default Index;
