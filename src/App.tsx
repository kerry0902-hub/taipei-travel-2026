/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  Map,
  RefreshCw, 
  Plus, 
  MapPin, 
  Share2, 
  Hotel,
  Plane,
  CloudSun,
  ChevronRight,
  Trash2,
  Search,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import firebaseConfig from '../firebase-applet-config.json';
import { ItineraryItem, ExpenseItem, TripInfo, FlightInfo } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// --- Components ---

const WeatherWidget = () => {
  const temp = 24.0;
  const advice = temp > 22 ? "氣溫舒適，建議短袖配薄外套。" : "天氣偏涼，建議穿著長袖。";

  return (
    <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-6 text-white shadow-lg mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-blue-100 text-sm font-medium">台北今日天氣</p>
          <div className="flex items-center gap-2">
            <CloudSun className="w-6 h-6" />
            <span className="text-3xl font-bold">{temp}°C</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-100 opacity-80 uppercase tracking-wider">Taipei, TW</p>
        </div>
      </div>
      <div className="h-px bg-white/20 my-4" />
      <p className="text-sm flex items-center gap-2">
        <span>👕</span> 穿搭建議：{advice}
      </p>
    </div>
  );
};

const PageHeader = ({ title }: { title: string }) => (
  <header className="px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between border-b border-gray-100">
    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
  </header>
);

// --- Main Pages ---

const HomePage = ({ 
  itinerary, 
  expenses, 
  tripInfo,
  flightInfo,
  onNavigate 
}: { 
  itinerary: ItineraryItem[], 
  expenses: ExpenseItem[],
  tripInfo: TripInfo | null,
  flightInfo: FlightInfo | null,
  onNavigate: (tab: string) => void
}) => {
  const totalTwd = expenses.reduce((sum, item) => sum + item.twd, 0);
  const totalHkd = totalTwd * 0.24;

  return (
    <div className="p-6 pb-24 space-y-8">
      <WeatherWidget />

      {/* Flight Preview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">航班資訊</h2>
          <button 
            onClick={() => onNavigate('sync')}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1"
          >
            編輯 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div 
          onClick={() => onNavigate('sync')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-200 transition-colors"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800">{flightInfo?.flightNumber || '未設定航班'}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">起飛 {flightInfo?.departureTime || '--:--'}</span>
              <div className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">抵達 {flightInfo?.arrivalTime || '--:--'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Preview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">住宿資訊</h2>
          <button 
            onClick={() => onNavigate('sync')}
            className="text-xs font-bold text-blue-600 flex items-center gap-1"
          >
            編輯 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div 
          onClick={() => onNavigate('sync')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Hotel className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800">{tripInfo?.hotelName || '未設定飯店'}</h3>
            <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{tripInfo?.hotelAddress || '點擊設定地址'}</p>
          </div>
        </div>
      </section>
      
      {/* Today's Itinerary Preview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">今日重點行程</h2>
          <button 
            onClick={() => onNavigate('calendar')}
            className="text-xs font-bold text-blue-600 flex items-center gap-1"
          >
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-3">
          {itinerary.slice(0, 2).map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onNavigate('calendar')}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors"
            >
              <div className="text-sm font-bold text-blue-600 w-12">{item.time}</div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                {item.category}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Expenses Preview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">開支摘要</h2>
          <button 
            onClick={() => onNavigate('expense')}
            className="text-xs font-bold text-indigo-600 flex items-center gap-1"
          >
            記帳 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 flex justify-between items-center">
          <div>
            <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest mb-1">目前總支出</p>
            <h3 className="text-2xl font-black">HKD ${totalHkd.toFixed(1)}</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Shopping & Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <section 
          onClick={() => onNavigate('map')}
          className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 cursor-pointer hover:border-blue-200 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Map className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">即時地圖</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">點擊查看</p>
          </div>
        </section>

        <section 
          onClick={() => onNavigate('sync')}
          className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 cursor-pointer hover:border-green-200 transition-colors"
        >
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Hotel className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">住宿資訊</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">台北晶華酒店</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const ItineraryPage = ({ 
  itinerary, 
}: { 
  itinerary: ItineraryItem[], 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [formData, setFormData] = useState({
    time: '',
    title: '',
    category: '美食',
    locationUrl: ''
  });

  const handleOpenModal = (item?: ItineraryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        time: item.time,
        title: item.title,
        category: item.category,
        locationUrl: item.locationUrl || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        time: '',
        title: '',
        category: '美食',
        locationUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSearchLocation = async () => {
    if (!formData.title) return;
    setIsSearching(true);
    try {
      // Placeholder for location search
      // const response = await ai.models.generateContent({
      //   model: "gemini-3-flash-preview",
      //   contents: `Find the Google Maps URL for this location in Taipei: ${formData.title}. Return ONLY the URL.`,
      //   config: {
      //     tools: [{ googleMaps: {} }],
      //   },
      // });

      // const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      // const mapsUrl = chunks?.find(c => c.maps?.uri)?.maps?.uri;

      // if (mapsUrl) {
      //   setFormData(prev => ({ ...prev, locationUrl: mapsUrl }));
      // }
      // For demo, set a placeholder URL
      setFormData(prev => ({ ...prev, locationUrl: `https://maps.google.com/maps?q=${encodeURIComponent(formData.title + ' Taipei')}` }));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const itemRef = doc(db, 'itinerary', editingItem.id);
        await updateDoc(itemRef, {
          time: formData.time,
          title: formData.title,
          category: formData.category,
          locationUrl: formData.locationUrl
        });
      } else {
        await addDoc(collection(db, 'itinerary'), {
          time: formData.time,
          title: formData.title,
          category: formData.category,
          locationUrl: formData.locationUrl
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving itinerary:", error);
    }
  };

  const handleDelete = async () => {
    if (editingItem) {
      try {
        await deleteDoc(doc(db, 'itinerary', editingItem.id));
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting itinerary:", error);
      }
    }
  };

  const categories = ['美食', '交通', '景點', '購物', '住宿', '其他'];

  return (
    <div className="p-6 pb-24 relative">
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
        
        <div className="space-y-8">
          {itinerary.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">目前沒有行程</p>
              <p className="text-xs text-gray-400 mt-1">點擊右下角按鈕開始規劃</p>
            </div>
          ) : (
            itinerary.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 relative group"
              >
                <div className="relative z-10">
                  <div className="w-6 h-6 rounded-full bg-white border-4 border-blue-500 shadow-sm group-hover:scale-110 transition-transform" />
                </div>
                <div 
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:border-blue-200 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800">{item.title}</h3>
                      {item.locationUrl && (
                        <a 
                          href={item.locationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded-md"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">{item.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 台北市
                    </p>
                    <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <button 
        onClick={() => handleOpenModal()}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingItem ? '編輯行程' : '新增行程'}</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">行程名稱</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="例如：台北101"
                    />
                    <button 
                      type="button"
                      onClick={handleSearchLocation}
                      disabled={isSearching || !formData.title}
                      className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {formData.locationUrl && (
                  <div className="bg-blue-50 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">已連結 Google Maps</span>
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, locationUrl: '' }))}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">時間</label>
                    <input 
                      type="time" 
                      required
                      value={formData.time}
                      onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">分類</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                    >
                      {editingItem ? '儲存修改' : '確認新增'}
                    </button>
                  </div>
                  {editingItem && (
                    <button 
                      type="button"
                      onClick={handleDelete}
                      className="w-full py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> 刪除此行程
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExpensePage = ({ 
  expenses, 
}: { 
  expenses: ExpenseItem[], 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    item: '',
    twd: '',
    category: '美食'
  });

  const totalTwd = useMemo(() => expenses.reduce((sum, item) => sum + item.twd, 0), [expenses]);
  const totalHkd = totalTwd * 0.24;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((exp) => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.twd;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleOpenModal = (expense?: ExpenseItem) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        item: expense.item,
        twd: expense.twd.toString(),
        category: expense.category
      });
    } else {
      setEditingExpense(null);
      setFormData({
        item: '',
        twd: '',
        category: '美食'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const twdValue = parseFloat(formData.twd) || 0;
    
    try {
      if (editingExpense) {
        const expRef = doc(db, 'expenses', editingExpense.id);
        await updateDoc(expRef, {
          item: formData.item,
          twd: twdValue,
          category: formData.category
        });
      } else {
        await addDoc(collection(db, 'expenses'), {
          item: formData.item,
          twd: twdValue,
          category: formData.category
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const handleDelete = async () => {
    if (editingExpense) {
      try {
        await deleteDoc(doc(db, 'expenses', editingExpense.id));
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }
  };

  const categories = ['美食', '交通', '住宿', '購物', '娛樂', '其他'];

  return (
    <div className="pb-24 relative">
      <div className="bg-indigo-50 p-8 flex justify-between items-center border-b border-indigo-100">
        <div>
          <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">總支出估算</p>
          <h2 className="text-3xl font-black text-indigo-900">
            HKD ${totalHkd.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </h2>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100">
          <CreditCard className="w-6 h-6 text-indigo-600" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Category Summary */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">分類統計 (TWD)</h3>
          <div className="grid grid-cols-2 gap-3">
            {categoryTotals.map(([cat, total]) => (
              <div key={cat} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">{cat}</span>
                <span className="text-sm font-black text-indigo-600">{total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed List */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">支出明細</h3>
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div 
                key={exp.id} 
                onClick={() => handleOpenModal(exp)}
                className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-indigo-100 rounded-full group-hover:bg-indigo-300 transition-colors" />
                  <div>
                    <h3 className="font-bold text-gray-800">{exp.item}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                        {exp.category}
                      </span>
                      <span className="text-xs text-gray-400">TWD {exp.twd}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">≈ ${(exp.twd * 0.24).toFixed(1)}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">HKD</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add Button */}
      <button 
        onClick={() => handleOpenModal()}
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editingExpense ? '編輯支出' : '新增支出'}</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">項目名稱</label>
                  <input 
                    type="text" 
                    required
                    value={formData.item}
                    onChange={e => setFormData(prev => ({ ...prev, item: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="例如：豪大大雞排"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">金額 (TWD)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.twd}
                      onChange={e => setFormData(prev => ({ ...prev, twd: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">分類</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                    >
                      {editingExpense ? '儲存修改' : '確認新增'}
                    </button>
                  </div>
                  {editingExpense && (
                    <button 
                      type="button"
                      onClick={handleDelete}
                      className="w-full py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> 刪除此開支
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MapPage = () => {
  return (
    <div className="h-[calc(100vh-140px)] w-full relative">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        src="https://maps.google.com/maps?q=Taipei&t=&z=13&ie=UTF8&iwloc=&output=embed"
        allowFullScreen
        title="Google Map"
      ></iframe>
      <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">台北即時地圖</h3>
            <p className="text-[10px] text-gray-400">查看周邊景點與交通</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoPage = ({ 
  tripInfo,
  flightInfo 
}: { 
  tripInfo: TripInfo | null,
  flightInfo: FlightInfo | null
}) => {
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  
  const [hotelFormData, setHotelFormData] = useState({
    hotelName: '',
    hotelAddress: ''
  });

  const [flightFormData, setFlightFormData] = useState({
    flightNumber: '',
    departureTime: '',
    arrivalTime: ''
  });

  useEffect(() => {
    if (tripInfo) {
      setHotelFormData({
        hotelName: tripInfo.hotelName,
        hotelAddress: tripInfo.hotelAddress || ''
      });
    }
  }, [tripInfo]);

  useEffect(() => {
    if (flightInfo) {
      setFlightFormData({
        flightNumber: flightInfo.flightNumber,
        departureTime: flightInfo.departureTime,
        arrivalTime: flightInfo.arrivalTime
      });
    }
  }, [flightInfo]);

  const handleHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tripInfo) {
        const infoRef = doc(db, 'trip_info', tripInfo.id);
        await updateDoc(infoRef, {
          hotelName: hotelFormData.hotelName,
          hotelAddress: hotelFormData.hotelAddress
        });
      } else {
        await addDoc(collection(db, 'trip_info'), {
          hotelName: hotelFormData.hotelName,
          hotelAddress: hotelFormData.hotelAddress
        });
      }
      setIsHotelModalOpen(false);
    } catch (error) {
      console.error("Error saving trip info:", error);
    }
  };

  const handleFlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (flightInfo) {
        const flightRef = doc(db, 'flight_info', flightInfo.id);
        await updateDoc(flightRef, {
          flightNumber: flightFormData.flightNumber,
          departureTime: flightFormData.departureTime,
          arrivalTime: flightFormData.arrivalTime
        });
      } else {
        await addDoc(collection(db, 'flight_info'), {
          flightNumber: flightFormData.flightNumber,
          departureTime: flightFormData.departureTime,
          arrivalTime: flightFormData.arrivalTime
        });
      }
      setIsFlightModalOpen(false);
    } catch (error) {
      console.error("Error saving flight info:", error);
    }
  };

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Flight Info Section */}
      <div 
        onClick={() => setIsFlightModalOpen(true)}
        className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-200 transition-colors"
      >
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <Plane className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">航班資訊</h3>
          <p className="text-sm text-gray-500">{flightInfo?.flightNumber || '未設定航班'}</p>
          {flightInfo && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              起飛 {flightInfo.departureTime} · 抵達 {flightInfo.arrivalTime}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>

      {/* Hotel Info Section */}
      <div 
        onClick={() => setIsHotelModalOpen(true)}
        className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors"
      >
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Hotel className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">住宿資訊</h3>
          <p className="text-sm text-gray-500">{tripInfo?.hotelName || '未設定飯店'}</p>
          {tripInfo?.hotelAddress && <p className="text-[10px] text-gray-400 mt-0.5">{tripInfo.hotelAddress}</p>}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>

      <div className="bg-green-50 p-8 rounded-3xl border border-green-100 text-center space-y-3">
        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">共享編碼</p>
        <h2 className="text-2xl font-black text-green-900 tracking-[0.2em]">TPE-SYNC-2026</h2>
        <p className="text-[10px] text-green-600/60">與旅伴同步行程與開支</p>
      </div>

      <div className="pt-8">
        <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-colors">
          <Share2 className="w-5 h-5" />
          分享給旅伴
        </button>
      </div>

      {/* Hotel Edit Modal */}
      <AnimatePresence>
        {isHotelModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHotelModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">編輯住宿資訊</h3>
              </div>
              <form onSubmit={handleHotelSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">飯店名稱</label>
                  <input 
                    type="text" 
                    required
                    value={hotelFormData.hotelName}
                    onChange={e => setHotelFormData(prev => ({ ...prev, hotelName: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="例如：台北晶華酒店"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">飯店地址</label>
                  <input 
                    type="text" 
                    value={hotelFormData.hotelAddress}
                    onChange={e => setHotelFormData(prev => ({ ...prev, hotelAddress: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="例如：中山區中山北路二段39巷3號"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsHotelModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                  >
                    儲存
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flight Edit Modal */}
      <AnimatePresence>
        {isFlightModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFlightModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">編輯航班資訊</h3>
              </div>
              <form onSubmit={handleFlightSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">航班編號</label>
                  <input 
                    type="text" 
                    required
                    value={flightFormData.flightNumber}
                    onChange={e => setFlightFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="例如：BR892"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">起飛時間</label>
                    <input 
                      type="time" 
                      required
                      value={flightFormData.departureTime}
                      onChange={e => setFlightFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">抵達時間</label>
                    <input 
                      type="time" 
                      required
                      value={flightFormData.arrivalTime}
                      onChange={e => setFlightFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsFlightModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                  >
                    儲存
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sync Itinerary
    const itineraryQuery = query(collection(db, 'itinerary'), orderBy('time', 'asc'));
    const unsubscribeItinerary = onSnapshot(itineraryQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItineraryItem[];
      setItinerary(items);
      
      // Seed initial data if empty
      if (items.length === 0 && isLoading) {
        const initialItems = [
          { time: '10:00', title: '抵達桃園機場', category: '交通' },
          { time: '13:00', title: '西門町 阿宗麵線', category: '美食' },
          { time: '15:30', title: '台北101 觀景台', category: '景點' },
          { time: '19:00', title: '寧夏夜市', category: '美食' },
        ];
        initialItems.forEach(item => addDoc(collection(db, 'itinerary'), item));
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Itinerary sync error:", error);
      setIsLoading(false);
    });

    // Sync Expenses
    const unsubscribeExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExpenseItem[];
      setExpenses(items);

      // Seed initial expenses if empty
      if (items.length === 0 && isLoading) {
        const initialExpenses = [
          { item: '悠遊卡增值', twd: 500, category: '交通' },
          { item: '豪大大雞排', twd: 100, category: '美食' },
          { item: '鼎泰豐午餐', twd: 1200, category: '美食' },
          { item: '台北晶華酒店', twd: 4500, category: '住宿' },
          { item: '鳳梨酥伴手禮', twd: 800, category: '購物' },
        ];
        initialExpenses.forEach(exp => addDoc(collection(db, 'expenses'), exp));
      }
    }, (error) => {
      console.error("Expenses sync error:", error);
    });

    // Sync Trip Info
    const unsubscribeTripInfo = onSnapshot(collection(db, 'trip_info'), (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setTripInfo({
          id: doc.id,
          ...doc.data()
        } as TripInfo);
      } else if (isLoading) {
        // Seed initial trip info if empty
        addDoc(collection(db, 'trip_info'), {
          hotelName: '台北晶華酒店 (Regent Taipei)',
          hotelAddress: '中山區中山北路二段39巷3號'
        });
      }
    });

    // Sync Flight Info
    const unsubscribeFlightInfo = onSnapshot(collection(db, 'flight_info'), (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setFlightInfo({
          id: doc.id,
          ...doc.data()
        } as FlightInfo);
      } else if (isLoading) {
        // Seed initial flight info if empty
        addDoc(collection(db, 'flight_info'), {
          flightNumber: 'BR892',
          departureTime: '09:50',
          arrivalTime: '11:45'
        });
      }
    });

    return () => {
      unsubscribeItinerary();
      unsubscribeExpenses();
      unsubscribeTripInfo();
      unsubscribeFlightInfo();
    };
  }, [isLoading]);

  const tabs = [
    { id: 'home', label: '首頁', icon: Home },
    { id: 'calendar', label: '日程', icon: Calendar },
    { id: 'expense', label: '開支', icon: CreditCard },
    { id: 'map', label: '地圖', icon: Map },
    { id: 'sync', label: '同步', icon: RefreshCw },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return (
        <HomePage 
          itinerary={itinerary} 
          expenses={expenses} 
          tripInfo={tripInfo}
          flightInfo={flightInfo}
          onNavigate={setActiveTab} 
        />
      );
      case 'calendar': return (
        <ItineraryPage 
          itinerary={itinerary} 
        />
      );
      case 'expense': return (
        <ExpensePage 
          expenses={expenses} 
        />
      );
      case 'map': return <MapPage />;
      case 'sync': return <InfoPage tripInfo={tripInfo} flightInfo={flightInfo} />;
      default: return (
        <HomePage 
          itinerary={itinerary} 
          expenses={expenses} 
          tripInfo={tripInfo}
          flightInfo={flightInfo}
          onNavigate={setActiveTab} 
        />
      );
    }
  };

  const getTitle = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab?.id === 'home' ? '台北之旅 🇹🇼' : tab?.label || '';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col">
      <PageHeader title={getTitle()} />
      
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-gray-100 px-4 py-2 flex justify-around items-center z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}