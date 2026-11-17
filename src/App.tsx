import { useState } from "react"
import GameScreen from "@/screens/GameScreen"
import HomeScreen from "@/screens/HomeScreen"
import MapScreen from "@/screens/MapScreen"
import SettingsScreen from "@/screens/SettingsScreen"

type Screen = "home" | "game" | "settings" | "map"

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")
  const goHome = () => setScreen("home")

  if (screen === "game") return <GameScreen onHome={goHome} />
  if (screen === "settings") return <SettingsScreen onBack={goHome} />
  if (screen === "map") return <MapScreen onBack={goHome} />
  return (
    <HomeScreen
      onPlay={() => setScreen("game")}
      onSettings={() => setScreen("settings")}
      onProgress={() => setScreen("map")}
    />
  )
}