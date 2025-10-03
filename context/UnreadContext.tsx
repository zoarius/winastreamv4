import React, { createContext, useState, useContext, ReactNode } from 'react';

// Définit la structure de notre contexte
type UnreadContextType = {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
};

// Crée le contexte
const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

// Crée le "Fournisseur" qui contiendra la logique
export const UnreadProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <UnreadContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
};

// Crée un "Hook" personnalisé pour accéder facilement au contexte
export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (context === undefined) {
    throw new Error('useUnread doit être utilisé à l´intérieur d´un UnreadProvider');
  }
  return context;
};
