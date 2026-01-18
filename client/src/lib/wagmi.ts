import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const kasplexL2 = defineChain({
  id: 202555,
  name: 'Kasplex zkEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'Kaspa',
    symbol: 'KAS',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc.kasplex.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Kasplex Explorer', url: 'https://explorer.kasplex.org' },
  },
});

export const BMT_TOKEN_ADDRESS = '0x35fBa50F52e2AA305438134c646957066608d976' as const;

export const config = createConfig({
  chains: [kasplexL2],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [kasplexL2.id]: http('https://evmrpc.kasplex.org'),
  },
});
