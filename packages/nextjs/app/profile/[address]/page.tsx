"use client";

import { use } from "react";
import { Copy, ExternalLink, Trophy, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { ChocoChipsTab } from "~~/components/meltyfi/profile/ChocoChipsTab";
import { MyLotteriesTab } from "~~/components/meltyfi/profile/MyLotteriesTab";
import { MyTicketsTab } from "~~/components/meltyfi/profile/MyTicketsTab";
import { OverviewTab } from "~~/components/meltyfi/profile/OverviewTab";
import { Avatar, AvatarFallback, AvatarImage } from "~~/components/ui/avatar";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent } from "~~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/tabs";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { formatAddress } from "~~/lib/utils";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth/networks";

interface ProfilePageProps {
  params: Promise<{
    address: string;
  }>;
}

/**
 * Profile Page - User profile with activity tracking
 * Shows overview, lotteries created, tickets owned, and ChocoChips balance
 */
export default function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = use(params);
  const profileAddress = resolvedParams.address as `0x${string}`;
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const isOwnProfile = connectedAddress?.toLowerCase() === profileAddress.toLowerCase();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(profileAddress);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://effigy.im/a/${profileAddress}.png`} />
              <AvatarFallback className="text-2xl">{profileAddress.slice(2, 4)}</AvatarFallback>
            </Avatar>

            {/* Address and Actions */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{formatAddress(profileAddress, 8)}</h1>
                {isOwnProfile && (
                  <Badge variant="secondary" className="ml-2">
                    You
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">{profileAddress}</code>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2" asChild>
                  <a
                    href={getBlockExplorerAddressLink(targetNetwork, profileAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Block Explorer
                  </a>
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Trophy className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Wallet className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Lotteries</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lotteries">My Lotteries</TabsTrigger>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="chocochips">ChocoChips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab address={profileAddress} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="lotteries" className="mt-6">
          <MyLotteriesTab address={profileAddress} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <MyTicketsTab address={profileAddress} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="chocochips" className="mt-6">
          <ChocoChipsTab address={profileAddress} isOwnProfile={isOwnProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
