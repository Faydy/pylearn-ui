import { createContext, useContext } from 'react';
export const FixtureAuthContext = createContext({});
export const useAuth = () => useContext(FixtureAuthContext);
