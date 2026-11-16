import { useState } from "react"
import GameScreen from "@/screens/GameScreen"
import HomeScreen from "@/screens/HomeScreen"
import SettingsScreen from "@/screens/SettingsScreen"

type Screen = "home" | "game" | "settings"

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")

  if (screen === "game") return <GameScreen onHome={() => setScreen("home")} />
  if (screen === "settings") return <SettingsScreen onBack={() => setScreen("home")} />
  return (
    <HomeScreen
      onPlay={() => setScreen("game")}
      onSettings={() => setScreen("settings")}
    />
  )
}