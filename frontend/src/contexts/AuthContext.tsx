import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserInfo, getCurrentUser, signOut as apiSignOut, signIn, signUp, SignInRequest, SignUpRequest } from '@/lib/auth-api';
import { useToast } from '@/hooks/use-toast';
import { getAccessToken } from '@/lib/api';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  signin: (data: SignInRequest) => Promise<void>;
  signup: (data: SignUpRequest) => Promise<void>;
  signout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadUser = async () => {
    // Only try to load user if token exists
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // User not authenticated or token expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSignIn = async (data: SignInRequest) => {
    try {
      const response = await signIn(data);
      setUser(response.user);
      navigate('/dashboard');
      toast({
        title: 'Signed in',
        description: 'Welcome back!',
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error?.response?.data?.error?.message || 'Invalid email or password',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleSignUp = async (data: SignUpRequest) => {
    try {
      const response = await signUp(data);
      setUser(response.user);
      navigate('/dashboard');
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error?.response?.data?.error?.message || 'Failed to create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await apiSignOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setUser(null);
      navigate('/signin');
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signin: handleSignIn,
        signup: handleSignUp,
        signout: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

