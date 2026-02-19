import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Alert,
} from '@mui/material';
import { DialogHeader } from './DialogHeader';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error';
  warningText?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  onConfirm,
  onCancel,
  severity = 'warning',
  warningText,
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogHeader title={title} onClose={onCancel} />
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        {warningText && (
          <Alert severity={severity} sx={{ mt: 2 }}>
            {warningText}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color={severity} variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
