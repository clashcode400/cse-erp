import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, StudentProfile, FacultyProfile, Role } from '../types';
import { authService } from '../services/api';

interface DemoUserItem {
  id: number;
  username: string;
  name: string;
  role: Role;
  department: string;
  avatar_color: string;
  register_no?: string;
  faculty_id?: string;
  year?: number;
  semester?: number;
  designation?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  studentProfile: StudentProfile | null;
  facultyProfile: FacultyProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoAccounts: DemoUserItem[];
  login: (username: string, password?: string) => Promise<void>;
  quickLoginAs: (username: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoUserItem[]>([]);

  const fetchDemoAccounts = async () => {
    try {
      const accounts = await authService.getDemoAccounts();
      setDemoAccounts(accounts);
    } catch (err) {
      console.error('Failed to load demo accounts', err);
    }
  };

  const refreshUserData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setRole(null);
      setStudentProfile(null);
      setFacultyProfile(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await authService.getCurrentUser();
      setUser(data);
      setRole(data.role);
      if (data.student_profile) {
        setStudentProfile(data.student_profile);
      } else {
        setStudentProfile(null);
      }
      if (data.faculty_profile) {
        setFacultyProfile(data.faculty_profile);
      } else {
        setFacultyProfile(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid token', err);
      authService.logout();
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoAccounts();
    refreshUserData();
  }, []);

  const login = async (username: string, password = 'StudentPassword123!') => {
    setIsLoading(true);
    try {
      await authService.login({ username, password });
      await refreshUserData();
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (username: string) => {
    let pwd = 'StudentPassword123!';
    if (username.startsWith('faculty_')) pwd = 'FacultyPassword123!';
    if (username === 'admin_user') pwd = 'AdminPassword123!';
    await login(username, pwd);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRole(null);
    setStudentProfile(null);
    setFacultyProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        studentProfile,
        facultyProfile,
        isAuthenticated: !!user,
        isLoading,
        demoAccounts,
        login,
        quickLoginAs,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
