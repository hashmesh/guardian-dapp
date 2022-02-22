import { useEffect, useContext } from "react";
import { GlobalContext } from "../context/GlobalState";

export default function PTxManager(id: any) {
  const {
    txHistory,
    pendingTxs,
    setPendingTxs,
    notifications,
    setNotifications,
  } = useContext(GlobalContext);

  useEffect(() => {
    if (txHistory && pendingTxs && setPendingTxs && notifications && setNotifications) {
      const allPending = pendingTxs;
      if (!pendingTxs.includes(id)) {
        //find newest tx
        let newestTx: any;
        if (txHistory) {
          newestTx = txHistory[id];
        }
        if (newestTx) {
          const { status } = txHistory[id];
          if (status === "pending") {
            allPending.push(id);
            setPendingTxs(allPending);
          }
        }
      }
      pendingTxs.forEach((ptx: any) => {
        const record = txHistory[ptx];
        if (!record || record.status !== "pending") {
          if (record) {
            const allNotifications = notifications;
            //@ts-ignore
            allNotifications.push({ type: "tx", newTx: record });
            setNotifications([...allNotifications]);
          }
          const leftPending = allPending.filter((tx: any) => tx !== ptx);
          setPendingTxs(leftPending);
        }
      });
    } else if(setPendingTxs) {
      setPendingTxs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txHistory]);
}
