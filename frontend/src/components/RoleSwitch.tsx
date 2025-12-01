import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserRoles } from '@/lib/users-api';
import { canManageContent, isAdmin } from '@/utils/roleGuard';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api';
import { UserInfo } from '@/lib/auth-api';
import { Settings } from 'lucide-react';

interface RoleSwitchProps {
  user?: UserInfo;
  onRoleUpdated?: () => void;
}

/**
 * Role switch component for dev/admin to assign roles to users.
 * Only visible to admins or in dev mode.
 */
export const RoleSwitch = ({ user, onRoleUpdated }: RoleSwitchProps) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user?.roles || ['STUDENT']
  );
  const [loading, setLoading] = useState(false);

  // Only show for admins or in dev mode
  const isDevMode = import.meta.env.DEV;
  const canAccess = isAdmin(currentUser) || isDevMode;

  if (!canAccess) {
    return null;
  }

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
    await updateUserRoles(
      user.id,
      selectedRoles as ('STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN')[]
    );
    
      toast({
        title: 'Roles updated',
        description: `User roles have been updated successfully.`,
      });
      
      setOpen(false);
      
      // Refresh current user if we updated ourselves
      if (user.id === currentUser?.id) {
        await refreshUser();
      }
      
      // Callback to refresh user list if provided
      if (onRoleUpdated) {
        onRoleUpdated();
      }
    } catch (error) {
      console.error('Failed to update roles:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const allRoles: ('STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN')[] = [
    'STUDENT',
    'INSTRUCTOR',
    'TA',
    'ADMIN',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Roles
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Assign roles to {user?.name || 'user'}. User can have multiple roles.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Roles</Label>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select Roles</Label>
            <div className="space-y-2">
              {allRoles.map((role) => (
                <label
                  key={role}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{role}</span>
                </label>
              ))}
            </div>
          </div>
          
          {selectedRoles.length === 0 && (
            <p className="text-sm text-destructive">
              At least one role must be selected.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || selectedRoles.length === 0}
          >
            {loading ? 'Saving...' : 'Save Roles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
