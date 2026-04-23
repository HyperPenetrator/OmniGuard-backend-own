import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Navigation, LayoutDashboard } from 'lucide-react'
import CivilianSOS from './pages/CivilianSOS'
import CivilianStatus from './pages/CivilianStatus'
import ResponderIncidents from './pages/ResponderIncidents'
import ResponderNavigation from './pages/ResponderNavigation'
import AdminDashboard from './pages/AdminDashboard'
import ActiveThreats from './pages/ActiveThreats'
import CommanderCenter from './pages/CommanderCenter'
import MapView from './pages/MapView'
import TacticalDashboard from './pages/TacticalDashboard'
import TeamDashboard from './pages/TeamDashboard'
import CivilianPortal from './pages/CivilianPortal'
import PublicReport from './pages/PublicReport'
import ErrorBoundary from './components/ErrorBoundary'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

import { getIncidents, closeIncident, updateIncidentStatus as apiUpdateStatus, WS_BASE, createIncident } from './services/api';
import { wsService } from './services/wsService';
import { App as CapApp } from '@capacitor/app';
import { BackgroundTask } from '@capawesome/capacitor-background-task';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('omni_user');
    return saved ? JSON.parse(saved) : null;
  })
  const [incidents, setIncidents] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024)
  const [userLocation, setUserLocation] = useState(null);
  const [gpsPermission, setGpsPermission] = useState('prompt'); // prompt, granted, denied

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('omni_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('omni_user');
    localStorage.clear();
    sessionStorage.clear();
  };

  // Background Task & App State Management
  useEffect(() => {
    const stateListener = CapApp.addListener('appStateChange', async ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
      if (!isActive) {
        // App is minimized
        const taskId = await BackgroundTask.beforeExit(async () => {
          console.log('Running background task to keep connections alive...');
          // Keep WS alive or perform final sync
          // Note: OS will still eventually kill the process
          BackgroundTask.finish({ taskId });
        });
      } else {
        // App is foregrounded
        wsService.connect(); // Ensure reconnected
      }
    });

    return () => {
      stateListener.then(l => l.remove());
    };
  }, []);

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

    // Initial GPS check
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setGpsPermission(result.state);
        result.onchange = () => setGpsPermission(result.state);
      });
    }

    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (gpsPermission === 'granted') {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.error('GPS Watch Error', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [gpsPermission]);

  const requestGPS = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPermission('granted');
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        setGpsPermission('denied');
        console.error('GPS Request Error', err);
      }
    );
  };

  useEffect(() => {
    if (!user || !user.token || user.token === 'undefined') {
      if (user?.token === 'undefined') {
        console.warn('Corrupted session detected, clearing...');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleLogout();
      }
      return;
    }

    const loadIncidents = async () => {
      try {
        const data = await getIncidents(user.token);
        setIncidents(data?.items || (Array.isArray(data) ? data : []));
      } catch (err) {
        console.error('Failed to load incidents', err);
        if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
          handleLogout();
        }
      }
    };

    const handleWSMessage = (msg) => {
      const { event: evtName, payload: rawPayload } = msg;
      const isSync = !!rawPayload.incident;
      const incident = isSync ? rawPayload.incident : rawPayload;
      
      if (!incident) return;

      const incidentId = isSync ? incident.id : (rawPayload.incidentId || incident.id);
      if (!incidentId) return;

      if (evtName === 'INCIDENT_CREATED') {
        setIncidents(prev => {
          const cleanPrev = prev.filter(Boolean);
          if (cleanPrev.some(inc => inc.id === incidentId || inc.incidentId === incidentId)) return cleanPrev;
          return [{ id: incidentId, ...incident }, ...cleanPrev];
        });
      } else if (evtName === 'INCIDENT_UPDATED') {
        setIncidents(prev => prev.filter(Boolean).map(inc => inc.id === incidentId || inc.incidentId === incidentId ? { ...inc, ...incident } : inc));
      } else if (evtName === 'TRIAGE_COMPLETE') {
        const triage = rawPayload.triage || incident.triage || {};
        setIncidents(prev => {
          const exists = prev.some(inc => inc.id === incidentId);
          if (exists) {
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
          return [{ id: incidentId, ...incident, ...triage, status: 'Triaged' }, ...prev];
        });
      } else if (evtName === 'INCIDENT_CLOSED' || evtName === 'INCIDENT_DELETED') {
        setIncidents(prev => prev.filter(Boolean).filter(inc => inc.id !== incidentId && inc.incidentId !== incidentId));
      }
    };

    loadIncidents();
    
    wsService.setToken(user.token);
    wsService.connect();
    const removeListener = wsService.addListener(handleWSMessage);

    return () => {
      removeListener();
      wsService.disconnect();
    };
  }, [user]);

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

  // If not logged in, show public portal or login page
  if (!user) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CivilianPortal onLogin={handleLogin} />} />
            <Route path="/report" element={<PublicReport />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    )
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden font-sans relative">
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
            <ErrorBoundary>
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
                  <div className="relative">
                    {user.role === 'responder' && gpsPermission === 'prompt' && (
                      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-md">
                        <motion.div 
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-900 border border-emerald-500/50 p-6 rounded-2xl shadow-2xl shadow-emerald-500/20 backdrop-blur-xl"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                              <Navigation size={24} />
                            </div>
                            <div>
                              <h3 className="font-black text-white text-sm uppercase tracking-widest">Enable Tactical GPS</h3>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Required for optimized routing to incident zones.</p>
                            </div>
                          </div>
                          <button 
                            onClick={requestGPS}
                            className="w-full py-3 bg-emerald-500 text-slate-900 font-black text-xs rounded-xl uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                          >
                            Activate Uplink
                          </button>
                        </motion.div>
                      </div>
                    )}
                    {user.role === 'civilian' ? <CivilianSOS token={user.token} /> :
                    user.role === 'responder' ? <TeamDashboard user={user} incidents={incidents} onUpdateStatus={updateIncidentStatus} userLocation={userLocation} /> :
                    <AdminDashboard user={user} incidents={incidents} onUpdateStatus={updateIncidentStatus} />}
                  </div>
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
                    <AdminDashboard user={user} incidents={incidents} onUpdateStatus={updateIncidentStatus} />
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
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

// Update the root redirect logic if needed (it's inside the "/" route)

export default App
