import AppRouter from "./AppRouter";
import SoundToggle from "./components/SoundToggle";
import Companion from "./components/Companion";
import Guide from "./components/Guide";
import AwardPopup from "./components/AwardPopup";
import "./styles/pages/staff.css";

export default function App() {
  return (
    <>
      <AppRouter />
      <SoundToggle />
      <Companion />
      <Guide />
      <AwardPopup />
    </>
  );
}
