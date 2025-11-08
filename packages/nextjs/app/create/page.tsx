"use client";

import { Sparkles } from "lucide-react";
import type { NextPage } from "next";
import { CreateLotteryForm } from "~~/components/meltyfi/lottery/CreateLotteryForm";

const CreatePage: NextPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Create New Lottery</span>
        </div>

        <h1 className="text-4xl font-bold mb-2">Unlock Your NFT&apos;s Liquidity</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create a lottery for your NFT and receive XRP as participants buy tickets. You keep 95% of all proceeds, with
          a 5% protocol fee.
        </p>
      </div>

      {/* Form */}
      <CreateLotteryForm />

      {/* Help Text */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>You must own the NFT in your connected wallet</li>
          <li>The NFT will be locked in the protocol until the lottery ends</li>
          <li>You can repay participants if needed before the lottery ends</li>
          <li>Winners are selected randomly via Chainlink VRF</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatePage;
