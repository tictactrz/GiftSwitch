import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function JoinGroup() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const formattedCode = code.trim().toUpperCase();
      console.log('Attempting to join with code:', formattedCode);

      // Query the groups table directly
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', formattedCode)
        .single();

      if (groupError || !group) {
        console.error('Group error:', groupError);
        throw new Error('Invalid invite code');
      }

      console.log('Found group:', group);

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user?.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this group');
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user?.id,
          role: 'member'
        });

      if (joinError) {
        console.error('Join error:', joinError);
        throw joinError;
      }

      // Success - navigate to the group
      navigate(`/groups/${group.id}`);
    } catch (error) {
      console.error('Error joining group:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <form onSubmit={handleJoinGroup} className="space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Enter Invite Code
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Enter code"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Group'}
        </button>
      </form>
    </div>
  );
} 