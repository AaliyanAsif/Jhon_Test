import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

const STORAGE_KEY = 'rentverse-wallet-connected';

export const WALLET_ERROR = {
  NO_WALLET: 'NO_WALLET',
  REJECTED: 'REJECTED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
};

function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function getInjectedProvider() {
  if (typeof window === 'undefined') return null;
  const injected = window.ethereum;
  if (!injected) return null;

  // Several extensions installed side by side expose an array instead of one provider.
  if (Array.isArray(injected.providers) && injected.providers.length > 0) {
    return injected.providers.find((candidate) => candidate.isMetaMask) || injected.providers[0];
  }
  return injected;
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasWallet, setHasWallet] = useState(() => Boolean(getInjectedProvider()));
  const pendingConnect = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  // Extensions can inject after first paint, so keep looking for a short while.
  useEffect(() => {
    if (hasWallet) return undefined;

    const detect = () => {
      if (getInjectedProvider()) setHasWallet(true);
    };

    window.addEventListener('ethereum#initialized', detect);
    window.addEventListener('eip6963:announceProvider', detect);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    const interval = setInterval(detect, 500);
    const stopPolling = setTimeout(() => clearInterval(interval), 3000);

    return () => {
      window.removeEventListener('ethereum#initialized', detect);
      window.removeEventListener('eip6963:announceProvider', detect);
      clearInterval(interval);
      clearTimeout(stopPolling);
    };
  }, [hasWallet]);

  const syncFromProvider = useCallback(async (provider) => {
    if (!provider) {
      setAccount(null);
      setChainId(null);
      return;
    }

    const web3Provider = new ethers.providers.Web3Provider(provider, 'any');
    const accounts = await web3Provider.listAccounts();
    const network = await web3Provider.getNetwork();
    setAccount(accounts[0] || null);
    setChainId(network.chainId);
  }, []);

  const connect = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      setHasWallet(false);
      setError({
        code: WALLET_ERROR.NO_WALLET,
        message: 'No browser wallet detected.',
      });
      return null;
    }

    // Reuse an in-flight request so extra clicks don't stack up in the wallet.
    if (pendingConnect.current) return pendingConnect.current;

    setIsConnecting(true);
    setError(null);

    const request = (async () => {
      try {
        const web3Provider = new ethers.providers.Web3Provider(provider, 'any');
        await web3Provider.send('eth_requestAccounts', []);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        const network = await web3Provider.getNetwork();

        setAccount(address);
        setChainId(network.chainId);
        localStorage.setItem(STORAGE_KEY, '1');
        return address;
      } catch (err) {
        // -32002 means the wallet already has an unanswered request open.
        const code = err?.code ?? err?.data?.originalError?.code;
        if (code === 4001) {
          setError({ code: WALLET_ERROR.REJECTED, message: 'Connection request was rejected.' });
        } else if (code === -32002) {
          setError({
            code: WALLET_ERROR.PENDING,
            message: 'A connection request is already waiting in your wallet.',
          });
        } else {
          setError({
            code: WALLET_ERROR.FAILED,
            message: err?.message || 'Failed to connect wallet.',
          });
        }
        return null;
      } finally {
        pendingConnect.current = null;
        setIsConnecting(false);
      }
    })();

    pendingConnect.current = request;
    return request;
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider) return undefined;

    const handleAccountsChanged = (accounts) => {
      if (!accounts?.length) {
        disconnect();
        return;
      }
      setAccount(accounts[0]);
      localStorage.setItem(STORAGE_KEY, '1');
    };

    const handleChainChanged = (hexChainId) => {
      setChainId(parseInt(hexChainId, 16));
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    if (localStorage.getItem(STORAGE_KEY) === '1') {
      syncFromProvider(provider).catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
    }

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [disconnect, syncFromProvider, hasWallet]);

  const value = useMemo(
    () => ({
      account,
      chainId,
      hasWallet,
      isConnecting,
      isConnected: Boolean(account),
      error,
      shortAddress: shortenAddress(account),
      connect,
      disconnect,
      clearError,
    }),
    [account, chainId, hasWallet, isConnecting, error, connect, disconnect, clearError]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
