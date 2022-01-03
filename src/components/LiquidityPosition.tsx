import { useContext, useEffect, useState } from "react";
import { bgLoadingStates, GlobalContext, removeBgLoadingState } from "../context/GlobalState";
import LiquidityPositionItem from "./LiquidityPositionItem";
import YellowXLoader from "../assets/YellowXLoader.gif";
import UserMessageModal, { userMessage } from "./UserMessageModal";
import setPoolDataFromOcean, {
  getLocalPoolData,
  updateUserStakePerPool,
  PoolData,
} from "../utils/stakedPoolsUtils";

const LiquidityPosition = () => {
  const {
    accountId,
    ocean,
    chainId,
    loading,
    setLoading,
    allStakedPools,
    setAllStakedPools,
    bgLoading,
    setBgLoading,
    config,
    web3,
    stakeFetchTimeout,
    setStakeFetchTimeout,
  } = useContext(GlobalContext);
  const [noStakedPools, setNoStakedPools] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string | userMessage | null>(
    null
  );

  useEffect(() => {
    setAllStakedPools(null);
    setBgLoading([...bgLoading, bgLoadingStates.allStakedPools])
    try {
      let localData: any;
      if (accountId) {
        localData = getLocalPoolData(accountId, chainId);
        if (localData && localData != null) {
          setNoStakedPools(false);
          setAllStakedPools(JSON.parse(localData));
          setLoading(false);
        } else {
          setLoading(true);
          setUserMessage(null);
        }
      }

      if (localData) {
        localData = JSON.parse(localData);
        updateUserStakePerPool({
          ocean,
          accountId,
          localData,
          setAllStakedPools,
        }).then(()=>{
          setBgLoading(removeBgLoadingState(bgLoading, bgLoadingStates.allStakedPools))
          setLoading(false);
          setNoStakedPools(false);
          setUserMessage(null);
        })
      }

      //The ocean fetch protocol needs better resolving before further use. Resolve all possible fetches before diaplaying an error screen. Only show error screen if nothing can be resolved. 

      // if (ocean && accountId && !localData) {
      //   // consider a conditional that checks if stake is already loading or using a set for bgLoading
      //   setPoolDataFromOcean({
      //     accountId,
      //     ocean,
      //     chainId,
      //     setAllStakedPools,
      //     setNoStakedPools,
      //     setLoading,
      //     bgLoading,
      //     setBgLoading,
      //     config,
      //     web3,
      //     allStakedPools,
      //     setError: setUserMessage,
      //     stakeFetchTimeout,
      //     setStakeFetchTimeout,
      //   });
      //   setUserMessage(null);
      // }
    } catch (error) {
      console.error(error);
      // setUserMessage({
      //   message: "We couldnt retrieve your pool share information.",
      //   link: {
      //     href: "https://discord.com/invite/b974xHrUGV",
      //     desc: "Reach out on our discord for support!",
      //   },
      //   type: "error",
      // });
    }

    if (!accountId) {
      setUserMessage("Connect your wallet to see staked oceans.");
      setLoading(false);
    } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, ocean]);

  useEffect(() => {
    if (noStakedPools) {
      setUserMessage(
        "You have no stake in any pools, check out StakeX to buy stake!"
      );
    }
  }, [noStakedPools]);

  return (
    <div className="w-full h-full">
      <div className="w-1/2 flex justify-center">
        <h2 className={`text-2xl ${accountId ? "block" : "hidden"}`}>
          Your staked pools:
        </h2>
      </div>
      {userMessage ? (
        <UserMessageModal
          message={userMessage}
          pulse={false}
          container={true}
          timeout={null}
        />
      ) : loading ? (
        <div className="flex flex-col justify-center text-center align-middle items-center h-full pt-32">
          <img
            src={YellowXLoader}
            alt="DataX Animation"
            width="150px"
            className="pb-3"
          />
          Scanning the entire chain, this will take about 20 seconds.
        </div>
      ) : (
        <div className="h-4/5 z-0">
          {bgLoading.includes("stake") ? (
            <div className="text-xs md:text-base pt-5 w-full text-center px-3">
              Loading most recent information in the background . . .
            </div>
          ) : null}
          <ul
            className={`${bgLoading ? " md:mt-1" : "md:mt-5"} pr-3 pl-3 pt-5 `}
          >
            {allStakedPools?.map((pool: PoolData, index: number) => (
              <LiquidityPositionItem pool={pool} index={index} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LiquidityPosition;
