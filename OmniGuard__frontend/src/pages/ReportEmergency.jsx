import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Activity, ShieldAlert, Tent, MapPin, Camera, ChevronRight, ChevronLeft, CheckCircle2, Navigation, Loader2 } from 'lucide-react'
import { createIncident } from '../services/api'

const incidentTypes = [
  { id: 'fire', label: 'Fire', icon: Flame, color: 'bg-rose-100 text-rose-600 border-rose-200' },
  { id: 'medical', label: 'Medical', icon: Activity, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  { id: 'crime', label: 'Crime', icon: ShieldAlert, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'natural', label: 'Natural Disaster', icon: Tent, color: 'bg-amber-100 text-amber-600 border-amber-200' },
]

export default function ReportEmergency({ token, onSuccess }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    description: '',
    photo: null
  })

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps + 1))
  const handleBack = () => setStep(s => Math.max(s - 1, 1))

  React.useEffect(() => {
    if (step === 4 && onSuccess) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 3000); // Redirect after 3 seconds so they can see the confirmation
      return () => clearTimeout(timer);
    }
  }, [step, onSuccess]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full bg-slate-50 md:p-4">
      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Report Emergency</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of {totalSteps}</span>
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

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center md:text-left mb-8">
                <h3 className="text-2xl font-bold text-slate-800">What is the incident?</h3>
                <p className="text-slate-500 mt-2 text-lg">Select the type of emergency you are witnessing.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {incidentTypes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setFormData({ ...formData, type: item.id })
                      handleNext()
                    }}
                    className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all active:scale-95 ${
                      formData.type === item.id 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-white bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-5 rounded-2xl mb-4 ${item.color}`}>
                      <item.icon size={36} />
                    </div>
                    <span className="font-bold text-slate-700 text-lg">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Where is it happening?</h3>
                <p className="text-slate-500 mt-2">Enter the address or use your device's GPS.</p>
              </div>
              
              <div className="bg-white p-4 rounded-3xl border border-slate-200">
                <button 
                  className="w-full py-6 bg-emerald-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                >
                  <Navigation size={24} fill="currentColor" />
                  Use My Current Location
                </button>
                
                <div className="relative my-8 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">Or enter manually</span>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400" size={20} />
                  <textarea 
                    rows={3}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-lg font-medium resize-none"
                    placeholder="Enter street, district, or landmarks..."
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleBack} className="p-5 bg-white border border-slate-200 rounded-2xl text-slate-600 active:scale-95 transition-all">
                  <ChevronLeft size={24} />
                </button>
                <button 
                  disabled={!formData.location}
                  onClick={handleNext} 
                  className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Confirm Location
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Additional Details</h3>
                <p className="text-slate-500 mt-2">Provide any extra info or photos to help responders.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-300 transition-colors cursor-pointer active:scale-95 group">
                  <div className="p-4 bg-slate-50 rounded-full mb-3 group-hover:bg-emerald-50 transition-colors">
                    <Camera size={32} className="group-hover:text-emerald-500" />
                  </div>
                  <span className="font-bold">Add Photos (Optional)</span>
                  <span className="text-[10px] uppercase tracking-wider mt-1">Tap to capture</span>
                </div>

                <div className="bg-white p-2 rounded-3xl border border-slate-200">
                  <textarea 
                    rows={4}
                    className="w-full p-4 bg-transparent border-none focus:ring-0 outline-none text-lg font-medium resize-none"
                    placeholder="Describe the situation (e.g., number of people involved)..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <button onClick={handleBack} className="py-5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold active:scale-95 transition-all">
                  Back
                </button>
                <button 
                  className="py-5 bg-rose-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await createIncident({
                        type: formData.type,
                        location: formData.location,
                        description: formData.description
                      }, token);
                      setStep(4);
                    } catch (err) {
                      console.error('Failed to create incident', err);
                      alert('Failed to send SOS: ' + err.message);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldAlert size={20} />}
                  {isSubmitting ? 'Sending...' : 'Send SOS'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900">SOS DISPATCHED</h3>
                <p className="text-slate-500 mt-3 text-lg font-medium leading-relaxed">
                  Help is on the way to your location. <br/> Responders have been notified of your <strong>{formData.type.toUpperCase()}</strong> report.
                </p>
              </div>
              <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">4 - 7 MINUTES</p>
              </div>
              <button 
                onClick={() => setStep(1)}
                className="text-slate-400 font-bold hover:text-slate-600 underline text-sm"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step < 4 && (
        <p className="p-8 text-center text-xs text-slate-400 italic">
          Your precise location and identity will be shared with emergency services.
        </p>
      )}
    </div>
  )
}
