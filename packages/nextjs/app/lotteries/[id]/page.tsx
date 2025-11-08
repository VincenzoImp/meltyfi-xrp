"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import type { NextPage } from "next";
import { LotteryDetails } from "~~/components/meltyfi";
import { Button } from "~~/components/ui/button";
import { useLottery } from "~~/hooks/meltyfi";

interface PageProps {
  params: Promise<{ id: string }>;
}

const LotteryPage: NextPage<PageProps> = ({ params }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const lotteryId = parseInt(resolvedParams.id);
  const { lottery, isLoading, error } = useLottery(lotteryId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !lottery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Lottery Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The lottery you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/lotteries">Browse Lotteries</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lotteries
      </Button>

      <LotteryDetails lottery={lottery} />
    </div>
  );
};

export default LotteryPage;
