import { useState, useEffect } from "react";
import { AlarmClock } from "lucide-react";

export const Timer = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="absolute flex items-center gap-2 top-2 right-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white font-mono text-base">
      <AlarmClock className="w-4 h-4" />
      {formatTime(time)}
    </div>
  );
};
