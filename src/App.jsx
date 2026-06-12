import React, { useState, useMemo, useEffect } from 'react';
import { Car, Fuel, Plus, Trash2, Edit2, Activity, Calendar, Hash, DollarSign, Sparkles, Wrench, TrendingUp, Loader2, Upload, Download, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// --- YOUR Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyC1h9JcKS1rVo5YbaSpdbzcx8SLph-KzCM",
  authDomain: "fuel-mpg-tracker.firebaseapp.com",
  projectId: "fuel-mpg-tracker",
  storageBucket: "fuel-mpg-tracker.firebasestorage.app",
  messagingSenderId: "60966261492",
  appId: "1:60966261492:web:68cb0473a22702097e44a1",
  measurementId: "G-B5E9P6R4XF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);

  // State for vehicles and logs
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState('');
  const [logs, setLogs] = useState([]);

  // UI States
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);

  // Table States
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  
  // Form States
  const [vehicleForm, setVehicleForm] = useState({ year: '', make: '', model: '' });
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    odo: '',
    volume: '',
    unitPrice: '',
    notes: ''
  });

  // --- Initialize Authentication ---
  useEffect(() => {
    signInAnonymously(auth).catch((error) => {
      console.error("Auth failed! Did you enable Anonymous Sign-in in Firebase?", error);
    });
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setDbLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // --- Fetch Data from Firestore ---
  useEffect(() => {
    if (!user || !db) return;

    const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
    const unsubVehicles = onSnapshot(vehiclesRef, (snapshot) => {
      const fetchedVehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehicles(fetchedVehicles);
    }, (error) => console.error("Error fetching vehicles:", error));

    const logsRef = collection(db, 'users', user.uid, 'logs');
    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(fetchedLogs);
    }, (error) => console.error("Error fetching logs:", error));

    return () => {
      unsubVehicles();
      unsubLogs();
    };
  }, [user]);

  // Handle Auto-Selecting a Vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !vehicles.find(v => v.id === activeVehicleId)) {
      setActiveVehicleId(vehicles[0].id);
    } else if (vehicles.length === 0) {
      setActiveVehicleId('');
    }
  }, [vehicles, activeVehicleId]);


  // --- Vehicle Management (Cloud) ---
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!user || !db) return;

    const vId = editingVehicleId || Math.random().toString(36).substr(2, 9);
    const newVehicle = { ...vehicleForm };

    await setDoc(doc(db, 'users', user.uid, 'vehicles', vId), newVehicle);
    
    if (!editingVehicleId) {
      setActiveVehicleId(vId);
    }
    setVehicleForm({ year: '', make: '', model: '' });
    setEditingVehicleId(null);
    setIsAddingVehicle(false);
  };

  const editVehicle = (vehicle) => {
    setVehicleForm({ year: vehicle.year, make: vehicle.make, model: vehicle.model });
    setEditingVehicleId(vehicle.id);
    setIsAddingVehicle(true);
  };

  const deleteVehicle = async (id) => {
    if (!user || !db) return;
    if (window.confirm("Delete this vehicle and all its logs?")) {
      await deleteDoc(doc(db, 'users', user.uid, 'vehicles', id));
      
      const logsToDelete = logs.filter(l => l.vehicleId === id);
      for (const l of logsToDelete) {
        await deleteDoc(doc(db, 'users', user.uid, 'logs', l.id));
      }
    }
  };


  // --- Log Management (Cloud) ---
  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!user || !db || !activeVehicleId) return;

    const newLogId = editingLogId || Math.random().toString(36).substr(2, 9);
    const newLog = {
      vehicleId: activeVehicleId,
      date: logForm.date,
      odo: parseFloat(logForm.odo) || 0,
      volume: parseFloat(logForm.volume) || 0,
      unitPrice: parseFloat(logForm.unitPrice) || 0,
      total: (parseFloat(logForm.volume) || 0) * (parseFloat(logForm.unitPrice) || 0),
      notes: logForm.notes
    };
    
    await setDoc(doc(db, 'users', user.uid, 'logs', newLogId), newLog);
    
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      odo: '',
      volume: '',
      unitPrice: '',
      notes: ''
    });
    setEditingLogId(null);
  };

  const editLog = (log) => {
    setLogForm({
      date: log.date,
      odo: log.odo,
      volume: log.volume,
      unitPrice: log.unitPrice,
      notes: log.notes || ''
    });
    setEditingLogId(log.id);
  };

  const cancelEditLog = () => {
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      odo: '',
      volume: '',
      unitPrice: '',
      notes: ''
    });
    setEditingLogId(null);
  };

  const deleteLog = async (id) => {
    if (!user || !db) return;
    if (window.confirm("Are you sure you want to delete this log?")) {
      await deleteDoc(doc(db, 'users', user.uid, 'logs', id));
      setSelectedLogIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!user || !db || selectedLogIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedLogIds.length} selected logs?`)) {
      for (const id of selectedLogIds) {
        await deleteDoc(doc(db, 'users', user.uid, 'logs', id));
      }
      setSelectedLogIds([]);
    }
  };

  // --- CSV Import Logic ---
  const downloadTemplate = () => {
    const headers = "Date,Odometer,Gallons,PricePerGal,Notes\n";
    const dummyData = "2023-10-01,45000,12.5,3.50,First import log\n";
    const blob = new Blob([headers + dummyData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fuel_tracker_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !db || !activeVehicleId) return;

    setIsImporting(true);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        
        // Skip the header row (index 0)
        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i].split(',');
          
          let date = columns[0] ? columns[0].trim() : '--';
          // Convert mm/dd/yyyy to yyyy-mm-dd
          if (date.includes('/')) {
            const parts = date.split('/');
            if (parts.length === 3) {
              const m = parts[0].padStart(2, '0');
              const d = parts[1].padStart(2, '0');
              // handle 2 digit year if needed, assuming 4 digit here
              const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              date = `${y}-${m}-${d}`;
            }
          }

          const odo = parseFloat(columns[1]) || 0;
          const volume = parseFloat(columns[2]) || 0;
          const unitPrice = parseFloat(columns[3]) || 0;
          const notes = columns[4] ? columns[4].trim() : '';
          const total = volume * unitPrice;

          const newLogId = Math.random().toString(36).substr(2, 9);
          const newLog = {
            vehicleId: activeVehicleId,
            date: date,
            odo: odo,
            volume: volume,
            unitPrice: unitPrice,
            total: total,
            notes: notes
          };

          await setDoc(doc(db, 'users', user.uid, 'logs', newLogId), newLog);
        }
        
        setImportSuccess(true);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccess(false);
        }, 1500);

      } catch (err) {
        console.error("Import failed", err);
      } finally {
        setIsImporting(false);
        e.target.value = null; 
      }
    };
    reader.readAsText(file);
  };


  // --- Derived State (MPG Calculation & Display) ---
  const currentVehicleLogs = useMemo(() => {
    if (!activeVehicleId) return [];
    
    // Calculate distance/MPG in chronological order
    const sortedLogs = [...logs]
      .filter(l => l.vehicleId === activeVehicleId)
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.odo || 0) - (b.odo || 0);
      });

    const logsWithStats = sortedLogs.map((log, index) => {
      if (index === 0 || !log.odo || !log.volume) {
        return { ...log, distance: 0, mpg: null }; 
      }
      const prevLog = sortedLogs[index - 1];
      
      // If the previous log has no odometer, we can't reliably calculate distance
      if (!prevLog.odo) {
        return { ...log, distance: 0, mpg: null };
      }

      const distance = log.odo - prevLog.odo;
      if (distance <= 0) {
        return { ...log, distance, mpg: null };
      }

      const mpg = distance / log.volume; 
      return { ...log, distance, mpg };
    });

    return logsWithStats;
  }, [logs, activeVehicleId]);

  // Sorting
  const displayLogs = useMemo(() => {
    let sortableItems = [...currentVehicleLogs];
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [currentVehicleLogs, sortConfig]);

  // Pagination
  const paginatedLogs = useMemo(() => {
    if (pageSize === 'All') return displayLogs;
    const size = parseInt(pageSize, 10);
    const startIndex = (currentPage - 1) * size;
    return displayLogs.slice(startIndex, startIndex + size);
  }, [displayLogs, currentPage, pageSize]);

  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(displayLogs.length / parseInt(pageSize, 10)));

  // Reset page when switching vehicles or filtering heavily
  useEffect(() => {
    setCurrentPage(1);
    setSelectedLogIds([]);
  }, [activeVehicleId, pageSize, sortConfig]);


  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLogIds(paginatedLogs.map(log => log.id));
    } else {
      setSelectedLogIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId);

  // --- Derived Vehicle Stats ---
  const vehicleStats = useMemo(() => {
    if (!activeVehicleId || !currentVehicleLogs) return { lifetimeMPG: '0.00', bestMPG: '0.00', totalSpent: '0.00' };
    
    let totalDistance = 0;
    let totalVolumeForMPG = 0;
    let bestMPG = 0;
    let totalSpent = 0;

    currentVehicleLogs.forEach(log => {
      totalSpent += log.total || 0;
      if (log.mpg) {
        totalDistance += log.distance;
        totalVolumeForMPG += log.volume;
        if (log.mpg > bestMPG) bestMPG = log.mpg;
      }
    });

    const lifetimeMPG = totalVolumeForMPG > 0 ? (totalDistance / totalVolumeForMPG) : 0;
    
    return {
      lifetimeMPG: lifetimeMPG.toFixed(2),
      bestMPG: bestMPG.toFixed(2),
      totalSpent: totalSpent.toFixed(2)
    };
  }, [currentVehicleLogs, activeVehicleId]);

  const chartData = useMemo(() => {
    if (!currentVehicleLogs) return [];
    return currentVehicleLogs
      .filter(l => l.mpg !== null)
      .map(l => {
        // Prevent timezone shift by appending time
        const d = new Date(l.date + 'T12:00:00'); 
        const formattedDate = !isNaN(d) ? `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}` : l.date;
        return {
          date: formattedDate,
          mpg: parseFloat(l.mpg.toFixed(2))
        };
      });
  }, [currentVehicleLogs]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-blue-400">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8 relative">
      
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md p-6 space-y-6 relative">
            <button 
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              disabled={isImporting}
            >
              <X size={20} />
            </button>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Upload size={20} className="text-blue-400" />
                Import CSV Data
              </h3>
              <p className="text-sm text-slate-400">
                Upload a CSV file to bulk import logs for your <span className="font-semibold text-slate-200">{activeVehicle?.year} {activeVehicle?.make} {activeVehicle?.model}</span>.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 bg-slate-700/50 text-slate-300 border border-slate-600 font-medium py-2.5 rounded-xl hover:bg-slate-700 hover:text-white transition-all"
                disabled={isImporting}
              >
                <Download size={16} /> Download CSV Template
              </button>
              
              <div className="relative w-full">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleCsvUpload}
                  disabled={isImporting}
                  className={`absolute inset-0 w-full h-full opacity-0 ${isImporting ? 'cursor-not-allowed' : 'cursor-pointer'} z-10`}
                />
                <div className={`w-full flex items-center justify-center gap-2 font-medium py-2.5 rounded-xl transition-all border
                  ${importSuccess ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                    isImporting ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 
                    'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500 hover:text-white'}`}>
                  {importSuccess ? (
                    <><Check size={16} /> Import Complete!</>
                  ) : isImporting ? (
                    <><Loader2 size={16} className="animate-spin" /> Importing...</>
                  ) : (
                    <><Upload size={16} /> Select & Upload CSV</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl text-3xl flex items-center justify-center w-14 h-14">
              ⛽
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Fuel & MPG Tracker</h1>
              <p className="text-sm text-slate-400">Because I have OCD</p>
            </div>
          </div>
          
        </header>

        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Vehicle Manager Card */}
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col h-[440px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Car size={20} className="text-blue-400"/> My Garage
              </h2>
              {!isAddingVehicle && (
                <button 
                  onClick={() => setIsAddingVehicle(true)}
                  className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {isAddingVehicle ? (
              <form onSubmit={handleSaveVehicle} className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex-1 overflow-y-auto">
                <input type="number" placeholder="Year" required value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                <input type="text" placeholder="Make" required value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                <input type="text" placeholder="Model" required value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-600 transition-colors">Save</button>
                  <button type="button" onClick={() => { setIsAddingVehicle(false); setEditingVehicleId(null); }} className="flex-1 bg-slate-700 text-white text-sm font-medium py-2 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full">
                {vehicles.map(v => (
                  <div key={v.id} className="flex flex-col mb-2">
                    <div 
                      onClick={() => setActiveVehicleId(v.id)}
                      className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer hover:border-blue-500/50 transition-all ${activeVehicleId === v.id ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-900/50 border-slate-700'}`}
                    >
                      <span className="text-sm font-medium">{v.year} {v.make} {v.model}</span>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); editVehicle(v); }} className="p-1.5 text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteVehicle(v.id); }} className="p-1.5 text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {activeVehicleId === v.id && (
                      <div className="mt-2 p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm space-y-2">
                        <div className="flex justify-between text-slate-400">
                          <span>Lifetime MPG</span> 
                          <span className="text-white font-semibold">{vehicleStats.lifetimeMPG}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Best MPG</span> 
                          <span className="text-blue-400 font-semibold">{vehicleStats.bestMPG}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Total Spent on Gas</span> 
                          <span className="text-green-400 font-semibold">${vehicleStats.totalSpent}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {vehicles.length === 0 && <p className="text-sm text-slate-500 italic">No cars in garage. Add one bro.</p>}
              </div>
            )}
          </div>

          {/* Add Log Card */}
          {activeVehicleId && (
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col h-[440px]">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Fuel size={20} className="text-green-400"/> {editingLogId ? 'Edit Fill-up' : 'Add Fill-up'}
              </h2>
              <form onSubmit={handleAddLog} className="space-y-4 flex flex-col flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" size={16} />
                      <input 
                        type="date" 
                        required 
                        value={logForm.date} 
                        onChange={e => setLogForm({...logForm, date: e.target.value})} 
                        onClick={e => { if (e.target.showPicker) e.target.showPicker(); }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-green-500 outline-none cursor-pointer" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Odometer</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 text-slate-500" size={16} />
                      <input type="number" step="0.1" required value={logForm.odo} onChange={e => setLogForm({...logForm, odo: e.target.value})} placeholder="e.g. 45000" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-green-500 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Gallons</label>
                    <input type="number" step="0.001" required value={logForm.volume} onChange={e => setLogForm({...logForm, volume: e.target.value})} placeholder="e.g. 12.5" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Price/Gal</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 text-slate-500" size={16} />
                      <input type="number" step="0.01" required value={logForm.unitPrice} onChange={e => setLogForm({...logForm, unitPrice: e.target.value})} placeholder="3.50" className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm focus:border-green-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Notes (Optional)</label>
                  <input type="text" value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} placeholder="e.g. Costco, Road Trip..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none" />
                </div>
                
                <div className="mt-auto space-y-4">
                  {logForm.volume && logForm.unitPrice && (
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="text-sm text-slate-400">Total Cost:</span>
                      <span className="font-bold text-green-400">${(logForm.volume * logForm.unitPrice).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-green-500/20 text-green-400 border border-green-500/50 font-semibold py-2.5 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                      {editingLogId ? 'Update Fill-up' : 'Save Fill-up'}
                    </button>
                    {editingLogId && (
                      <button type="button" onClick={cancelEditLog} className="flex-1 bg-slate-700/50 text-slate-300 border border-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-600 transition-all">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Full-width Main Content / Table */}
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              History & Performance {activeVehicle ? `- ${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : ''}
            </h2>
            
            <div className="flex gap-2">
              {selectedLogIds.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} /> Delete Selected ({selectedLogIds.length})
                </button>
              )}
              {activeVehicleId && (
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all"
                >
                  <Upload size={16} /> Import CSV
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="cursor-pointer w-4 h-4 rounded border-slate-600 bg-slate-900 accent-blue-500"
                      checked={paginatedLogs.length > 0 && selectedLogIds.length === paginatedLogs.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('date')}>
                    Date <SortIcon column="date" />
                  </th>
                  <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('odo')}>
                    Odometer <SortIcon column="odo" />
                  </th>
                  <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('volume')}>
                    Gallons <SortIcon column="volume" />
                  </th>
                  <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('total')}>
                    Cost <SortIcon column="total" />
                  </th>
                  <th className="px-6 py-4 font-semibold text-right text-blue-400 cursor-pointer hover:text-blue-300 transition-colors" onClick={() => handleSort('mpg')}>
                    MPG <SortIcon column="mpg" />
                  </th>
                  <th className="px-6 py-4 font-semibold">Notes</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                      No fill-ups found for this page/vehicle.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                         <input 
                          type="checkbox" 
                          className="cursor-pointer w-4 h-4 rounded border-slate-600 bg-slate-900 accent-blue-500"
                          checked={selectedLogIds.includes(log.id)}
                          onChange={() => handleSelectRow(log.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">{log.date || '--'}</td>
                      <td className="px-6 py-4 text-right font-medium">{log.odo > 0 ? log.odo.toLocaleString() : '--'}</td>
                      <td className="px-6 py-4 text-right text-slate-400">{log.volume > 0 ? log.volume.toFixed(3) : '--'}</td>
                      <td className="px-6 py-4 text-right text-green-400">{log.total > 0 ? `$${log.total.toFixed(2)}` : '--'}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-400">
                        {log.mpg ? (
                          <div className="flex flex-col items-end">
                            <span>{log.mpg.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-500 font-normal">+{log.distance.toFixed(1)} mi</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-normal">
                            {log.volume > 0 ? 'N/A' : 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={log.notes}>
                        {log.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => editLog(log)} className="text-slate-500 hover:text-blue-400 transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteLog(log.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select 
                className="bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5 focus:border-blue-500 outline-none"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="All">All</option>
              </select>
              <span>per page</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span>
                Page {pageSize === 'All' ? 1 : currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || pageSize === 'All'}
                  className="p-1.5 rounded-lg border border-slate-600 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || pageSize === 'All'}
                  className="p-1.5 rounded-lg border border-slate-600 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Trend Graph */}
          {chartData.length > 1 && (
            <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden flex flex-col p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <TrendingUp className="text-blue-400" size={20} /> Average MPG Over Time
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMpg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      tickMargin={10} 
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      domain={[0, 'dataMax + 10']}
                      tickCount={6}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="mpg" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMpg)" 
                      name="Average MPG"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}