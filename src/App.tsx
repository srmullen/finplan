import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AccountDetailView from "./views/AccountDetailView";
import AccountsView from "./views/AccountsView";
import DocsView from "./views/DocsView";
import ProjectionView from "./views/ProjectionView";
import SchedulesView from "./views/SchedulesView";

export default function App() {
	return (
		<BrowserRouter>
			<Toaster position="top-right" richColors />
			<nav>
				<NavLink to="/" end>
					Projection
				</NavLink>
				<NavLink to="/accounts">Accounts</NavLink>
				<NavLink to="/schedules">Schedules</NavLink>
				<NavLink to="/docs">Docs</NavLink>
			</nav>
			<main>
				<Routes>
					<Route path="/" element={<ProjectionView />} />
					<Route path="/accounts" element={<AccountsView />} />
					<Route path="/accounts/:id" element={<AccountDetailView />} />
					<Route path="/schedules" element={<SchedulesView />} />
					<Route path="/docs" element={<DocsView />} />
				</Routes>
			</main>
		</BrowserRouter>
	);
}
