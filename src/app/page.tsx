import Link from "next/link";
import { Mic, Book, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col justify-center">
      <div className="container mx-auto px-4 py-16 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Talk
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            Practice your IELTS speaking skills with our AI-powered examiner.
            Get instant feedback and improve your score.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-card/5 backdrop-blur-sm border-primary/5 hover:bg-card/10 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Icons.mic className="h-5 w-5" />
                Random Chat
              </CardTitle>
              <CardDescription className="text-sm min-h-12 text-white/80">
                Chat with our AI friend on a random topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/chat">
                <Button className="w-full group">
                  Start Chat
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/5 backdrop-blur-sm border-primary/5 hover:bg-card/10 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Icons.graduationCap className="h-5 w-5" />
                Practice on Questions
              </CardTitle>
              <CardDescription className="text-sm min-h-12 text-white/80">
                Speak on a topic and get instant feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/practice">
                <Button variant="outline" className="w-full group">
                  Start Practice
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/5 backdrop-blur-sm border-primary/5 hover:bg-card/10 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Icons.audio className="h-5 w-5" />
                Test Rehearsal
              </CardTitle>
              <CardDescription className="text-sm min-h-12 text-white/80">
                Take a full IELTS speaking test with our AI examiner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/chat">
                <Button className="w-full group">
                  Start Test
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/5 backdrop-blur-sm border-primary/5 hover:bg-card/10 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Icons.chart className="h-5 w-5" />
                Progress Tracking
              </CardTitle>
              <CardDescription className="text-sm min-h-12 text-white/80">
                Monitor your speaking improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/account">
                <Button variant="outline" className="w-full group">
                  View Progress
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
