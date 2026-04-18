import React from 'react';
import ReportEmergency from './ReportEmergency';
import { ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CivilianSOS({ token }) {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/status');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 px-6">
      <div className="max-w-4xl w-full">
         <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-[2.5rem] shadow-2xl shadow-emerald-500/30 mb-6 rotate-3">
               <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">EMERGENCY_SOS_LINK</h1>
            <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
              Automated high-priority routing is active. Your report will be immediately dispatched to the nearest tactical response unit.
            </p>
         </div>

         <div className="bg-white border-2 border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600"></div>
            <ReportEmergency token={token} onSuccess={handleSuccess} />
         </div>

         <div className="mt-10 flex items-center justify-center gap-6 px-10 text-slate-400">
            <div className="flex items-center gap-2">
               <Info size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">GPS_LATENCY: 1.2ms</span>
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">SIGNAL_STRENGTH: OPTIMAL</span>
            </div>
         </div>
      </div>
    </div>
  );
}
