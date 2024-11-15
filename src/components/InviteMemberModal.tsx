import React, { useState } from 'react';

interface InviteMemberModalProps {
  onClose: () => void;
  onInvite: (email: string) => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onInvite(email);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 relative">
        <h2 className="text-xl font-bold mb-4">Invite Member</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full p-2 border rounded mb-4"
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6985c0] text-white rounded hover:bg-[#5874af] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal; 