import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}
import CivilianSOS from './pages/CivilianSOS'
import CivilianStatus from './pages/CivilianStatus'
import ResponderIncidents from './pages/ResponderIncidents'
import ResponderNavigation from './pages/ResponderNavigation'
import CoordinatorDashboard from './pages/CoordinatorDashboard'
import ActiveThreats from './pages/ActiveThreats'
import CommanderCenter from './pages/CommanderCenter'
import MapView from './pages/MapView'
import TacticalDashboard from './pages/TacticalDashboard'

import { getIncidents, closeIncident, updateIncidentStatus as apiUpdateStatus, WS_BASE, createIncident } from './services/api';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('omni_user');
    return saved ? JSON.parse(saved) : null;
  })
  const [incidents, setIncidents] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024)

  const handleQuickSOS = async () => {
    if (!user?.token) return;
    
    // Quick confirmation
    if (!window.confirm("⚠️ TRIGGER EMERGENCY SOS?\nThis will immediately dispatch tactical units to your location.")) {
      return;
    }

    try {
      let locationData = "QUICK_SOS_LOCATION_PENDING";
      
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          locationData = {
            sector: 'GPS_QUICK_SOS',
            coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            address: 'Immediate Response Requested'
          };
        } catch (e) {
          console.warn('Geolocation failed for Quick SOS', e);
        }
      }

      await createIncident({
        type: 'Quick SOS',
        location: locationData,
        description: 'SYSTEM_GENERATED: Critical SOS signal triggered via TopNav Quick SOS button.'
      }, user.token);
      
      alert('🚨 QUICK SOS DISPATCHED! Tactical units notified.');
    } catch (err) {
      console.error('Quick SOS failed', err);
      alert('Failed to send Quick SOS: ' + err.message);
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('Unauthorized access detected, logging out...');
      handleLogout();
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!user || !user.token) return;

    let ws;

    const loadIncidents = async () => {
      try {
        const data = await getIncidents(user.token);
        // Backend returns paginated object { items: [], total: n }
        setIncidents(data?.items || (Array.isArray(data) ? data : []));
      } catch (err) {
        console.error('Failed to load incidents', err);
      }
    };

    const connectWebSocket = () => {
      ws = new WebSocket(`${WS_BASE}?token=${user.token}`);
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { event: evtName, payload: rawPayload } = msg;

          // Normalize payload: extract from firestore-sync wrapper if present
          const isSync = !!rawPayload.incident;
          const incident = isSync ? rawPayload.incident : rawPayload;
          const incidentId = isSync ? incident.id : (rawPayload.incidentId || incident.id);
          const assignedTeam = isSync ? incident.assignedTeam : (rawPayload.triage?.assignedTeam || incident.assignedTeam);

          if (!incidentId) return;

          if (evtName === 'INCIDENT_CREATED') {
            if (user.role === 'responder' && assignedTeam && assignedTeam !== user.assignedTeam) return;
            if (user.role === 'civilian' && incident.reportedBy?.userId !== user.id) return;
            
            setIncidents(prev => {
              // Deduplication check
              if (prev.some(inc => inc.id === incidentId)) return prev;
              return [incident, ...prev];
            });
          } else if (evtName === 'INCIDENT_UPDATED') {
            if (user.role === 'responder' && assignedTeam && assignedTeam !== user.assignedTeam) {
              setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
            } else {
              setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, ...incident } : inc));
            }
          } else if (evtName === 'TRIAGE_COMPLETE') {
            const triage = rawPayload.triage || incident.triage || {};
            
            setIncidents(prev => {
              const exists = prev.some(inc => inc.id === incidentId);
              
              // If it exists, update it
              if (exists) {
                // If it's a responder and now assigned elsewhere, remove it
                if (user.role === 'responder' && triage.assignedTeam && triage.assignedTeam !== user.assignedTeam) {
                  return prev.filter(inc => inc.id !== incidentId);
                }
                
                return prev.map(inc => 
                  inc.id === incidentId ? { 
                    ...inc, 
                    ...incident,
                    severity: triage.severity || incident.severity,
                    assignedTeam: triage.assignedTeam || incident.assignedTeam,
                    triage: triage,
                    status: 'Triaged'
                  } : inc
                );
              }
              
              // If it doesn't exist but is now assigned to this responder, add it
              if (user.role === 'responder' && (triage.assignedTeam === user.assignedTeam || incident.assignedTeam === user.assignedTeam)) {
                return [{ id: incidentId, ...incident, ...triage, status: 'Triaged' }, ...prev];
              }
              
              return prev;
            });
          } else if (evtName === 'INCIDENT_CLOSED' || evtName === 'INCIDENT_DELETED') {
            setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
          }
        } catch(err) {
          console.error('WS Parse Error', err);
        }
      };
      
      ws.onerror = (err) => console.error('WebSocket Error', err);
      ws.onclose = () => {
        console.log('WS disconnected, reconnecting...');
        setTimeout(connectWebSocket, 3000);
      };
    };

    loadIncidents();
    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('omni_user', JSON.stringify(userData));
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('omni_user');
    localStorage.clear();
    sessionStorage.clear();
  }

  const updateIncidentStatus = async (id, newStatus) => {
    try {
      if (newStatus === 'Resolved' || newStatus === 'resolved') {
        // Optimistic update
        setIncidents(prev => prev.filter(inc => inc.id !== id));
        await closeIncident(id, user.token);
      } else {
        // Optimistic update
        setIncidents(prev => prev.map(inc => 
          inc.id === id ? { ...inc, status: newStatus } : inc
        ));
        await apiUpdateStatus(id, newStatus, user.token);
      }
    } catch (err) {
      console.error('Failed to update incident', err);
    }
  }

  // If not logged in, only show Login page
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />
        
        <div className={cn(
          "flex-1 flex flex-col min-w-0 relative h-full transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}>
          <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.01] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
          
          <TopNav 
            user={user} 
            isSidebarOpen={isSidebarOpen} 
            incidents={incidents}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            onQuickSOS={handleQuickSOS}
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Routes>
              {/* Universal Profile Route */}
              <Route path="/profile" element={
                <ProtectedRoute user={user}>
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">👤</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
                    <p className="italic text-emerald-600 font-mono uppercase text-xs mt-1">{user.role} ACCESS</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Role-Based Dashboard Root */}
              <Route path="/" element={
                user.role === 'civilian' ? <CivilianSOS token={user.token} /> :
                user.role === 'responder' ? <ResponderIncidents incidents={incidents} /> :
                <CoordinatorDashboard incidents={incidents} onUpdateStatus={updateIncidentStatus} />
              } />

              {/* Explicit Routes with Protection */}
              <Route path="/sos" element={
                <ProtectedRoute user={user} allowedRoles={['civilian']}>
                  <CivilianSOS token={user.token} />
                </ProtectedRoute>
              } />
              <Route path="/status" element={
                <ProtectedRoute user={user} allowedRoles={['civilian']}>
                  <CivilianStatus user={user} incidents={incidents} />
                </ProtectedRoute>
              } />
              
              <Route path="/incidents" element={
                <ProtectedRoute user={user} allowedRoles={['responder']}>
                  <ResponderIncidents user={user} incidents={incidents} />
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProtectedRoute user={user} allowedRoles={['coordinator']}>
                  <CoordinatorDashboard incidents={incidents} onUpdateStatus={updateIncidentStatus} />
                </ProtectedRoute>
              } />
              
              <Route path="/maps" element={
                <ProtectedRoute user={user} allowedRoles={['coordinator', 'responder']}>
                  {user.role === 'coordinator' ? <MapView incidents={incidents} /> : <ResponderNavigation user={user} incidents={incidents} onUpdateStatus={updateIncidentStatus} />}
                </ProtectedRoute>
              } />

              <Route path="/coordinator" element={
                <ProtectedRoute user={user} allowedRoles={['coordinator']}>
                  <CommanderCenter user={user} incidents={incidents} />
                </ProtectedRoute>
              } />
              <Route path="/alerts" element={
                <ProtectedRoute user={user} allowedRoles={['coordinator']}>
                  <ActiveThreats incidents={incidents} />
                </ProtectedRoute>
              } />

              <Route path="/tactical" element={<TacticalDashboard />} />
              
              {/* Redirect any other match to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

// Update the root redirect logic if needed (it's inside the "/" route)

export default App
