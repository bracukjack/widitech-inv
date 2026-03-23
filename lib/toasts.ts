import { toast } from 'sonner';

export const showCreated = (entity: string) =>
  toast.success(`${entity} created successfully`);

export const showUpdated = (entity: string) =>
  toast.success(`${entity} updated successfully`);

export const showDeleted = (entity: string, onUndo?: () => void) => {
  if (onUndo) {
    toast(`${entity} moved to trash`, {
      action: { label: 'Undo', onClick: onUndo },
      duration: 5000,
    });
  } else {
    toast(`${entity} moved to trash`);
  }
};

export const showRestored = (entity: string) =>
  toast.success(`${entity} restored`);

export const showPermanentlyDeleted = (entity: string) =>
  toast.success(`${entity} permanently deleted`);

export const showError = (message: string) =>
  toast.error(message);
