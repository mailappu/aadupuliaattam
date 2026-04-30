import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, Users, UserPlus, BookOpen, GraduationCap } from "lucide-react";
import { useState } from "react";
import { Tutorial } from "@/components/game/Tutorial";
import { PlayWithAIDialog } from "@/components/game/PlayWithAIDialog";
import { InviteFriendDialog } from "@/components/game/InviteFriendDialog";

const Index = () => {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

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
        <Button
          onClick={() => setAiOpen(true)}
          size="lg"
          className="w-full h-14 text-base bg-teak-gradient shadow-soft justify-start gap-3"
        >
          <Bot className="h-5 w-5" />
          <span>Play with AI</span>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="w-full h-14 text-base bg-card/70 justify-start gap-3 border-2"
        >
          <Link to="/play?mode=pass-and-play">
            <Users className="h-5 w-5 text-accent" />
            <span>Pass &amp; Play</span>
          </Link>
        </Button>

        <Button
          onClick={() => setInviteOpen(true)}
          size="lg"
          variant="outline"
          className="w-full h-auto py-3 text-base bg-card/70 justify-start gap-3 border-2"
        >
          <UserPlus className="h-5 w-5 text-accent" />
          <div className="flex flex-col items-start leading-tight">
            <span>Invite a Friend</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              Share a link to play together
            </span>
          </div>
        </Button>
      </nav>

      <div className="mt-8 flex items-center gap-10 text-sm">
        <button
          onClick={() => setTutorialOpen(true)}
          className="flex flex-col items-center gap-1.5 hover:text-accent transition-colors"
        >
          <GraduationCap className="h-6 w-6 text-accent" />
          <span>Tutorial</span>
        </button>
        <Link
          to="/rules"
          className="flex flex-col items-center gap-1.5 hover:text-accent transition-colors"
        >
          <BookOpen className="h-6 w-6 text-accent" />
          <span>How to Play</span>
        </Link>
      </div>

      <footer className="mt-16 text-xs text-muted-foreground">
        Crafted with ❤️ — a tribute to the bazaars of Tamil Nadu.
      </footer>

      <Tutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
      <PlayWithAIDialog open={aiOpen} onOpenChange={setAiOpen} />
      <InviteFriendDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </main>
  );
};

export default Index;
