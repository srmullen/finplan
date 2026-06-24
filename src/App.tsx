import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProjectionView from './views/ProjectionView'
import AccountsView from './views/AccountsView'
import SchedulesView from './views/SchedulesView'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <nav>
        <NavLink to="/" end>Projection</NavLink>
        <NavLink to="/accounts">Accounts</NavLink>
        <NavLink to="/schedules">Schedules</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<ProjectionView />} />
          <Route path="/accounts" element={<AccountsView />} />
          <Route path="/schedules" element={<SchedulesView />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
