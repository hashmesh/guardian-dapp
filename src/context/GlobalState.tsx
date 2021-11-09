import Web3 from "web3";
import { Ocean, Config } from "@dataxfi/datax.js";
import Web3Modal, { getInjectedProviderName } from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import Core from "web3modal";
import Disclaimer from "../components/Disclaimer";
import {
  acceptsCookiesGA,
  deniedCookiesGA,
  connectedMultipleWalletsGA,
  connectedWalletGA,
  connectedToNetworkGA,
  deniedSignatureGA,
  connectedWalletViaGA,
} from "./Analytics";

const initialState: any = {};
const CONNECT_TEXT = "Connect Wallet";

export const GlobalContext = createContext(initialState);

export const GlobalProvider = ({
  children,
}: {
  children: PropsWithChildren<{}>;
}) => {
  const NETWORK = "mainnet";
  // const [state, dispatch]: [any, Function] = useReducer(AppReducer, initialState)
  const [web3Modal, setWeb3Modal] = useState<Core | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [provider, setProvider] = useState(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [ocean, setOcean] = useState<Ocean | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [disclaimerSigned, setDisclaimerSigned] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string | undefined>(
    CONNECT_TEXT
  );
  const [cookiesAllowed, setCookiesAllowed] = useState<boolean>(false);

  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key || "");
      if (value === "pending") localStorage.removeItem(key || "");
    }
  }, []);

  useEffect(() => {
    if (provider && !accountId) {
      handleConnect();
    }
  }, [disclaimerSigned]);

  useEffect(() => {
    async function init() {
      const web3Modal = new Web3Modal({
        network: "mainnet", // optional
        cacheProvider: true, // optional
        theme: "dark",
        providerOptions: {
          walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: process.env.REACT_APP_INFURA_ID, // required
            },
          },
        }, // required
      });

      setWeb3Modal(web3Modal);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3, chainId]);

  // async function setupWeb3AndOcean(){
  //   const provider = await web3Modal?.connect()
  //   setProvider(provider)

  //   // This is required to get the token list
  //   const web3 = new Web3(provider)
  //   setWeb3(web3)
  // }

  async function handleSignature(
    account: string,
    web3: Web3,
    localSignature: string | null
  ): Promise<any> {
    account = account.toLowerCase();

    let cookiesConfirmed;

    if (!cookiesAllowed) {
      if (
        window.confirm(
          'Press "okay" to consent to cookies and connect to your wallet.'
        )
      ) {
        cookiesConfirmed = true;
        localStorage.setItem("cookiesAllowed", "true");
        setCookiesAllowed(true);
        acceptsCookiesGA();
      } else {
        deniedCookiesGA();
      }
    } else {
      cookiesConfirmed = true;
    }

    if (cookiesConfirmed) {
      try {
        if (!localSignature) {
          localStorage.setItem(account, "pending");
          let signature = await web3.eth.personal.sign(
            Disclaimer(),
            account || "",
            ""
          );
          localStorage.setItem(account, signature);
          setDisclaimerSigned(true);
        } else if (localSignature === "pending") {
          alert(
            "You must open your wallet and sign the pending disclaimer before proceeding."
          );
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem(account);
        deniedSignatureGA();
      }
      return localSignature;
    }
  }

  async function handleConnect() {
    const provider = await web3Modal?.connect();
    setProvider(provider);
    // // This is required to get the token list
    const web3 = new Web3(provider);
    console.log("Web3");
    console.log(web3);
    setWeb3(web3);

    let accounts = await web3.eth.getAccounts();
    let account = accounts[0] ? accounts[0].toLowerCase() : null;
    const localSignature = localStorage.getItem(account ? account : "");

    if (localSignature && localSignature !== "pending") {
      let _chainId = parseInt(String(await web3.eth.getChainId()));
      setChainId(_chainId);

      // This is required to do wallet-specific functions
      const ocean = new Ocean(web3, String(_chainId));
      setOcean(ocean);
      console.log("chainID - ", chainId);
      console.log("Pre chainID - ", _chainId);
      const config = new Config(web3, String(_chainId));
      setConfig(config);

      if (
        isSupportedChain(
          config,
          String(_chainId),
          accounts[0] ? accounts[0] : ""
        )
      ) {
      } else {
        alert(
          `Please connect to a supported chain: Ethereum Mainnet, Polygon, BSC, Rinkeby.`
        );
      }
    } else {
      handleSignature(accounts[0], web3, localSignature);
    }
    setListeners(provider, web3);
  }

  function isSupportedChain(
    config: Config,
    chainId: string,
    account: string | null
  ) {
    const network = config.getNetwork(chainId);
    connectedToNetworkGA({ network, chainId });
    if (network === "unknown") {
      setAccountId(null);
      setButtonText(CONNECT_TEXT);
      return false;
    } else {
      console.log("Account Id - ", accountId);
      console.log("Pre Account Id - ", account);
      setAccountId(account);
      setButtonText(account || CONNECT_TEXT);
      connectedWalletGA();
      const wallet = getInjectedProviderName();
      connectedWalletViaGA({ wallet });
      return true;
    }
  }

  function setListeners(provider: any, web3: Web3) {
    provider.on("accountsChanged", (accounts: any) => {
      let account = accounts[0] ? accounts[0].toLowerCase() : null;
      const localSignature = localStorage.getItem(account ? account : "");
      console.log("accountsChanged");
      if (localSignature && localSignature !== "pending") {
        console.log("Accounts changed to - ", accounts[0]);
        console.log("Connected Accounts - ", JSON.stringify(accounts));
        setAccountId(accounts[0]);
        setButtonText(
          accounts.length && accounts[0] !== "" ? accounts[0] : CONNECT_TEXT
        );
        connectedMultipleWalletsGA();
        connectedWalletGA();
      } else {
        setAccountId(null);
        setButtonText(CONNECT_TEXT);
        setChainId(undefined);
        setDisclaimerSigned(false);
        handleSignature(accounts[0], web3, localSignature);
      }
    });

    // Subscribe to chainId change
    provider.on("chainChanged", async (chainId: any) => {
      console.log(chainId);
      console.log("Chain changed to ", parseInt(chainId));
      setChainId(parseInt(chainId));
      const config = new Config(web3, String(parseInt(chainId)));
      setConfig(config);
      setOcean(new Ocean(web3, String(parseInt(chainId))));
      isSupportedChain(config, String(chainId), null);
    });

    // Subscribe to provider connection
    provider.on("connect", (info: { chainId: number }) => {
      console.log("Connect event fired");
      console.log(info);
    });

    // Subscribe to provider disconnection
    provider.on("disconnect", (error: { code: number; message: string }) => {
      console.log(error);
    });
  }

  return (
    <GlobalContext.Provider
      value={{
        handleConnect,
        buttonText,
        accountId,
        chainId,
        provider,
        web3,
        ocean,
        network: NETWORK,
        config,
        setCookiesAllowed,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
