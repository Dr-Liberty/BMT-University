import { createThirdwebClient, defineChain } from "thirdweb";

export const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "",
});

export const kasplexL2 = defineChain({
  id: 202555,
  name: "Kasplex L2",
  nativeCurrency: {
    name: "KAS",
    symbol: "KAS",
    decimals: 18,
  },
  rpc: "https://rpc.kasplex.org",
  blockExplorers: [
    {
      name: "Kasplex Explorer",
      url: "https://explorer.kasplex.org",
    },
  ],
});

export const BMT_TOKEN_ADDRESS = "0x35fBa50F52e2AA305438134c646957066608d976";
