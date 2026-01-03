import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AppContext';
import Input from './ui/Input';
import Button from './ui/Button';
import BottomSheet from './ui/BottomSheet';

const UserInfoModal: React.FC = () => {
  const { user, userProfile, isUserInfoModalOpen, setIsUserInfoModalOpen, handleUserInfoSave } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');

  const onClose = () => setIsUserInfoModalOpen(false);
  
  // Sync state when profile loads or modal opens
  useEffect(() => {
      if (userProfile) {
          setDisplayName(userProfile.displayName);
          setPhoneNumber(userProfile.phoneNumber);
      }
  }, [userProfile, isUserInfoModalOpen]);

  const handleSave = () => {
      handleUserInfoSave(displayName, phoneNumber);
      onClose();
  };

  if (!user || !userProfile) return null;

  return (
    <BottomSheet isOpen={isUserInfoModalOpen} onClose={onClose} title="User Profile">
        <div className="overflow-y-auto flex-grow p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Signed in as</label>
            <p className="text-base text-foreground truncate mt-1">{user.email}</p>
          </div>
          <hr className="border-border" />
          <Input 
            label="Display Name"
            name="displayName"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your Name"
          />
          <Input 
            label="Phone Number"
            name="phoneNumber"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            placeholder="Your Phone Number"
          />
        </div>
         <div className="p-4 bg-card border-t border-border flex justify-end items-center gap-3 flex-shrink-0" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">Save Preferences</Button>
        </div>
    </BottomSheet>
  );
};

export default UserInfoModal;