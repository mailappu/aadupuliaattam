import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const Rules = () => (
  <main className="min-h-screen px-6 py-10">
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 mb-6">
        <Link to="/"><ArrowLeft className="h-4 w-4" /> Home</Link>
      </Button>
      <h1 className="font-display text-4xl text-saffron mb-2">How to Play</h1>
      <p className="text-muted-foreground mb-8">
        Aadu Puli Attam — literally "goat tiger game" — is an asymmetric strategy game
        played for centuries across South India, often etched onto temple steps.
      </p>

      <div className="space-y-4">
        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-2xl mb-2">The Board</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            23 intersections connected by lines: a small triangle on top resting on a
            grid of points. Pieces only move along the printed lines.
          </p>
        </Card>
        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-2xl mb-2">Setup &amp; Goal</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Three tigers start on the apex and the two triangle tips. Goats begin off-board.
            🐅 Tigers win by capturing 5 goats. 🐐 Goats win by trapping every tiger so it
            cannot move or jump.
          </p>
        </Card>
        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-2xl mb-2">Phase 1 — Placement</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The goat player places one goat on any empty point, then a tiger moves
            (or jumps). This continues until all 15 goats are placed.
          </p>
        </Card>
        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-2xl mb-2">Phase 2 — Movement</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Both sides slide one piece per turn to an adjacent empty point along a line.
            Tigers may instead jump straight over a single adjacent goat to the empty
            point directly beyond it (capturing that goat).
          </p>
        </Card>
        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-2xl mb-2">Strategy Tips</h2>
          <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
            <li>A goat is safe if the point directly behind it is occupied — there is nowhere to land.</li>
            <li>Goats win by patience: build chains and slowly choke off tiger lines.</li>
            <li>Tigers thrive on mobility — keep open landing squares behind goats.</li>
          </ul>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild size="lg" className="bg-teak-gradient"><Link to="/play">Start a game</Link></Button>
      </div>
    </div>
  </main>
);

export default Rules;
