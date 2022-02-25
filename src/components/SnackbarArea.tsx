import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../context/GlobalState";
import { ITxDetails } from "../utils/types";
import SnackbarItem from "./SnackbarItem";
import UserMessage from "./UserMessage";

export default function SnackbarArea() {
  const { notifications } = useContext(GlobalContext);
  const [currentNot, setCurrentNot] = useState<any>(null);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setCurrentNot(notifications[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications?.length]);

  if (!currentNot) return null;
  return (
    <div className={`max-w-xs fixed right-2 top-16 md:right-8 w-full`}>
      {currentNot.type === "tx" ? (
        <SnackbarItem tx={currentNot.newTx as ITxDetails} setCurrentNot={setCurrentNot} />
      ) : (
        <UserMessage
          message={currentNot.alert}
          pulse={false}
          timeout={{ time: 5000, showState: setCurrentNot }}
          container={false}
        />
      )}
    </div>
  );
}
