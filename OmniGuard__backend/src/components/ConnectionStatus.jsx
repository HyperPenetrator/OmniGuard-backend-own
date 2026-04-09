import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { getConnectionState, onStateChange, WS_STATE } from '../services/ws';

/**
 * Floating connection status indicator.
 * Shows WebSocket state as a compact pill in the bottom-left of the map.
 */
export default function ConnectionStatus() {
  const [state, setState] = useState(getConnectionState());

  useEffect(() => {
    const unsub = onStateChange(setState);
    return unsub;
  }, []);

  const config = {
    [WS_STATE.CONNECTED]: {
      icon: <Wifi size={12} />,
      text: 'LIVE',
      classes: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      dot: 'bg-emerald-400',
    },
    [WS_STATE.CONNECTING]: {
      icon: <Loader2 size={12} className="animate-spin" />,
      text: 'CONNECTING',
      classes: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      dot: 'bg-amber-400',
    },
    [WS_STATE.RECONNECTING]: {
      icon: <Loader2 size={12} className="animate-spin" />,
      text: 'RECONNECTING',
      classes: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      dot: 'bg-amber-400 animate-pulse',
    },
    [WS_STATE.DISCONNECTED]: {
      icon: <WifiOff size={12} />,
      text: 'OFFLINE',
      classes: 'text-red-400 border-red-500/30 bg-red-500/10',
      dot: 'bg-red-400',
    },
  };

  const c = config[state] || config[WS_STATE.DISCONNECTED];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-bold font-mono tracking-widest ${c.classes}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.icon}
      {c.text}
    </div>
  );
}
