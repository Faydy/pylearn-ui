import { useAuth } from "../../AuthContext";
export default function UserProfile() {
  const {profile, user, loading} = useAuth();
  if(profile)
  return (
    <div className="flex mt-2 items-center gap-3 p-2 rounded-xl hover:bg-[#2c2c2c] transition-colors cursor-pointer">
      <img 
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
        alt="Avatar" 
        className="w-10 h-10 rounded-full bg-gray-800"
      />
      <div className="flex flex-col">
        <span className="text-sm font-semibold black:text-text-main">{profile?.username}</span>
        <span className="text-xs text-gray-400">{user?.email}</span>
      </div>
    </div>
  );
}