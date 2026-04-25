import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useStore } from '../store';
import type { IssueCategory } from '../types';

interface AddIssueFormProps {
  coordinates: [number, number, number];
  onClose: () => void;
}

export default function AddIssueForm({ coordinates, onClose }: AddIssueFormProps) {
  const addIssue = useStore(state => state.addIssue);
  const [category, setCategory] = useState<IssueCategory>('Pothole');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIssue({
      category,
      status: 'New',
      coordinates,
      description,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-24 right-6 w-96 bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl z-20 overflow-hidden"
    >
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="text-red-400" /> Report Issue
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Issue Type</label>
          <div className="grid grid-cols-2 gap-3">
            {(['Pothole', 'Garbage', 'Safety', 'Greenery'] as IssueCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  category === cat
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Location Coordinates</label>
          <p className="text-xs font-mono text-slate-500 bg-slate-900/50 p-2 rounded-md">
            x: {coordinates[0].toFixed(2)}, z: {coordinates[2].toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Describe the problem..."
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          Submit Issue
        </button>
      </form>
    </motion.div>
  );
}
