import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import PermissionRoute from './components/PermissionRoute'
import IdleWarningModal from './components/IdleWarningModal'
import { useSessionSecurity } from './hooks/useSessionSecurity'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Clients from './pages/Clients'
import Suppliers from './pages/Suppliers'
import Technicians from './pages/Technicians'
import Birthdays from './pages/Birthdays'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Stock from './pages/Stock'
import Equipment from './pages/Equipment'
import AdminPanel from './pages/AdminPanel'
import UserManagement from './pages/UserManagement'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import Commercial from './pages/Commercial'
import Administrative from './pages/Administrative'
import BI from './pages/BI'
import HRMS from './pages/HRMS'
import CMMS from './pages/CMMS'
import PLM from './pages/PLM'
import ContractManagement from './pages/ContractManagement'
import ConstructionBudget from './pages/ConstructionBudget'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />
}

/**
 * Wrapper que activa el hook de seguridad de sesión y renderiza el modal de advertencia.
 */
function SecuredLayout() {
  const { logout } = useAuthStore()
  const security = useSessionSecurity()

  return (
    <>
      <Layout />
      <IdleWarningModal
        isOpen={security.showIdleWarning}
        minutesRemaining={security.minutesUntilIdle}
        onExtend={security.extendSession}
        onLogout={logout}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><SecuredLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />

          {/* Tickets: accesible por todos los roles autenticados */}
          <Route path="tickets" element={<PermissionRoute module="tickets"><Tickets /></PermissionRoute>} />
          <Route path="tickets/:id" element={<PermissionRoute module="tickets"><TicketDetail /></PermissionRoute>} />

          {/* Clientes/Proveedores/Técnicos: solo admin y usuarios con permiso */}
          <Route path="clients" element={<PermissionRoute allowedUserTypes={['admin', 'technician']}><Clients /></PermissionRoute>} />
          <Route path="suppliers" element={<PermissionRoute allowedUserTypes={['admin', 'technician']}><Suppliers /></PermissionRoute>} />
          <Route path="technicians" element={<PermissionRoute allowedUserTypes={['admin']}><Technicians /></PermissionRoute>} />

          {/* Módulos generales: autenticado basta */}
          <Route path="birthdays" element={<Birthdays />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Inventario / equipos */}
          <Route path="stock" element={<PermissionRoute module="stock"><Stock /></PermissionRoute>} />
          <Route path="equipment" element={<PermissionRoute allowedUserTypes={['admin', 'technician']}><Equipment /></PermissionRoute>} />

          {/* Administración de sistema: solo admin */}
          <Route path="admin" element={<PermissionRoute allowedUserTypes={['admin']} permission="system.view"><AdminPanel /></PermissionRoute>} />
          <Route path="users" element={<PermissionRoute allowedUserTypes={['admin']} permission="users.view"><UserManagement /></PermissionRoute>} />

          {/* RRHH */}
          <Route path="attendance" element={<PermissionRoute module="attendance"><Attendance /></PermissionRoute>} />
          <Route path="employees" element={<PermissionRoute module="employees"><Employees /></PermissionRoute>} />
          <Route path="hrms" element={<PermissionRoute module="hrms"><HRMS /></PermissionRoute>} />

          {/* Módulos ERP / BI */}
          <Route path="commercial" element={<PermissionRoute module="commercial"><Commercial /></PermissionRoute>} />
          <Route path="administrative" element={<PermissionRoute module="administrative"><Administrative /></PermissionRoute>} />
          <Route path="bi" element={<PermissionRoute module="bi"><BI /></PermissionRoute>} />
          <Route path="cmms" element={<PermissionRoute module="cmms"><CMMS /></PermissionRoute>} />
          <Route path="plm" element={<PermissionRoute module="plm"><PLM /></PermissionRoute>} />
          <Route path="contracts" element={<PermissionRoute allowedUserTypes={['admin']}><ContractManagement /></PermissionRoute>} />
          <Route path="construction-budgets" element={<PermissionRoute allowedUserTypes={['admin']}><ConstructionBudget /></PermissionRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
