// src/common/types.ts

import { BindingModel } from "./binding";

export interface UIControl {
  binding: BindingModel;
  dynamic?: boolean;
  className?: string;
}

export type TextCase = 'upper' | 'lower' | 'capitalize' | 'none';
export type TextHAlign = 'left' | 'center' | 'right';

export interface UIInputControl extends UIControl {
  name: string;
  label?: string;
  labelClassName?: string;

  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  
  align?: TextHAlign;
  textcase?: TextCase;
  placeholder?: string;
}

export interface UIButtonControl extends UIControl {
  dynamic?: never;
  immediate?: boolean;
  onClick?: () => Promise<any> | void;
}