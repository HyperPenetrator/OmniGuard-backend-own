import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Activity, ShieldAlert, Tent, MapPin, ChevronRight, ChevronLeft, CheckCircle2, Navigation, Loader2, Shield, Phone } from 'lucide-react';
import { createIncident } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const incidentTypes = [
  { id: 'fire', label: 'Fire', icon: Flame, color: 'bg-rose-100 text-rose-600 border-rose-200' },
  { id: 'medical', label: 'Medical Emergency', icon: Activity, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  { id: 'crime', label: 'Crime / Duress', icon: ShieldAlert, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'natural', label: 'Natural Disaster', icon: Tent, color: 'bg-amber-100 text-amber-600 border-amber-200' },
];

export default function PublicReport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({ type: '', location: '', description: '' });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps + 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your location manually.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          location: {
            sector: 'GPS_LOCATED',
            coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            address: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`
          }
        }));
        setGettingLocation(false);
      },
      (err) => {
        setGettingLocation(false);
        alert('Could not get your location. Please enter it manually.\n\nError: ' + err.message);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Public report — no token, backend should allow unauthenticated civic reports
      await createIncident({
        type: formData.type,
        location: formData.location || 'Location not provided',
        description: formData.description || 'No additional details provided.',
        source: 'public_portal',
      }, null);
      setStep(4);
    } catch (err) {
      console.error('Failed to create incident', err);
      alert('Failed to send SOS: ' + err.message + '\n\nPlease call 112 immediately.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-start transition-colors duration-300">
      {/* Minimal Header */}
      <header className="bg-brand-card/80 backdrop-blur-md border-b border-brand-muted/20 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-brand-muted hover:text-brand-text transition-colors">
          <Shield size={20} className="text-emerald-500" />
          <span className="font-black text-brand-text tracking-tight">OMNIGUARD</span>
        </button>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <a href="tel:112" className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-600 transition-all">
            <Phone size={16} fill="currentColor" />
            Call 112
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {step < 4 && (
          <div className="bg-brand-card p-6 rounded-3xl shadow-sm border border-brand-muted/20 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-brand-text">Report Emergency</h2>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-widest">Step {step} of {totalSteps}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-brand-text">What is the emergency?</h3>
                <p className="text-brand-muted mt-2">Select the type of emergency you are reporting.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {incidentTypes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setFormData(prev => ({ ...prev, type: item.id })); handleNext(); }}
                    className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all active:scale-95 hover:shadow-lg ${
                      formData.type === item.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-brand-muted/20 bg-brand-card hover:border-brand-muted/40'
                    }`}
                  >
                    <div className={`p-5 rounded-2xl mb-4 ${item.color}`}>
                      <item.icon size={36} />
                    </div>
                    <span className="font-bold text-slate-700 text-lg text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Where is it happening?</h3>
                <p className="text-slate-500 mt-2">Share your location or enter an address.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  className="w-full py-6 bg-emerald-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform disabled:opacity-60"
                >
                  {gettingLocation ? <Loader2 size={24} className="animate-spin" /> : <Navigation size={24} fill="currentColor" />}
                  {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                </button>

                {formData.location && typeof formData.location === 'object' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 font-medium text-center">
                    ✓ Location captured: {formData.location.address}
                  </div>
                )}

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                  <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">Or enter manually</span>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400" size={20} />
                  <textarea
                    rows={3}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-lg font-medium resize-none"
                    placeholder="Enter street, district, or landmarks..."
                    value={typeof formData.location === 'string' ? formData.location : (formData.location?.address || '')}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={handleBack} className="p-5 bg-white border border-slate-200 rounded-2xl text-slate-600 active:scale-95 transition-all">
                  <ChevronLeft size={24} />
                </button>
                <button
                  disabled={!formData.location}
                  onClick={handleNext}
                  className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Confirm Location <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Additional Details</h3>
                <p className="text-slate-500 mt-2">Describe what you see to help responders prepare.</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-200">
                <textarea
                  rows={5}
                  className="w-full p-4 bg-transparent border-none focus:ring-0 outline-none text-lg font-medium resize-none"
                  placeholder="E.g., number of people involved, visible injuries, building on fire, suspect description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button onClick={handleBack} className="py-5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold active:scale-95 transition-all">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="py-5 bg-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldAlert size={20} />}
                  {isSubmitting ? 'Sending SOS...' : 'Send SOS Now'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900">SOS DISPATCHED</h3>
                <p className="text-slate-500 mt-3 text-lg font-medium leading-relaxed">
                  Help is on the way. Responders have been notified of your <strong>{formData.type?.toUpperCase()}</strong> report.
                </p>
              </div>
              <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">4 – 7 MINUTES</p>
              </div>
              <div className="flex gap-4 w-full">
                <a href="tel:112" className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm text-center flex items-center justify-center gap-2 hover:bg-rose-600 transition-all">
                  <Phone size={16} fill="currentColor" /> Call 112 Now
                </a>
                <button onClick={() => navigate('/')} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
                  Return Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 4 && (
          <p className="mt-8 text-center text-xs text-slate-400 italic">
            Your location and report will be shared securely with emergency services only.
          </p>
        )}
      </div>
    </div>
  );
}
