import React from 'react';
import './WalletList.css';

type WalletEntryParams = {
  name: string;
  uuid: string;
  rdns: string;
  icon: string;
  extensionId?: string;
};

export type WalletMapEntry = {
  params: WalletEntryParams;
  eventName: string;
};

type WalletListProps = {
  wallets: Record<string, WalletMapEntry>;
  handleClick: (extensionId?: string) => Promise<void>;
};

const WalletList: React.FC<WalletListProps> = ({ wallets, handleClick }) => {
  const walletEntries = Object.entries(wallets);

  if (!walletEntries.length) {
    return null;
  }
  const onClickHandler = (extensionId?: string) => {
    handleClick(extensionId).catch((error) => {
      console.error('Error using extension id to connect', error);
    });
  };

  return (
    <div className="wallet-list">
      {walletEntries.map(([key, wallet]) => (
        <div key={key} className="wallet-card">
          <img
            src={wallet.params.icon}
            alt={`${wallet.params.name} icon`}
            className="wallet-icon"
          />
          <div className="wallet-info">
            <h3 className="wallet-name">{wallet.params.name}</h3>
            <p className="wallet-uuid">UUID: {wallet.params.uuid}</p>
            <p className="wallet-rdns">RDNS: {wallet.params.rdns}</p>
            {wallet.params.extensionId && (
              <p className="wallet-extension-id">
                Extension ID: {wallet.params.extensionId}
              </p>
            )}
          </div>
          <button
            disabled={Boolean(!wallet.params.extensionId)}
            onClick={() => onClickHandler(wallet.params.extensionId)}
          >
            Connect wallet
          </button>
        </div>
      ))}
    </div>
  );
};

export default WalletList;
