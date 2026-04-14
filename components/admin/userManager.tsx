import Y2KCard from "../ui/Y2KCard";
import { UserPlus, Trash2 } from "lucide-react";

const UserManagerTab = () => (
  <Y2KCard title="Node_Operators_Directory" variant="purple">
    <div className="mb-6 flex justify-between items-center">
      <p className="text-[10px] text-gray-500 font-bold uppercase italic tracking-widest">Active System Accounts</p>
      <button className="flex items-center gap-2 bg-[#C4FF4D] text-[#1A1A1A] px-4 py-2 text-[10px] font-black border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#BA8CFF] uppercase active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
        <UserPlus size={14}/> Enroll_New_Node
      </button>
    </div>

    <div className="overflow-x-auto border-2 border-[#4D4D4D]">
      <table className="w-full text-left text-[11px] font-bold">
        <thead className="bg-[#4D4D4D]/20 border-b-2 border-[#4D4D4D]">
          <tr className="uppercase text-[#BA8CFF] italic">
            <th className="p-4">User_Identity</th>
            <th className="p-4">Access_Role</th>
            <th className="p-4">Last_Session</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#4D4D4D]">
          {[
            { id: '1', name: 'KHAFI_DEV', role: 'admin', last: '2024-05-20 14:30' },
            { id: '2', name: 'ALVINO_OP', role: 'operator', last: '2024-05-20 10:15' },
            { id: '3', name: 'FARREL_OP', role: 'operator', last: '2024-05-19 23:45' },
            { id: '4', name: 'ADITYO_OP', role: 'operator', last: 'Offline' },
          ].map((u) => (
            <tr key={u.id} className="hover:bg-[#C4FF4D]/5 transition-colors">
              <td className="p-4 text-[#C4FF4D]">{u.name}</td>
              <td className="p-4"><span className={`px-2 py-0.5 border-2 ${u.role === 'admin' ? 'border-[#BA8CFF] text-[#BA8CFF]' : 'border-gray-500 text-gray-500'} uppercase text-[9px]`}>{u.role}</span></td>
              <td className="p-4 text-gray-400">{u.last}</td>
              <td className="p-4">
                <div className="flex justify-center gap-4">
                  <button className="text-blue-400 hover:underline">Edit</button>
                  <button className="text-red-500 hover:underline flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Y2KCard>
);

export default UserManagerTab;