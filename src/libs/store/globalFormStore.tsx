// src/lib/createFormStore.ts
import { Store, useStore } from '@tanstack/react-store';
import React, { createContext, useContext } from 'react';

// تایپ جنریک برای داده فرم
export type FormData = Record<string, any>;

export function createFormStore<T extends FormData>(initialData: T) {
  const formStore = new Store<T>(initialData);

  const actions = {
    setAll: (data: Partial<T>) => {
      formStore.setState((prev) => ({
        ...prev,
        ...data,
      }));
    },
    updateField: <K extends keyof T>(field: K, value: T[K]) => {
      formStore.setState((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    reset: () => {
      formStore.setState(initialData);
    },
  };

  const FormContext = createContext<typeof formStore | null>(null);

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <FormContext.Provider value={formStore}>{children}</FormContext.Provider>;
  };

  const useFormStore = () => {
    const store = useContext(FormContext);
    if (!store) throw new Error("useFormStore must be used within its Provider");
    return useStore(store);
  };

  return { formStore, actions, Provider, useFormStore };
}
