import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

export const kasplexL2 = {
  id: 202555,
  name: 'Kasplex L2',
  nativeCurrency: {
    decimals: 18,
    name: 'Kaspa',
    symbol: 'KAS',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.kasplex.org'],
    },
    public: {
      http: ['https://rpc.kasplex.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Kasplex Explorer', url: 'https://explorer.kasplex.org' },
  },
} as const;

export const BMT_TOKEN_ADDRESS = '0x35fBa50F52e2AA305438134c646957066608d976' as const;

export const config = getDefaultConfig({
  appName: 'BMT University',
  projectId: 'bmt-university-app',
  chains: [kasplexL2],
  transports: {
    [kasplexL2.id]: http('https://rpc.kasplex.org'),
  },
  ssr: false,
});
