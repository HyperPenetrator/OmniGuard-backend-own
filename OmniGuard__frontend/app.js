import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const appState = {
    currentView: 'A',
    map: null,
    isEmergencyActive: true,
    userRole: 'Crisis Coordinator',
    geminiApiKey: localStorage.getItem('GEMINI_API_KEY') || '',
    soundEnabled: false,
    audioCtx: null,
    incidents: [
        { id: 'INC-402', type: 'Medical Emergency', location: 'Resort Gym', status: 'En Route', severity: 'High', reported: '4m ago' },
        { id: 'INC-403', type: 'Security Breach', location: 'Perimeter Gate 2', status: 'Monitoring', severity: 'Medium', reported: '12m ago' },
        { id: 'INC-401', type: 'Small Fire', location: 'Kitchen Annex', status: 'Resolved', severity: 'Critical', reported: '1h ago' }
    ]
};

// --- DOM References ---
const mainContent = document.getElementById('mainContent');
const userProfileBtn = document.getElementById('userProfileBtn');
const profileDropdown = document.getElementById('profileDropdown');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initRealtimeMonitoring();
    renderView(appState.currentView);
});

/**
 * Simulates real-time Firestore sync with Gemini triage feedback
 */
function initRealtimeMonitoring() {
    console.log("[OMNIGUARD] Initializing Real-time Tactical Feed...");
    
    setTimeout(() => {
        const newIncident = {
            id: 'INC-405',
            type: 'Fire Alarm',
            location: 'Sector West: Laundry',
            status: 'Triaged (AI)',
            severity: 'High',
            reported: 'Just now',
            tacticalSummary: 'Sensors detected high heat in industrial dryer area.',
            dispatchAdvice: 'Evacuate non-essential personnel; Dispatch Fire Team A.'
        };
        appState.incidents.unshift(newIncident);
        if (appState.currentView === 'A' || appState.currentView === 'D') {
            renderView(appState.currentView);
        }
    }, 8000);
}

// --- View Rendering Logic ---
function renderView(viewId) {
    appState.currentView = viewId;
    if (!mainContent) return;
    
    // Play Tactile Audio Feedback
    if (appState.soundEnabled) playTactileClick();

    // Physical Transition Logic
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(12px) scale(0.98)';
    
    setTimeout(() => {
        mainContent.innerHTML = ''; // Clear previous view
        
        // Update active dropdown item
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewId);
        });

        switch(viewId) {
            case 'A': renderOverview(); break;
            case 'B': renderReporter(); break;
            case 'C': renderFieldResponder(); break;
            case 'D': renderCommandCenter(); setupMap(); break;
        }
        
        // Trigger exit animation
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'translateY(0) scale(1)';
        
        // Always refresh icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 150);
}

// --- View A: Main Overview (Coordinator Core) ---
function renderOverview() {
    mainContent.innerHTML = `
        <div class="overview-grid">
            <!-- Strategic Alert Status Card (Disciplined UI) -->
            <div class="card" style="border-left: 4px solid var(--sos-vivid-rose); display: flex; align-items: center; justify-content: space-between; gap: var(--sp-xl);">
                <div style="display: flex; align-items: center; gap: var(--sp-lg);">
                    <div class="status-indicator">
                        <div class="pulse-ring"></div>
                        <i data-lucide="radio" style="width: 20px; height: 20px; color: white;"></i>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 800; color: var(--sos-vivid-rose); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px;">System Status: ACTIVE</div>
                        <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Crisis Dispatching In Progress</h2>
                        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Personnel synchronized across 4 sectors. Latency: 42ms.</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; color: var(--text-dim); font-weight: 700;">ACTIVE RESPONDERS</div>
                    <div style="font-size: 24px; font-weight: 800; color: var(--text-primary);">12</div>
                </div>
            </div>

            <!-- Incident Feed Table -->
            <div class="card" style="padding: 0;">
                <div style="padding: var(--sp-lg) var(--sp-xl); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-title" style="margin-bottom: 0;">Tactical Incident Stream</div>
                    <button class="ops-btn" style="width: auto; min-height: auto; padding: 6px 12px; font-size: 11px;">
                        <i data-lucide="download" class="icon-physical" style="width: 14px;"></i> EXPORT PHYSICAL_LOG
                    </button>
                </div>
                <div class="surface-inset" style="margin: var(--sp-md); overflow-x: auto; border: none;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>IDENTIFIER</th>
                                <th>INCIDENT TYPE</th>
                                <th>SECTOR/LOCATION</th>
                                <th>SEVERITY</th>
                                <th>STATUS</th>
                                <th>TIME</th>
                            </tr>
                        </thead>
                        <tbody id="incidentTableBody">
                            ${appState.incidents.map(inc => `
                            <tr>
                                <td data-label="ID" style="font-family: 'Roboto Mono', monospace; font-size: 11px; font-weight: 800; color: var(--active-crisp-blue);">${inc.id}</td>
                                <td data-label="Type" style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${inc.type}</td>
                                <td data-label="Location" style="color: var(--text-muted); font-size: 13px;">${inc.location}</td>
                                <td data-label="Severity">
                                    <span class="badge ${inc.severity === 'High' ? 'badge-emergency priority-glow-rose' : 'badge-info'}" style="font-size: 10px;">
                                        ${inc.severity.toUpperCase()}
                                    </span>
                                </td>
                                <td data-label="Status">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 6px; height: 6px; border-radius: 50%; background: ${inc.status === 'En Route' ? 'var(--sos-vivid-rose)' : 'var(--success-emerald)'}; box-shadow: 0 0 6px ${inc.status === 'En Route' ? 'var(--sos-vivid-rose)' : 'var(--success-emerald)'};"></div>
                                        <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">${inc.status}</span>
                                    </div>
                                </td>
                                <td data-label="Reported" style="font-size: 11px; color: var(--text-dim); text-align: right; font-weight: 800;">${inc.reported}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// --- View B: Report Emergency (Civilian Response) ---
function renderReporter() {
    mainContent.innerHTML = `
        <div style="max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--sp-xl);">
            <div style="text-align: center;">
                <h1 style="font-size: 26px; font-weight: 900; color: var(--text-primary); margin-bottom: var(--sp-sm); letter-spacing: -0.01em;">Tactical Asset Request</h1>
                <p style="color: var(--text-muted); font-size: 14px; font-weight: 500;">Direct communication established over SECURE_CHANNEL_B.</p>
            </div>

            <!-- Quick Action Priority Grid (Neumorphic) -->
            <div class="reporter-action-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-lg);">
                <button class="action-btn metallic-finish" data-type="medical">
                    <div class="action-icon" style="background: rgba(225, 29, 72, 0.2); color: var(--sos-vivid-rose); box-shadow: inset 0 0 10px rgba(225, 29, 72, 0.4);">
                        <i data-lucide="cross" class="icon-physical"></i>
                    </div>
                    <span>Medical</span>
                </button>
                <button class="action-btn" data-type="fire">
                    <div class="action-icon" style="background: rgba(245, 158, 11, 0.2); color: var(--warning-orange);">
                        <i data-lucide="flame" class="icon-physical"></i>
                    </div>
                    <span>Fire Team</span>
                </button>
                <button class="action-btn" data-type="security">
                    <div class="action-icon" style="background: rgba(59, 130, 246, 0.2); color: var(--active-crisp-blue);">
                        <i data-lucide="shield-check" class="icon-physical"></i>
                    </div>
                    <span>Security</span>
                </button>
            </div>

            <!-- High-Stakes SOS Trigger -->
            <div class="card" style="border: 2px solid var(--sos-vivid-rose); background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(225, 29, 72, 0.05) 100%); text-align: center; padding: var(--sp-xxl) var(--sp-xl);">
                <div style="font-size: 12px; font-weight: 800; color: var(--sos-vivid-rose); letter-spacing: 2px; margin-bottom: var(--sp-lg);">CRITICAL EMERGENCY BROADCAST</div>
                <button id="sosTrigger" class="sos-main-btn">
                    <i data-lucide="alert-octagon" style="width: 32px; height: 32px;"></i>
                    <span>TRIGGER GLOBAL SOS</span>
                </button>
                <p style="margin-top: var(--sp-xl); font-size: 13px; color: var(--text-dim);">Hold button for 3 seconds to confirm. Accidental triggers may be subject to review.</p>
            </div>

            <!-- Geolocation Telemetry (Skeuomorphic Notebook Texture) -->
            <div class="card notebook-texture" style="padding: var(--sp-lg); border-style: solid; border-left: 6px solid var(--text-dim);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-md); padding-left: var(--sp-md);">
                    <div class="card-title" style="margin-bottom: 0;">Operational Logs</div>
                    <div style="font-family: monospace; font-size: 11px; color: var(--success-emerald); font-weight: 800;">LOCATION_LOCK_ACTIVE</div>
                </div>
                <div class="surface-inset" style="margin-left: var(--sp-md); height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: var(--sp-sm);">
                    <i data-lucide="map-pin" class="icon-physical" style="width: 24px; height: 24px; opacity: 0.5;"></i>
                    <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">SECTOR: RESORT_NORTH_ALPHA</div>
                    <div style="font-family: monospace; font-size: 11px; opacity: 0.6;">LAT: 25.1972° N | LONG: 55.2744° E</div>
                </div>
            </div>
        </div>
    `;
    setupSOSLogic();
    setupReportHandlers();
}

function setupReportHandlers() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.onclick = () => performTriage(btn.dataset.type);
    });
}

async function performTriage(type) {
    if (!appState.geminiApiKey) {
        const key = prompt("Please provide your Google AI Studio (Gemini) API Key for crisis triage:");
        if (key) {
            appState.geminiApiKey = key;
            localStorage.setItem('GEMINI_API_KEY', key);
        } else return;
    }

    console.log(`[OMNIGUARD] Initiating Tactical Triage for: ${type.toUpperCase()}`);
    
    // UI Feedback: Loading state
    mainContent.innerHTML = `<div class="card" style="text-align: center; padding: 100px 0;">
        <div class="status-indicator" style="margin: 0 auto 20px;"><div class="pulse-ring"></div><i data-lucide="cpu"></i></div>
        <h2 style="font-weight: 700;">Analyzing Crisis Parameters...</h2>
        <p style="color: var(--text-muted);">Gemini 1.5 Flash is triaging the reporting sector.</p>
    </div>`;
    lucide.createIcons();

    try {
        const genAI = new GoogleGenerativeAI(appState.geminiApiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const promptText = `
            You are the OmniGuard AI Triage Engine.
            Incident Type: ${type}
            Location: North Alpha Sector
            Context: Immediate civilian report from resort grounds.
            
            Return JSON:
            {
                "severity": "High" | "Medium" | "Low",
                "briefSummary": "A very short operational summary",
                "tacticalAdvice": "Immediate instruction for the reporter"
            }
        `;

        const result = await model.generateContent(promptText);
        const triage = JSON.parse(result.response.text());

        // Update Global State
        const newInc = {
            id: `INC-${Math.floor(Math.random()*900)+100}`,
            type: type.toUpperCase(),
            location: 'North Alpha Sector',
            status: 'Dispatching',
            severity: triage.severity,
            reported: 'Just now'
        };
        appState.incidents.unshift(newInc);

        // Success Confirmation UI
        mainContent.innerHTML = `
            <div class="card" style="border-top: 4px solid var(--success-emerald); text-align: center;">
                <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--success-emerald); margin-bottom: 16px;"></i>
                <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Triage Complete</h1>
                <div style="background: var(--bg-deep); padding: 16px; border-radius: 8px; margin: 24px 0; text-align: left;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span class="badge badge-info">SEVERITY: ${triage.severity}</span>
                        <span style="font-family: monospace; font-weight: 700;">${newInc.id}</span>
                    </div>
                    <p style="font-weight: 600; margin-bottom: 4px;">Summary:</p>
                    <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 12px;">${triage.briefSummary}</p>
                    <p style="font-weight: 600; margin-bottom: 4px;">Tactical Advice:</p>
                    <p style="color: var(--success-emerald); font-size: 14px; font-weight: 700;">${triage.tacticalAdvice}</p>
                </div>
                <button onclick="renderView('A')" class="ops-btn" style="background: var(--active-crisp-blue); border: none;">VIEW TACTICAL STREAM</button>
            </div>
        `;
        lucide.createIcons();
    } catch (e) {
        console.error("Triage Error:", e);
        alert("Tactical Analysis Offline. Reporting via basic fallback channel.");
        renderView('A');
    }
}

function setupSOSLogic() {
    const btn = document.getElementById('sosTrigger');
    let timer;
    btn.addEventListener('mousedown', () => {
        btn.classList.add('holding');
        timer = setTimeout(() => {
            alert('ALL HANDS ALERT DISPATCHED. LOCAL AUTHORITIES NOTIFIED.');
            btn.classList.remove('holding');
        }, 3000);
    });
    btn.addEventListener('mouseup', () => {
        clearTimeout(timer);
        btn.classList.remove('holding');
    });
    btn.addEventListener('mouseleave', () => {
        clearTimeout(timer);
        btn.classList.remove('holding');
    });
}

// --- View C: On-Spot Responder (Field Briefing) ---
function renderFieldResponder() {
    mainContent.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--sp-lg);">
            <div class="card" style="border-left: 6px solid var(--sos-vivid-rose); background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(225, 29, 72, 0.03) 100%);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-lg);">
                    <div class="badge badge-emergency priority-glow-rose">PRIORITY_ALPHA</div>
                    <div style="font-family: 'Roboto Mono', monospace; font-weight: 800; color: var(--text-muted); opacity: 0.8;">AUTH_TOK: INC-402</div>
                </div>
                
                <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 4px; color: var(--text-primary);">Medical: Resort Gym</h1>
                <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: var(--sp-xl); font-weight: 500;">Unconscious civilian reported. Sector lockdown enforced. Responder A-01 dispatched with AED.</p>
                
                <div class="surface-inset" style="padding: var(--sp-md); margin-bottom: var(--sp-xl); display: flex; align-items: center; gap: var(--sp-md);">
                    <div class="icon-physical" style="background: var(--bg-surface-light); padding: 12px; border-radius: 12px; box-shadow: var(--glow-outer);">
                        <i data-lucide="navigation" style="color: var(--active-crisp-blue);"></i>
                    </div>
                    <div>
                        <div style="font-size: 10px; font-weight: 800; color: var(--text-dim); text-transform: uppercase;">Tactical Route</div>
                        <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">SECTOR_NORTH -> GYM_ZONE_L1</div>
                    </div>
                </div>

                <!-- Field Operational Controls (Tactile Keys) -->
                <div style="display: grid; gap: var(--sp-md);">
                    <button class="ops-btn metallic-finish">
                        <i data-lucide="truck" class="icon-physical"></i> MARK EN ROUTE
                    </button>
                    <button class="ops-btn metallic-finish">
                        <i data-lucide="radio" class="icon-physical"></i> MARK ON SCENE
                    </button>
                    <button class="ops-btn" style="background: var(--success-emerald); color: white; border: none; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);">
                        <i data-lucide="check-circle" class="icon-physical" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))"></i> RESOLVE INCIDENT
                    </button>
                </div>
            </div>
        </div>
    `;
}

// --- View D: Command Center (Multi-Incident Ops) ---
function renderCommandCenter() {
    mainContent.innerHTML = `
        <div class="command-split">
            <!-- Priority Triage Stack (Recessed Surface) -->
            <div class="card" style="display: flex; flex-direction: column; padding: 0;">
                <div style="padding: var(--sp-lg); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                    <span class="card-title" style="margin-bottom: 0;"><i data-lucide="list-tree"></i> Triage Stack</span>
                    <span class="badge badge-emergency">3 CRITICAL</span>
                </div>
                <div class="surface-inset" style="flex: 1; margin: var(--sp-md); overflow-y: auto; padding: var(--sp-sm); display: flex; flex-direction: column; gap: var(--sp-sm); border: none;">
                    <div class="card active" style="padding: var(--sp-md); cursor: pointer; border-radius: 12px; transform: scale(1.02); transition: 0.2s;">
                        <div style="font-size: 10px; font-weight: 800; color: var(--sos-vivid-rose); letter-spacing: 1px; margin-bottom: 4px;">UNASSIGNED_ALPHA</div>
                        <div style="font-size: 14px; font-weight: 800;">Potential Fire: North Wing</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">90s since detection. Thermal sensors triggered.</div>
                    </div>
                    <div class="card" style="padding: var(--sp-md); cursor: pointer; border-radius: 12px; opacity: 0.6;">
                        <div style="font-size: 10px; font-weight: 800; color: var(--text-dim); margin-bottom: 4px;">MONITORING</div>
                        <div style="font-size: 14px; font-weight: 800;">Security: Entrance C</div>
                    </div>
                </div>
            </div>

            <!-- Operations Map & Resource Allocation -->
            <div style="display: flex; flex-direction: column; gap: var(--sp-xl);">
                <div class="card notebook-texture" style="flex: 1; padding: 0; min-height: 480px; display: flex; flex-direction: column; overflow: hidden;">
                    <div style="padding: var(--sp-lg); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface);">
                        <div class="card-title" style="margin-bottom: 0;"><i data-lucide="map"></i> Tactical Deployment Map</div>
                        <div class="badge badge-info"><i data-lucide="satellite" style="width: 14px;"></i> LIVE_FEED</div>
                    </div>
                    <div id="leafletMap" class="surface-inset" style="flex: 1; margin: var(--sp-md); border: none; border-radius: 12px; z-index: 1;">
                        <!-- Map Inject Target -->
                    </div>
                </div>

                <!-- Tactical Team Breakdown (Pill Grids) -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-xl);">
                    <div class="card metallic-finish" style="border-top: 4px solid var(--sos-vivid-rose); padding: var(--sp-lg);">
                        <div class="card-title">Med-Team</div>
                        <div style="font-size: 32px; font-weight: 900; letter-spacing: -1px;">02</div>
                    </div>
                    <div class="card metallic-finish" style="border-top: 4px solid var(--warning-orange); padding: var(--sp-lg);">
                        <div class="card-title">Fire-Team</div>
                        <div style="font-size: 32px; font-weight: 900; letter-spacing: -1px;">00</div>
                    </div>
                    <div class="card metallic-finish" style="border-top: 4px solid var(--active-crisp-blue); padding: var(--sp-lg);">
                        <div class="card-title">Safe-Team</div>
                        <div style="font-size: 32px; font-weight: 900; letter-spacing: -1px;">01</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Menu Interaction ---
userProfileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
});

document.addEventListener('click', () => {
    profileDropdown.classList.remove('active');
});

// Dropdown item clicks
profileDropdown.addEventListener('click', (e) => {
    const btn = e.target.closest('.dropdown-item');
    if (btn) {
        renderView(btn.dataset.view);
    }
});

// --- Tactical Geospatial Logic ---
function setupMap() {
    setTimeout(() => {
        const mapContainer = document.getElementById('leafletMap');
        if (!mapContainer || typeof L === 'undefined') return;

        // Cleanup existing map
        if (appState.map) {
            try { appState.map.remove(); } catch(e) {}
            appState.map = null;
        }

        // Initialize Resort Alpha Coordinates (Tropical Setting)
        const resortCoords = [25.1972, 55.2744]; // Example Lat/Long
        appState.map = L.map('leafletMap', {
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false
        }).setView(resortCoords, 17);

        // Dark Matter Tiles (Sleek Tactical Aesthetic)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(appState.map);

        // Incident Markers (Severity Color Mapping)
        const severityColors = {
            'High': 'var(--sos-vivid-rose)',
            'Critical': 'var(--sos-vivid-rose)',
            'Medium': 'var(--warning-orange)',
            'Low': 'var(--active-crisp-blue)'
        };

        appState.incidents.forEach(inc => {
            // Offsetting markers slightly for visual separation
            const jitter = (Math.random() - 0.5) * 0.001; 
            const marker = L.circleMarker([resortCoords[0] + jitter, resortCoords[1] + jitter], {
                radius: 10,
                fillColor: severityColors[inc.severity] || '#3b82f6',
                color: 'rgba(255,255,255,0.8)',
                weight: 2,
                fillOpacity: 0.9
            }).addTo(appState.map);

            marker.bindPopup(`
                <div style="font-family: 'Inter', sans-serif; color: #020617; padding: 4px; min-width: 120px;">
                    <div style="font-size: 10px; font-weight: 800; opacity: 0.5; letter-spacing: 0.05em;">${inc.id}</div>
                    <div style="font-weight: 800; font-size: 15px; margin: 2px 0;">${inc.type}</div>
                    <div style="font-size: 12px; font-weight: 500; color: #475569;">${inc.location}</div>
                </div>
            `);
        });
    }, 100);
}

// --- Tactile Audio Synthesis (Web Audio API) ---
function playTactileClick() {
    if (!appState.soundEnabled || !appState.audioCtx) return;
    const osc = appState.audioCtx.createOscillator();
    const gain = appState.audioCtx.createGain();
    
    // Low mechanical 'snap' (Frequency-decay burst)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, appState.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, appState.audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.15, appState.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, appState.audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(appState.audioCtx.destination);
    
    osc.start();
    osc.stop(appState.audioCtx.currentTime + 0.05);
}

function playAlertPulse() {
    if (!appState.soundEnabled || !appState.audioCtx) return;
    const osc = appState.audioCtx.createOscillator();
    const gain = appState.audioCtx.createGain();
    
    // Sonar Alert Pulse (Slow fade)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, appState.audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.05, appState.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, appState.audioCtx.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(appState.audioCtx.destination);
    
    osc.start();
    osc.stop(appState.audioCtx.currentTime + 0.8);
}

const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.getElementById('soundIcon');

if (soundToggle) {
    soundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Initialize Audio Context on first click (Browser Policy)
        if (!appState.audioCtx) {
            appState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        appState.soundEnabled = !appState.soundEnabled;
        soundIcon.setAttribute('data-lucide', appState.soundEnabled ? 'volume-2' : 'volume-x');
        soundToggle.style.color = appState.soundEnabled ? 'var(--active-crisp-blue)' : 'var(--text-dim)';
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (appState.soundEnabled) playTactileClick();
    });
}
