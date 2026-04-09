import React, { useState } from 'react';
import { Plus, X, Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { createIncident } from '../services/api';

/**
 * New Incident Report Form
 * Slide-out panel for creating incidents from the dashboard.
 */
export default function IncidentForm({ onClose, onCreated }) {
  const [type, setType] = useState('');
  const [sector, setSector] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const incidentTypes = [
    'Medical Emergency',
    'Fire Alarm',
    'Security Breach',
    'Severe Flooding',
    'Communication Outage',
    'Structural Damage',
    'Suspicious Activity',
    'Evacuation Required',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await createIncident({
        type,
        location: { sector },
        description: description || undefined,
      });

      if (result.success) {
        onCreated(result.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-charcoal border border-slate-700/50 rounded-3xl p-8 shadow-2xl w-full max-w-md mx-4 relative"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-urgent/10 border border-urgent/30 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-urgent" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Report Incident</h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">AUTO TRIAGE ENABLED</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-urgent/10 border border-urgent/20 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Type */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
            Incident Type
          </label>
          <select
            id="incident-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full py-3 px-4 bg-[#0b1121] border border-slate-700 rounded-xl text-white text-sm appearance-none focus:border-blue-500 focus:outline-none transition cursor-pointer"
          >
            <option value="">Select type...</option>
            {incidentTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
            <MapPin size={10} className="inline mr-1" /> Location / Sector
          </label>
          <input
            id="incident-sector"
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            required
            className="w-full py-3 px-4 bg-[#0b1121] border border-slate-700 rounded-xl text-white text-sm font-mono placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition"
            placeholder="e.g. North Wing, Pool Area, Lobby"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
            Description (Optional)
          </label>
          <textarea
            id="incident-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full py-3 px-4 bg-[#0b1121] border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition resize-none"
            placeholder="Additional context..."
          />
        </div>

        {/* Submit */}
        <button
          id="incident-submit"
          type="submit"
          disabled={loading || !type || !sector}
          className="w-full py-3.5 bg-urgent hover:bg-red-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(239,68,68,0.3)] outline-none"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              PROCESSING...
            </>
          ) : (
            <>
              <Plus size={16} />
              SUBMIT INCIDENT
            </>
          )}
        </button>
      </form>
    </div>
  );
}
