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

export default function HomePage() {
  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-16 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            IELTS Speaking Practice
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Practice your IELTS speaking skills with our AI-powered examiner.
            Get instant feedback and improve your score.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Realtime Chat
              </CardTitle>
              <CardDescription className="text-sm min-h-12">
                Take a full IELTS speaking test with our AI examiner
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

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                Practice on Questions
              </CardTitle>
              <CardDescription className="text-sm min-h-12">
                Speak on a topic and get instant feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/materials">
                <Button variant="outline" className="w-full group">
                  Start Practice
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Progress Tracking
              </CardTitle>
              <CardDescription className="text-sm min-h-12">
                Monitor your speaking improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/progress">
                <Button variant="outline" className="w-full group">
                  View Progress
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Why Practice With Us?
          </h2>
          <div className="grid gap-4">
            {[
              "Real IELTS test simulation with AI examiner",
              "Instant feedback on your speaking performance",
              "Practice all three parts of the speaking test",
              "Multiple AI voices to practice with",
              "Track your progress and improvements",
              "Available 24/7 for practice",
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-card/30 backdrop-blur-sm"
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Link href="/practice">
            <Button size="lg" className="group">
              Start Practicing Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
