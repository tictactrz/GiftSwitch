import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AcceptInvite() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        console.log('Starting invite acceptance process for ID:', inviteId);

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          throw userError;
        }
        
        if (!user) {
          console.log('No user found, redirecting to login');
          const returnUrl = `/invite/${inviteId}`;
          navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
          return;
        }

        console.log('Current user:', user.id);

        // Get the invite details
        const { data: invite, error: inviteError } = await supabase
          .from('group_invites')
          .select('*, groups(*)')
          .eq('id', inviteId)
          .single();

        if (inviteError) {
          console.error('Error fetching invite:', inviteError);
          throw inviteError;
        }

        if (!invite) {
          throw new Error('Invite not found');
        }

        console.log('Found invite:', invite);

        if (invite.status !== 'pending') {
          throw new Error('This invite has already been used');
        }

        // Check if user is already a member
        const { data: existingMember, error: memberCheckError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', invite.group_id)
          .eq('user_id', user.id)
          .single();

        if (memberCheckError && memberCheckError.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error checking membership:', memberCheckError);
          throw memberCheckError;
        }

        console.log('Existing member check:', existingMember);

        // Update invite status - SIMPLIFIED VERSION
        const { error: updateError } = await supabase
          .from('group_invites')
          .update({ 
            status: 'accepted'
          })
          .eq('id', inviteId);

        if (updateError) {
          console.error('Error updating invite:', updateError);
          throw updateError;
        }

        console.log('Updated invite status to accepted');

        if (existingMember) {
          console.log('User is already a member, redirecting to group');
          navigate(`/groups/${invite.group_id}`);
          return;
        }

        // Add user to group
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: invite.group_id,
            user_id: user.id,
            role: 'member',
            joined_at: new Date().toISOString()
          });

        if (memberError) {
          console.error('Error adding member:', memberError);
          throw memberError;
        }

        console.log('Successfully added user to group');
        navigate(`/groups/${invite.group_id}`);
      } catch (err) {
        console.error('Detailed error in acceptInvite:', err);
        setError(err instanceof Error ? err.message : 'Failed to accept invite');
      } finally {
        setLoading(false);
      }
    };

    acceptInvite();
  }, [inviteId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Processing your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops!</h1>
          <p className="text-gray-700">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => navigate('/groups')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 