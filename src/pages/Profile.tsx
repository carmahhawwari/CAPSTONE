import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { affirmations } from '@/lib/mock-data';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const sent = affirmations.filter((a) => a.senderId === user?.id).length;
  const received = affirmations.filter((a) => a.receiverId === user?.id).length;

  const handleSignOut = () => {
    signOut();
    navigate('/sign-in');
  };

  return (
    <div className="px-5 pt-14 pb-28 min-h-dvh flex flex-col">
      <h1 className="text-[34px] font-bold text-primary tracking-[-0.02em] leading-none">
        Profile
      </h1>

      {/* User Info */}
      <div className="bg-surface rounded-2xl p-5 mt-6">
        <p className="text-[20px] font-semibold text-primary">{user?.name}</p>
        <p className="text-[15px] text-secondary mt-0.5">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="bg-surface rounded-2xl overflow-hidden mt-4">
        <div className="flex">
          <div className="flex-1 text-center py-5 border-r border-dividers">
            <p className="text-[28px] font-bold text-primary">{sent}</p>
            <p className="text-[13px] text-meta mt-0.5">Sent</p>
          </div>
          <div className="flex-1 text-center py-5">
            <p className="text-[28px] font-bold text-primary">{received}</p>
            <p className="text-[13px] text-meta mt-0.5">Received</p>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="mt-auto">
        <div className="bg-surface rounded-2xl overflow-hidden">
          <button
            onClick={handleSignOut}
            className="w-full py-[14px] text-[17px] text-[#FF3B30] font-normal cursor-pointer bg-transparent border-none hover:bg-hover-fill transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
