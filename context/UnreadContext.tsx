import React, { createContext, useState, useContext, ReactNode } from 'react';

// D�finit la structure de notre contexte
type UnreadContextType = {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
};

// Cr�e le contexte
const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

// Cr�e le "Fournisseur" qui contiendra la logique
export const UnreadProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <UnreadContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
};

// Cr�e un "Hook" personnalis� pour acc�der facilement au contexte
export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (context === undefined) {
    throw new Error('useUnread doit �tre utilis� � l�int�rieur d�un UnreadProvider');
  }
  return context;
};
