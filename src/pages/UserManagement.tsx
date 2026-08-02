import React, { useEffect, useState } from 'react';
import { 
  AppUser, 
  userService 
} from '../services/userService';
import { useAuth } from '../auth/useAuth';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Shield, 
  UserCheck, 
  UserX, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Calendar,
  Eye,
  EyeOff,
  User
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'user'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Add / Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    role: 'user' as 'admin' | 'user',
    active: true,
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // State for toggling password visibility in table rows
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswordIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Subscribe to real-time users list
  useEffect(() => {
    setLoading(true);
    const unsubscribe = userService.subscribeUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter & Search logic
  const filteredUsers = users.filter((u) => {
    const searchTarget = `${u.username || ''} ${u.displayName || ''} ${u.email || ''}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'active' && u.active) ||
      (statusFilter === 'inactive' && !u.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      displayName: '',
      role: 'user',
      active: true,
    });
    setShowFormPassword(false);
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (targetUser: AppUser) => {
    setEditingUser(targetUser);
    setFormData({
      username: targetUser.username || targetUser.email || '',
      password: '', // Keep blank if unchanged
      displayName: targetUser.displayName || '',
      role: targetUser.role,
      active: targetUser.active,
    });
    setShowFormPassword(false);
    setFormError('');
    setShowAddModal(true);
  };

  // Save (Add or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editingUser) {
      if (!formData.username.trim()) {
        setFormError('Vui lòng nhập tên đăng nhập');
        return;
      }
      if (!formData.password || formData.password.trim().length < 4) {
        setFormError('Mật khẩu phải có ít nhất 4 ký tự');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingUser) {
        const targetId = editingUser.id || editingUser.username || 'admin';
        await userService.updateUser(targetId, {
          displayName: formData.displayName.trim() || undefined,
          role: formData.role,
          active: formData.active,
          password: formData.password.trim() ? formData.password.trim() : undefined,
        });
      } else {
        await userService.addUser({
          username: formData.username.trim(),
          password: formData.password.trim(),
          displayName: formData.displayName.trim(),
          role: formData.role,
          active: formData.active,
        });
      }
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Quick Lock / Unlock
  const handleToggleLock = async (targetUser: AppUser) => {
    const targetId = targetUser.id || targetUser.username || 'admin';
    try {
      await userService.updateUser(targetId, {
        active: !targetUser.active,
      });
    } catch (err: any) {
      alert('Không thể thay đổi trạng thái tài khoản: ' + err.message);
    }
  };

  // Toggle Quick Role Switch (Admin <-> User)
  const handleToggleRole = async (targetUser: AppUser) => {
    if (currentUser?.username === targetUser.username) {
      if (!confirm('Bạn có chắc muốn tự đổi vai trò của tài khoản hiện tại không?')) return;
    }
    const targetId = targetUser.id || targetUser.username || 'admin';
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await userService.updateUser(targetId, {
        role: newRole,
      });
    } catch (err: any) {
      alert('Không thể đổi vai trò: ' + err.message);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const targetId = deletingUser.id || deletingUser.username || 'admin';
      await userService.deleteUser(targetId);
      setDeletingUser(null);
    } catch (err: any) {
      alert('Không thể xóa tài khoản: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">
              Quản Lý Tài Khoản Người Dùng
            </h2>
            <span className="text-xs bg-indigo-950 text-indigo-300 font-extrabold px-2.5 py-1 rounded-full border border-indigo-800">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cấp tên đăng nhập và mật khẩu cho giáo viên, phân quyền Admin/User và bật/tắt quyền truy cập ứng dụng.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Tài Khoản Mới</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên đăng nhập hoặc Họ tên..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 dark:bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 py-1.5">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 font-medium shrink-0">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-transparent text-xs text-slate-200 font-bold focus:outline-hidden w-full cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-slate-200">Tất cả vai trò</option>
            <option value="admin" className="bg-slate-900 text-slate-200">Quản trị viên (Admin)</option>
            <option value="user" className="bg-slate-900 text-slate-200">Người dùng (User)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 py-1.5">
          <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 font-medium shrink-0">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-transparent text-xs text-slate-200 font-bold focus:outline-hidden w-full cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-slate-200">Tất cả trạng thái</option>
            <option value="active" className="bg-slate-900 text-slate-200">Đang hoạt động (Active)</option>
            <option value="inactive" className="bg-slate-900 text-slate-200">Đã khóa / Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Đang tải danh sách tài khoản từ Firestore...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <UserX className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-400">Không tìm thấy tài khoản phù hợp</p>
            <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc bấm "Thêm Tài Khoản Mới".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Tên đăng nhập</th>
                  <th className="px-5 py-4">Họ & Tên</th>
                  <th className="px-5 py-4">Mật khẩu</th>
                  <th className="px-5 py-4">Vai trò</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.username === u.username;
                  return (
                    <tr key={u.id || u.username} className="hover:bg-slate-800/40 transition-colors">
                      {/* Username */}
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{u.username}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-800">
                              Bạn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Display Name */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-100">{u.displayName || '—'}</span>
                      </td>

                      {/* Password Preview */}
                      <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300 font-mono inline-block min-w-[70px]">
                            {visiblePasswordIds[u.id || u.username] ? (u.password || '••••••') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id || u.username)}
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title={visiblePasswordIds[u.id || u.username] ? "Ẩn mật khẩu" : "Xem mật khẩu"}
                          >
                            {visiblePasswordIds[u.id || u.username] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold inline-flex items-center space-x-1.5 transition-all cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 hover:bg-indigo-900'
                              : 'bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900'
                          }`}
                          title="Bấm để đổi vai trò"
                        >
                          <Shield className="w-3 h-3" />
                          <span>{u.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}</span>
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleLock(u)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold inline-flex items-center space-x-1.5 transition-all cursor-pointer ${
                            u.active
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                              : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                          }`}
                          title="Bấm để Khóa / Mở khóa"
                        >
                          {u.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Đang hoạt động</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Đã khóa</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin / Đổi mật khẩu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelf
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
                            }`}
                            title={isSelf ? 'Không thể xóa tài khoản hiện tại' : 'Xóa tài khoản'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-xl">
                  {editingUser ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <h3 className="font-extrabold text-white text-base">
                  {editingUser ? 'Chỉnh Sửa Tài Khoản' : 'Tạo Tài Khoản Người Dùng Mới'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tên đăng nhập (*)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="VD: giaovien1"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 disabled:opacity-60 font-mono"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  {editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu (*)'}
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Nhập mật khẩu mới nếu muốn đổi' : 'Tối thiểu 4 ký tự'}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Họ và Tên Giáo viên</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Vai trò phân quyền (*)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="user">Người dùng (User) - Tạo đề thi & Cấu hình API Key</option>
                  <option value="admin">Quản trị viên (Admin) - Toàn quyền quản trị ứng dụng</option>
                </select>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-200">Kích hoạt tài khoản</p>
                  <p className="text-[11px] text-slate-400">Cho phép người dùng đăng nhập ngay</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lưu Tài Khoản</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-950 text-rose-400 border border-rose-800 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Xác Nhận Xóa Tài Khoản</h3>
              <p className="text-xs text-slate-400 mt-1">
                Bạn có chắc chắn muốn xóa tài khoản <strong className="text-rose-400">{deletingUser.username}</strong> không?
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Xóa Ngay</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
