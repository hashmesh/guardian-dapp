import { AiOutlinePlus } from 'react-icons/ai';
import { useState, useContext, useEffect } from 'react';
import { GlobalContext } from '../context/GlobalState';
import { MoonLoader } from 'react-spinners';
import { Link } from 'react-router-dom';
import useLiquidityPos from '../hooks/useLiquidityPos';
import BigNumber from 'bignumber.js';
import { ITxDetails, IBtnProps } from '../utils/types';
import { getAllowance } from '../hooks/useTokenList';
import useAutoLoadToken from '../hooks/useAutoLoadToken';
import TokenSelect from './TokenSelect';
import PositionBox from './PositionBox';
import DatasetDescription from './DTDescriptionModal';
import ViewDescBtn from './ViewDescButton';
import { transactionTypeGA } from '../context/Analytics';
import useClearTokens from '../hooks/useClearTokens';

const INITIAL_BUTTON_STATE = {
  text: 'Connect wallet',
  classes: '',
  disabled: false,
};

export default function Stake() {
  const {
    ocean,
    accountId,
    chainId,
    handleConnect,
    setConfirmingTx,
    setShowUnlockTokenModal,
    token2,
    setToken2,
    token1,
    setToken1,
    setLastTx,
    lastTx,
    tokensCleared,
    setSnackbarItem,
    showDescModal,
    setPreTxDetails,
    executeStake,
    setExecuteStake,
    setExecuteUnlock,
    setBlurBG,
    txApproved,
    preTxDetails,
    showUnlockTokenModal,
    setShowConfirmTxDetails
  } = useContext(GlobalContext);

  const [maxStakeAmt, setMaxStakeAmt] = useState<BigNumber>(new BigNumber(0));
  const [postExchange, setPostExchange] = useState<BigNumber>(new BigNumber(0));
  const [sharesReceived, setSharesReceived] = useState<BigNumber>(new BigNumber(0));
  const [loading, setLoading] = useState(false);
  const [btnProps, setBtnProps] = useState<IBtnProps>(INITIAL_BUTTON_STATE);
  const [importPool, setImportPool] = useState<string>();

  // hooks
  useLiquidityPos(importPool, setImportPool);
  useAutoLoadToken();
  useClearTokens();

  useEffect(() => {
    if (!tokensCleared.current) return;
    if (token1.info && token2.info) {
      getMaxAndAllowance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token1.info, token2.info, tokensCleared, accountId]);

  useEffect(() => {
    if (token1.info && !token2.info && ocean && accountId) {
      ocean.getBalance(token1.info.address, accountId).then((res) => {
        setToken1({ ...token1, balance: new BigNumber(res) });
      });
    }
  }, [token1.info, accountId]);

  useEffect(() => {
    if (!accountId) {
      setBtnProps(INITIAL_BUTTON_STATE);
    } else if (!token2.info) {
      setBtnProps({
        ...INITIAL_BUTTON_STATE,
        text: 'Select a Token',
        disabled: true,
      });
    } else if (!token1.value || token1.value.eq(0)) {
      setBtnProps({
        ...INITIAL_BUTTON_STATE,
        text: 'Enter Stake Amount',
        disabled: true,
      });
    } else if (token1.balance?.eq(0) || (token1.balance && token1.value.gt(token1.balance))) {
      setBtnProps({
        ...INITIAL_BUTTON_STATE,
        text: 'Not Enough OCEAN Balance',
        disabled: true,
      });
    } else if (lastTx?.status === 'Pending') {
      setBtnProps({
        ...INITIAL_BUTTON_STATE,
        text: 'Processing Transaction...',
        disabled: true,
      });
    } else if (token1.value.isLessThan(0.01)) {
      setBtnProps({
        ...INITIAL_BUTTON_STATE,
        text: 'Minimum Stake is .01 OCEAN',
        disabled: true,
      });
    } else if (token1.allowance?.lt(token1.value)) {
      setBtnProps({
        ...btnProps,
        text: 'Unlock OCEAN',
        disabled: false,
      });
    } else {
      setBtnProps({
        ...btnProps,
        disabled: false,
        text: 'Stake',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, ocean, chainId, token2, token1.value, token1.balance, loading, token1.info, lastTx?.status]);

  useEffect(() => {
    if (showUnlockTokenModal && token1.allowance?.gt(token1.value)) {
      setBlurBG(false);
      setShowUnlockTokenModal(false);
      setExecuteStake(true);
    }
  }, [token1.allowance]);

  useEffect(() => {
    if (!accountId && executeStake) {
      handleConnect();
      setExecuteStake(false);
      return;
    }

    if (accountId) {
      if (token1.allowance?.lt(token1.value)) {
        setPreTxDetails({
          accountId,
          status: 'Pending',
          token1,
          token2,
          txDateId: Date.now().toString(),
          txType: 'approve',
        });
        setExecuteUnlock(true);
        setShowUnlockTokenModal(true);
        setBlurBG(true);
        setExecuteStake(false);
      } else if (!txApproved && executeStake) {
        const preTxDetails: ITxDetails = {
          accountId,
          status: 'Pending',
          token1,
          token2,
          txDateId: Date.now().toString(),
          txType: 'stake',
          postExchange,
          shares: sharesReceived,
        };
        setPreTxDetails(preTxDetails);
        setShowConfirmTxDetails(true);
        setBlurBG(true);
      } else if (executeStake && preTxDetails) {
        setLastTx(preTxDetails);
        stake(preTxDetails);
      }
    }
  }, [executeStake]);

  async function getMaxStakeAmt() {
    if (token2.info && ocean) {
      return new BigNumber(
        await ocean.getMaxStakeAmount(token2.info.pool || '', ocean.config.default.oceanTokenAddress)
      ).dp(5);
    }
  }

  async function getMaxAndAllowance() {
    getMaxStakeAmt()
      .then((res: BigNumber | void) => {
        if (res) {
          setMaxStakeAmt(res);
        }
      })
      .then(() => {
        if (token2.info && accountId && chainId && ocean) {
          getAllowance(ocean.config.default.oceanTokenAddress, accountId, token2.info.pool || '', ocean).then(
            async (res) => {
              if (!token1.info) return;
              const balance = new BigNumber(await ocean.getBalance(token1.info.address, accountId));
              setToken1({
                ...token1,
                allowance: new BigNumber(res),
                balance,
                value: new BigNumber(0),
              });
            }
          );
          if (token2.info?.pool && token1.info?.address) {
            ocean?.getSharesReceivedForTokenIn(token2.info?.pool, token1.info?.address, '1').then((res) => {
              setPostExchange(new BigNumber(res).dp(5));
            });
          }
        }
      })
      .catch(console.error);
  }

  async function stake(preTxDetails: ITxDetails) {
    if (!token2.info?.pool || !chainId || !ocean || !accountId) return;
    if (!preTxDetails || preTxDetails.txType !== 'stake') return;

    try {
      setLoading(true);
      const txReceipt = await ocean.stakeOcean(accountId, token2.info.pool || '', token1.value?.toString());

      setLastTx({ ...preTxDetails, txReceipt, status: 'Indexing' });
      transactionTypeGA('stake');
      setImportPool(token2.info.pool);
    } catch (error: any) {
      setLastTx({ ...preTxDetails, status: 'Failure' });
      setSnackbarItem({ type: 'error', message: error.error.message, error });
      setConfirmingTx(false);
      setToken1({ ...token1, value: new BigNumber(0) });
      setBlurBG(false);
    } finally {
      setLoading(false);
      setConfirmingTx(false);
      setExecuteStake(false);
      setBlurBG(false);
    }
  }

  async function setMaxStake() {
    if (!token2.info || !ocean) return;
    let maxStake: BigNumber | null;

    if (maxStakeAmt.gt(0)) {
      maxStake = maxStakeAmt;
    } else {
      maxStake = new BigNumber(
        await ocean.getMaxStakeAmount(token2.info.pool || '', ocean.config.default.oceanTokenAddress)
      );
    }
    if (maxStake.isNaN()) {
      setToken1({ ...token1, value: new BigNumber(0) });
    } else {
      if (token1.balance?.lt(maxStake)) {
        setToken1({ ...token1, value: token1.balance });
      } else {
        setToken1({ ...token1, value: maxStake.dp(5).minus(1) });
      }
    }
  }

  async function updateNum(val: string | BigNumber, max?: BigNumber) {
    // initially set state to value to persist the max if the user continuously tries to enter over the max (or balance)
    setToken1({ ...token1, value: new BigNumber(val) });
    if (!val) {
      setToken1({ ...token1, value: new BigNumber(0) });
      return;
    }
    val = new BigNumber(val);

    if (!max) {
      maxStakeAmt.gt(0) ? (max = maxStakeAmt) : (max = await getMaxStakeAmt());
    }

    if (max) {
      if (token1.balance.lt(val)) {
        setToken1({ ...token1, value: token1.balance.dp(5) });
      } else if (max.minus(1).lt(val)) {
        setToken1({ ...token1, value: max.dp(5).minus(1) });
      } else {
        setToken1({ ...token1, value: new BigNumber(val) });
      }
    }

    if (token2.info?.pool && token1.info?.address && val) {
      const sharesReceived = await ocean?.getSharesReceivedForTokenIn(
        token2.info?.pool,
        token1.info?.address,
        val.toString()
      );
      if (sharesReceived) setSharesReceived(new BigNumber(sharesReceived));
    }
  }

  return (
    <>
      <DatasetDescription />
      <div
        className={`absolute w-full max-w-[32rem] top-1/2 left-1/2 transition-transform transform duration-500 ${
          showDescModal && token2.info?.pool ? 'translate-x-full 2lg:translate-x-[10%]' : '-translate-x-1/2'
        } -translate-y-1/2 `}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="lg:mx-auto sm:mx-4 mx-3">
            <div id="stakeModal" className="lg:w-107  bg-black bg-opacity-90 rounded-lg p-3 hm-box">
              <TokenSelect
                max={maxStakeAmt}
                otherToken={'OCEAN'}
                pos={2}
                setToken={setToken2}
                token={token2}
                updateNum={() => {}}
              />
              <div className="px-4 relative mt-6 mb-10">
                <div className="rounded-full border-black border-4 absolute -top-7 bg-trade-darkBlue w-12 h-12 flex items-center justify-center swap-center">
                  {loading ? (
                    <MoonLoader size={25} color={'white'} />
                  ) : (
                    <AiOutlinePlus size="30" className="text-gray-300" />
                  )}
                </div>
              </div>
              <TokenSelect
                max={maxStakeAmt}
                otherToken={''}
                pos={1}
                setToken={setToken1}
                token={token1}
                updateNum={(num: string) => {
                  updateNum(num);
                }}
                onMax={setMaxStake}
              />
              <PositionBox loading={loading} setLoading={setLoading} />
              <button
                id="executeStake"
                onClick={() => setExecuteStake(true)}
                className="txButton mt-3"
                disabled={btnProps.disabled}
              >
                {btnProps.text}
              </button>
            </div>
            <div className=" flex justify-between">
              <ViewDescBtn />
              <Link id="lpLink" to="/stake/list" className="text-gray-300 hover:text-gray-100 transition-colors">
                Your stake positions {'>'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
