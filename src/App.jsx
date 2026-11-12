import AppRouter from "./AppRouter";
import SoundToggle from "./components/SoundToggle";
import Companion from "./components/Companion";
import { COMPANION_ON } from "./data/companions";

export default function App() {
  return (
    <>
      <AppRouter />
      <SoundToggle />
      {COMPANION_ON && <Companion />}
    </>
  );
}
