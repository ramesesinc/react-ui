import { useState, useCallback, useRef, useEffect } from 'react';
import { useTooltip } from './tooltip';

export type EntityData = Record<string, any>;

export type EntityMode = 'create' | 'read' | 'edit';

export type ValidationHandler = () => string | null;

export type EntityState = {
  data: EntityData, 
  mode: EntityMode
}

export interface BindingModel {
  raw: EntityState;

  error: string | null;
  setError: ( error: string | null ) => void;

  get: (path: string) => any;
  set: (path: string, value: any, dynamic?: boolean) => void;
  
  getMode: () => EntityMode;
  setMode: (mode: EntityMode) => void;

  getData: () => EntityData; 
  setData: ( data: EntityData, mode?: EntityMode ) => void;

  refresh: () => void;
  
  validate: () => string | null; 
  addValidationHandler: (handler: ValidationHandler) => void;
  removeValidationHandler: (handler: ValidationHandler) => void;  

  showTooltip: (input: HTMLInputElement | null, msg: string) => void; 

  isCreateMode: () => boolean;
  isReadMode: () => boolean;
  isEditMode: () => boolean;
}

// Utility to get a value at a nested path
function getByPath(obj: any, path: string): any {
  if ((path ?? '') === '') return null; 
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

// Utility to set a value at a nested path
function setByPath(obj: any, path: string, value: any): void {
  if ((path ?? '') === '') return; 

  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      if (typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
  }
}

const tooltip = useTooltip();

export function useBinding( data: EntityData = {}, mode: EntityMode = 'create' ) {

  const [raw, setRaw] = useState<EntityState>({ data, mode });
  const [error, setError] = useState<string | null>(null); 

  const validationHandlers = useRef<Set<ValidationHandler>>(new Set());

  const get = useCallback((path: string) => {
    return getByPath(raw.data, path);
  }, [raw]);

  const set = useCallback((path: string, value: any, dynamic: boolean = false) => {
    const data = raw.data;
    setByPath( data, path, value );
    if ( dynamic ) {
      const mode = raw.mode;
      setRaw({ data, mode });
    }
  }, [raw]);


  const exec = (handler: Function) => {
    try {
      return handler(); 
    } catch(err) {
      return String(err); 
    }
  }

  const validate = (): string | null => {
    for (const handler of validationHandlers.current) {
      const result = exec( handler );
      if ( result == null || result === '') {
        // no error message 
      } else {
        // handle the error message
        setError( result.toString()); 
        return result.toString();
      }
    }
    setError( null ); 
    return null; 
  };

  const addValidationHandler = (handler: ValidationHandler) => {
    if ( handler ) {
      validationHandlers.current.add(handler);
    }
  };

  const removeValidationHandler = (handler: ValidationHandler) => {
    if ( handler ) {
      validationHandlers.current.delete(handler);
    } 
  };
  

  useEffect(() => {
    return () => {
      validationHandlers.current.clear(); 
      setRaw({ data: {}, mode: 'create' }); 
    }; 
  }, []);


  const binding: BindingModel = {
    raw, get, set,
    
    error, setError, 

    getMode: () => raw.mode, 

    setMode: (mode: EntityMode) => { 
      if ( mode === raw.mode ) { 
        return; 
      } 

      const data = raw.data;
      setRaw({ data, mode });
    }, 

    getData: () => raw.data,

    setData: ( data: EntityData, mode?: EntityMode ) => {
      if ( data !== raw.data ) {
        const newMode = mode ?? raw.mode;
        setRaw({ data, mode: newMode });
      }
    }, 

    refresh: () => { 
      const newRaw = { ...raw }; 
      setRaw( newRaw ); 
    },

    validate, 
    addValidationHandler, 
    removeValidationHandler, 
    
    showTooltip: (input: HTMLInputElement | null, msg: string) => {    
      tooltip.show( input, msg ); 
    }, 

    isCreateMode: () => raw.mode === 'create',
    isReadMode: () => raw.mode === 'read',
    isEditMode: () => raw.mode === 'edit'
  };

  return binding;
}
