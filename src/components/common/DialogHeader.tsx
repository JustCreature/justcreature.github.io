import React, { type ReactNode } from 'react';
import { DialogTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '../../theme';

interface DialogHeaderProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ title, icon, onClose }) => {
  return (
    <DialogTitle
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2.5,
        px: 3,
        borderBottom: `1px solid ${colors.coolGray}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: colors.charcoal,
          fontWeight: 600,
          fontSize: '1.125rem',
        }}
      >
        {icon && (
          <Box sx={{ color: colors.deepAmber, display: 'flex' }}>
            {icon}
          </Box>
        )}
        {title}
      </Box>
      <IconButton
        edge="end"
        onClick={onClose}
        aria-label="close"
        sx={{
          color: colors.silverGray,
          '&:hover': {
            bgcolor: 'rgba(217, 119, 6, 0.08)',
            color: colors.deepAmber,
          },
        }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
};
