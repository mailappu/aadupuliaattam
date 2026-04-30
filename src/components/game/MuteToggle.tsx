import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, sfx } from "@/lib/sfx";

export function MuteToggle() {
  const [muted, setM] = useState(false);
  useEffect(() => { setM(isMuted()); }, []);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={muted ? "Unmute" : "Mute"}
      onClick={() => {
        const v = !muted;
        setMuted(v);
        setM(v);
        if (!v) sfx.select();
      }}
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </Button>
  );
}
