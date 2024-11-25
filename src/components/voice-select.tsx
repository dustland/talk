import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Speech } from "lucide-react";

interface Voice {
  id: string;
  label: string;
  description: string;
  tags: string[];
}

export const OPENAI_VOICES: Voice[] = [
  {
    id: 'alloy',
    label: 'Alloy',
    description: 'A versatile, neutral voice with a natural tone',
    tags: ['neutral', 'professional', 'male'],
  },
  {
    id: 'echo',
    label: 'Echo',
    description: 'A warm and rounded voice with a friendly demeanor',
    tags: ['warm', 'casual', 'male'],
  },
  {
    id: 'shimmer',
    label: 'Shimmer',
    description: 'A clear and precise voice with excellent articulation',
    tags: ['professional', 'neutral', 'female'],
  },
  {
    id: 'ash',
    label: 'Ash',
    description: 'A steady and composed voice with subtle warmth',
    tags: ['neutral', 'professional', 'male'],
  },
  {
    id: 'ballad',
    label: 'Ballad',
    description: 'A melodic and engaging voice with gentle expression',
    tags: ['warm', 'casual', 'female'],
  },
  {
    id: 'coral',
    label: 'Coral',
    description: 'A bright and vibrant voice with natural enthusiasm',
    tags: ['warm', 'casual', 'female'],
  },
  {
    id: 'sage',
    label: 'Sage',
    description: 'A thoughtful and measured voice with calm clarity',
    tags: ['neutral', 'professional', 'male'],
  },
  {
    id: 'verse',
    label: 'Verse',
    description: 'An expressive and dynamic voice with artistic flair',
    tags: ['warm', 'casual', 'female'],
  },
];

interface VoiceSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean; 
}

export function VoiceSelect({ value, onValueChange, disabled }: VoiceSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-white/10 border-white/20" disabled={disabled}>
        <Speech className="h-4 w-4 mr-2" />
        <SelectValue>
          <span className="hidden md:block">
            {OPENAI_VOICES.find((v) => v.id === value)?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {OPENAI_VOICES.map((voice) => (
          <SelectItem key={voice.id} value={voice.id}>
            <div className="flex flex-col">
              <span>{voice.label}</span>
              <span className="text-xs text-primary/60">
                {voice.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
