import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../context/GlobalState";
import { BiLockAlt, BiLockOpenAlt } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import BigNumber from "bignumber.js";
import { getAllowance } from "../hooks/useTokenList";
import { ApprovalStates } from "../utils/types";
import OutsideClickHandler from "react-outside-click-handler";
export default function UnlockTokenModal({ nextFunction }: { nextFunction: Function }) {
  const {
    accountId,
    config,
    ocean,
    setShowUnlockTokenModal,
    setSnackbarItem,
    lastTx,
    token1,
    token2,
    setLastTx,
    setToken1,
    location,
  } = useContext(GlobalContext);
  const [approving, setApproving] = useState<ApprovalStates>("pending");
  const [pool, setPool] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const remove = "/stake/remove";
  // Set up the interval.
  useEffect(() => {
    let delay: number | null = 1500;
    let id: NodeJS.Timeout;
    if (accountId && ocean && pool && address) {
      id = setInterval(
        () =>
          getAllowance(address, accountId, pool, ocean).then((res) => {
            console.log("Response from allowance call", res);
            const allowance = new BigNumber(res);
            if (allowance.gte(token1.value) && setShowUnlockTokenModal) {
              setShowUnlockTokenModal(false);
              nextFunction();
              setPool(null);
              setAddress(null);
              delay = null;
            }
          }),
        delay
      );
    }
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, accountId, pool, ocean]);

  async function unlockTokens(amount: "perm" | "once") {
    if (ocean) {
      let pool: string = "";
      let address: string = "";

      if (token1.info && token2.info && ocean.isOCEAN(token1.info.address)) {
        pool = token2.info.pool || "";
        address = token1.info.address;
      } else if (token1.info && token2.info && ocean.isOCEAN(token2.info.address)) {
        pool = token1.info.pool || "";
        address = token1.info.address;
      } else if (token1.info) {
        pool = config?.default.routerAddress;
        address = token1.info.address;
      }

      try {
        if (!accountId || (lastTx?.txType === "unstake" && !lastTx?.shares)) return;
        setApproving("approving");
        let txReceipt;
        if (amount === "perm") {
          txReceipt = await ocean.approve(address, pool, new BigNumber(18e10).toString(), accountId);
          setToken1({ ...token1, allowance: new BigNumber(18e10) });
        } else {
          txReceipt = await ocean.approve(address, pool, token1.value.plus(0.001).toString(), accountId);
          setToken1({ ...token1, allowance: token1.value.plus(0.001) });
        }

        if (lastTx?.txType === "approve") {
          setLastTx({ ...lastTx, txReceipt, status: "Indexing" });
        }

        setApproving("approved");
        setPool(pool);
        setAddress(address);
      } catch (error: any) {
        if(lastTx)
        setLastTx({ ...lastTx, status: "Failure" });
        setSnackbarItem({ type: "error", message: error.error.message, error });
        setShowUnlockTokenModal(false);
      }
    }
  }

  return token1.info && lastTx ? (
    <div
      id="transactionDoneModal"
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:max-w-sm w-full z-20 shadow"
    >
      <OutsideClickHandler
        onOutsideClick={() => {
          setShowUnlockTokenModal(false);
          setLastTx({ ...lastTx, status: "Failure" });
        }}
      >
        <div className="bg-black border items-center flex flex-col rounded-lg pb-8 pt-2 px-4 hm-box mx-3">
          <div className="flex w-full  justify-end">
            <MdClose
              id="closeTokenModalBtn"
              role="button"
              onClick={() => {
                setShowUnlockTokenModal(false);
                setLastTx({ ...lastTx, status: "Failure" });
              }}
              className="text-gray-100 text-2xl"
            />
          </div>
          <div className="pb-5">
            {approving === "pending" ? (
              <BiLockAlt size="72px" className="text-city-blue" />
            ) : approving === "approving" ? (
              <BiLockAlt size="72px" className="text-city-blue animate-bounce" />
            ) : (
              <BiLockOpenAlt size="72px" className="text-city-blue animate-bounce" />
            )}
          </div>
          <h3 className="text-sm lg:text-2xl pb-5">Unlock {token1.info.symbol}</h3>
          <p className="text-sm lg:text-base text-center pb-5">
            DataX needs your permission to spend{" "}
            {location === remove ? lastTx.shares?.dp(5).toString() : token1.value.dp(5).toString()}{" "}
            {location === remove ? "shares" : token1.info.symbol}.
          </p>

          <button
            id="perm-unlock-btn"
            onClick={() => {
              unlockTokens("perm");
            }}
            className="w-full p-2 rounded-lg mb-2 bg-opacity-20 txButton"
            disabled={approving === "approving" || pool || address ? true : false}
          >
            Unlock Permanently
          </button>
          <button
            id="unlock-once-btn"
            onClick={() => {
              unlockTokens("once");
            }}
            disabled={approving === "approving" || pool || address ? true : false}
            className="w-full p-2 rounded-lg mb-2 bg-opacity-20 txButton"
          >
            Unlock this time only
          </button>
        </div>
      </OutsideClickHandler>
    </div>
  ) : (
    <></>
  );
}
