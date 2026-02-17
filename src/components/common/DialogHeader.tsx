import React, { type ReactNode } from 'react';
import { DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface DialogHeaderProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ title, icon, onClose }) => {
  return (
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        {title}
      </span>
      <IconButton edge="end" onClick={onClose} aria-label="close">
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
};
