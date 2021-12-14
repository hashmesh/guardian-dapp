import Navbar from "./components/Navbar";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Swap from "./components/Swap";
import Stake from "./components/Stake";
import LiquidityPosition from "./components/LiquidityPosition";
import CookiesModal from "./components/CookiesModal";
import RemoveAmount from "./components/RemoveAmount";
import { useEffect, useContext } from "react";
import { initializeGA } from "./context/Analytics";
import UnsupportedNetwork from "./components/UnsupportedNetwork";
import { GlobalContext } from "./context/GlobalState";
import DisclaimerModal from "./components/DisclaimerModal";
import TxHistoryModal from "./components/TxsHistoryModal";
import Footer from "./components/Footer";
import NotificationArea from "./components/NotificationArea";
import usePTxInitializer from "./hooks/usePTxInitializer";
//import "./stars.css"
function App() {
  const { unsupportedNet, showDisclaimer, cookiesAllowed } =
    useContext(GlobalContext);

  document.getElementById("loader");

  usePTxInitializer();

  useEffect(() => {
    if (cookiesAllowed) {
      initializeGA();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookiesAllowed]);

  useEffect(()=>{
    document.getElementById("loadText")?.remove();
    document.getElementById("loadCenter")?.remove();
    document.getElementById("loader")?.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-full relative">
      {/* <div id="stars"></div>
      <div id="stars1"></div>
      <div id="stars2"></div> */}
      {unsupportedNet ? (
        <UnsupportedNetwork />
      ) : (
        <Router>
          <Navbar />
          {showDisclaimer ? (
            <DisclaimerModal />
          ) : (
            <div className="pb-16 md:pt-10 h-full">
              <Route path="/" exact component={Swap} />
              <Route path="/stakeX" exact component={Stake} />
              <Route path="/stakeX/remove" exact component={RemoveAmount} />
              <Route path="/stakeX/list" exact component={LiquidityPosition} />
              {/* <Snackbar text="Approve LINK" onClose={() => {}} /> */}
              {/* <CreatePoolModal /> */}
              {/* <ConfirmModal /> */}
              {/* <TransactionDoneModal show={true} close={() => {}} /> */}
              {/*<LiquidityPosition />*/}
              {/*<RemoveAmount />*/}
              {/* <ConfirmSwapModal /> */}
            </div>
          )}
        </Router>
      )}
      {cookiesAllowed === null ? <CookiesModal /> : null}
      <NotificationArea />
      <TxHistoryModal />
      <Footer />
    </div>
  );
}

export default App;
