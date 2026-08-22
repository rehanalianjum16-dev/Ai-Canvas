"use client";

import React, { useEffect, useState } from 'react';
import { useAuthStore, User } from '../../store/useAuthStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import Link from 'next/link';
import { ShieldAlert, Users, Image as ImageIcon, ArrowLeft, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const { getAllUsers, currentUser } = useAuthStore();
  const { loadProjects } = useCanvasStore();

  const [users, setUsers] = useState<User[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    setUsers(getAllUsers());

    // Count total projects in local storage (mock backend behavior)
    try {
      const stored = localStorage.getItem('ai-canvas-projects');
      if (stored) {
        setTotalProjects(JSON.parse(stored).length);
      }
    } catch (e) { }
  }, [getAllUsers]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <ShieldAlert size={48} className="text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="text-slate-500">You do not have permission to view this page.</p>
          <Link href="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Return to Canvas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Shield size={24} />
              <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            </div>
            <p className="text-slate-500">Manage users and view platform statistics</p>
          </div>
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
            <ArrowLeft size={16} />
            Back to Canvas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <p className="text-3xl font-bold text-slate-800">{users.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <ImageIcon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Canvases</p>
              <p className="text-3xl font-bold text-slate-800">{totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Registered Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-medium text-slate-500 bg-white">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
