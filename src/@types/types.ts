import React, { Dispatch, SetStateAction } from 'react';
import { Location, NavigateFunction } from 'react-router-dom';
import Web3 from 'web3';
import Web3Modal from 'web3modal';

export type supportedChains = 2828;

export interface IGuardianInfo {
  name: string;
  address: string;
}

export interface IGuardianList {
  [id: number]: IGuardianInfo;
}
export interface IVaultInfo {
  vaultName: string;
  guardianList: IGuardianList;
  threshold: number;
  guardianCount: number;
  ERC725Address: string;
  vaultAddress: string;
  timestampId: number;
  lastUpdated: number;
}

export interface IUserVaults {
  [timestampId: number]: IVaultInfo;
}

export interface globalStates {
  handleConnect: Function;
  accountId?: string;
  chainId?: supportedChains;
  provider?: Web3Modal;
  web3?: Web3;
  unsupportedNet: boolean;
  cookiesAllowed: boolean | null;
  setCookiesAllowed: Dispatch<SetStateAction<boolean | null>>;
  currentVaultEdits: IVaultInfo;
  setCurrentVaultEdits: Dispatch<SetStateAction<IVaultInfo>>;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  allVaults: IUserVaults | undefined;
  setAllVaults: Dispatch<SetStateAction<IUserVaults | undefined>>;
  resetVaultAndSteps: () => void;
  globalSnackbarQue: string[];
  setGlobalSnackbarQue: Dispatch<SetStateAction<string[]>>;
  location: Location | null;
  setLocation: Dispatch<SetStateAction<Location | null>>;
  updateAndGoHome: (navigate: NavigateFunction, location: Location) => void;
}
