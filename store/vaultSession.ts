import { createContext, useContext } from 'react';
export const VaultContext = createContext(true);
export const useVaultVisible = () => useContext(VaultContext);
