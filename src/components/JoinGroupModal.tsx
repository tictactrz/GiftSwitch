import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface JoinGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Find the group with the given code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('code', code.toUpperCase())
        .single();

      if (groupError) {
        if (groupError.code === 'PGRST116') {
          throw new Error('Invalid group code. Please check and try again.');
        }
        throw groupError;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: group.id,
            user_id: user?.id,
          },
        ]);

      if (joinError) {
        if (joinError.code === '23505') {
          throw new Error('You are already a member of this group.');
        }
        throw joinError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error joining group:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Join a Group</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-[#ee5e5e] px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-character code"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#6985c0] focus:ring-2 focus:ring-[#6985c0]/20 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#ee5e5e] text-white rounded-lg hover:bg-[#ee5e5e]/90 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal; 