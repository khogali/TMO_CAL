
import React, { useState, useMemo } from 'react';
import { useAuth, useData, useUI } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import DarkModeToggle from './DarkModeToggle';
import { SavedLead, LeadStatus } from '../types';
import MobileAppShell from './ui/MobileAppShell';

const getStatusStyles = (status: LeadStatus) => {
    switch (status) {
        case LeadStatus.NEW: return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
        case LeadStatus.CONTACTED: return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
        case LeadStatus.FOLLOW_UP: return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
        case LeadStatus.CLOSED_WON: return 'bg-green-500/10 text-green-700 dark:text-green-300';
        case LeadStatus.CLOSED_LOST: return 'bg-red-500/10 text-red-700 dark:text-red-300';
        default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
};

const ProfilePage: React.FC = () => {
    const { 
        user, 
        userProfile, 
        handleUserInfoSave, 
        handleSignOut, 
    } = useAuth();
    const { visibleLeads, setLeadToLoad } = useData();
    const { isDarkMode, setIsDarkMode, setView } = useUI();

    const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
    const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');

    const handleSave = () => {
        handleUserInfoSave(displayName, phoneNumber);
    };

    const myLeads = useMemo(() => {
        if (!user) return [];
        return visibleLeads
            .filter(lead => lead.assignedToUid === user.uid)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }, [visibleLeads, user]);

    const handleViewLead = (lead: SavedLead) => {
        setLeadToLoad(lead);
        setView('new-quote');
    }

    if (!user || !userProfile) {
        return (
            <div className="bg-muted/10 min-h-full">
                <div className="max-w-md mx-auto bg-background min-h-[100dvh] shadow-2xl border-x border-border/50 relative flex items-center justify-center">
                    <p className="text-muted-foreground">Please sign in to view your profile.</p>
                </div>
            </div>
        );
    }
    
    return (
        <MobileAppShell>
            {/* Header */}
            <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-20 px-5 py-4">
                <h1 className="text-xl font-black text-foreground tracking-tight">My Profile</h1>
            </div>

            <div className="p-5 space-y-6 pb-40 overflow-y-auto flex-1">
                <header className="flex items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-muted text-muted-foreground uppercase font-bold text-3xl">
                        {userProfile.displayName?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{userProfile.displayName}</h2>
                        <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    </div>
                </header>

                <Card>
                    <CardHeader><CardTitle>My Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
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
                            <div className="flex justify-end pt-2">
                            <Button onClick={handleSave} size="sm">Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>My Leads ({myLeads.length})</CardTitle></CardHeader>
                    <CardContent>
                        {myLeads.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {myLeads.map(lead => (
                                    <div key={lead.id} onClick={() => handleViewLead(lead)} className="p-3 bg-muted/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-muted">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{lead.customerName || 'Unnamed'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(lead.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full whitespace-nowrap ${getStatusStyles(lead.status)}`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4 text-sm">You are not assigned to any leads yet.</p>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-2 rounded-lg">
                            <div className="flex-grow pr-4">
                                <span className="text-sm font-medium text-foreground">Dark Mode</span>
                                <p className="text-xs text-muted-foreground">Toggle between light and dark themes.</p>
                            </div>
                            <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                        </div>
                        <div className="pt-4 border-t border-border">
                            <Button variant="destructive" onClick={handleSignOut} className="w-full">
                                Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MobileAppShell>
    );
};

export default ProfilePage;
