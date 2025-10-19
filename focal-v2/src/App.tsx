import { Route, HashRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Debug from "./components/Debug";
import Garden from "./components/Garden";
import Overlay from "./components/Overlay";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Dashboard />} />
				<Route path="/overlay" element={<Overlay />} />
				<Route path="/garden" element={<Garden />} />
				<Route path="/debug" element={<Debug />} />
			</Routes>
		</Router>
	);
}

export default App;
