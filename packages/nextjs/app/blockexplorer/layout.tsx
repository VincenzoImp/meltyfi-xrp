import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Block Explorer",
  description: "Explore XRP EVM blockchain transactions and contracts",
});

const BlockExplorerLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default BlockExplorerLayout;
