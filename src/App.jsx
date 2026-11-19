import AppRouter from "./AppRouter";
import SoundToggle from "./components/SoundToggle";
import Companion from "./components/Companion";
import Guide from "./components/Guide";

export default function App() {
  return (
    <>
      <AppRouter />
      <SoundToggle />
      <Companion />
      <Guide />
    </>
  );
}
