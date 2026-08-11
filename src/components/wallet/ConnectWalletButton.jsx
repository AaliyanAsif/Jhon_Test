import { FaWallet } from 'react-icons/fa';
import { useWallet, WALLET_ERROR } from '../../context/WalletContext';

const variants = {
  primary: 'btn',
  cta: 'btn bg-primary-700 hover:bg-primary-800',
  mobile: 'block w-full text-left px-3 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700',
  connected:
    'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 dark:border-primary-800 dark:text-primary-300 dark:bg-primary-950/40 dark:hover:bg-primary-900/50',
};

const METAMASK_INSTALL_URL = 'https://metamask.io/download/';

function metamaskAppLink() {
  if (typeof window === 'undefined') return METAMASK_INSTALL_URL;
  return `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
}

function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function ConnectWalletButton({
  variant = 'primary',
  className = '',
  showIcon = false,
  connectedLabel,
  onAfterConnect,
}) {
  const { account, shortAddress, isConnecting, isConnected, connect, disconnect, error, clearError } =
    useWallet();

  const handleClick = async () => {
    clearError();
    if (isConnected) {
      disconnect();
      onAfterConnect?.();
      return;
    }

    const address = await connect();
    if (address) {
      onAfterConnect?.();
    }
  };

  const label = isConnecting
    ? 'Connecting…'
    : isConnected
      ? connectedLabel || shortAddress
      : showIcon
        ? 'Connect Wallet'
        : 'Connect';

  const baseClass = isConnected && variant !== 'mobile' ? variants.connected : variants[variant] || variants.primary;
  const noWallet = error?.code === WALLET_ERROR.NO_WALLET;
  const pending = error?.code === WALLET_ERROR.PENDING;

  return (
    <div className={variant === 'mobile' ? 'space-y-1' : 'inline-flex flex-col items-stretch'}>
      <button
        type="button"
        className={`${baseClass} ${className}`.trim()}
        onClick={handleClick}
        disabled={isConnecting}
        title={account || undefined}
        aria-label={isConnected ? `Connected wallet ${shortAddress}. Click to disconnect.` : 'Connect wallet'}
      >
        {showIcon && !isConnected && !isConnecting ? <FaWallet className="mr-2" /> : null}
        {label}
      </button>

      {error ? (
        <div
          className={`text-xs ${variant === 'mobile' ? 'px-3' : 'mt-1 max-w-[16rem] text-left'}`}
          role="alert"
        >
          {noWallet ? (
            <p className="text-secondary-600 dark:text-secondary-300">
              No browser wallet detected.{' '}
              <a
                href={isMobile() ? metamaskAppLink() : METAMASK_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 underline"
              >
                {isMobile() ? 'Open in MetaMask app' : 'Install MetaMask'}
              </a>
              , then reload this page.
            </p>
          ) : pending ? (
            <p className="text-secondary-600 dark:text-secondary-300">
              Open your wallet extension to approve the request already waiting there.
            </p>
          ) : (
            <p className="text-red-600 dark:text-red-400">{error.message}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default ConnectWalletButton;
