
import { toast as sonnerToast, type ToastT } from "sonner";

export type ToastAction = {
  icon?: React.ReactNode
  onClick: () => void
  title: string
}

export type ExtraToastOptions = {
  action?: ToastAction
  description?: string
  title?: string
}

export const toast = (options: ExtraToastOptions) => {
  const { action, description, title, ...restOptions } = options;
  
  return sonnerToast(title, {
    description,
    action: action
      ? {
        label: action.title,
        onClick: action.onClick,
        // icon property is not supported directly by sonner
      }
      : undefined,
    ...restOptions,
  });
};

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    error: sonnerToast.error,
    info: sonnerToast.info,
    success: sonnerToast.success,
    warning: sonnerToast.warning,
    toasts: [],
  };
}
