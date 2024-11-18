"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import Image from "next/image";
export default function UserPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/user");
      const data = await res.json();
      setData(data);
    }
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Image
            src="/talk.svg"
            alt="Talk"
            width={32}
            height={32}
            className="w-6 h-6 md:w-8 md:h-8"
          />
          <span className="text-lg md:text-lg hidden md:block">Talk</span>
          <div className="flex items-center gap-2">User</div>
        </CardTitle>
      </div>
      <Card className="bg-white/10 backdrop-blur-lg text-white flex-1 border-white/40 shadow-xl">
        <CardContent className="p-4 space-y-2">
          {JSON.stringify(data)}
        </CardContent>
      </Card>
    </div>
  );
}
