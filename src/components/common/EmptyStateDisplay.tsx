import React, { type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { colors } from '../../theme';

interface EmptyStateDisplayProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyStateDisplay: React.FC<EmptyStateDisplayProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
    >
      <Box
        sx={{
          mb: 3,
          color: colors.silverGray,
          opacity: 0.6,
          '& .MuiSvgIcon-root': {
            fontSize: '5rem',
          },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: colors.charcoal,
          mb: 1.5,
          fontSize: '1.25rem',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: colors.silverGray,
          mb: 4,
          maxWidth: 400,
          mx: 'auto',
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
      <Button
        variant="contained"
        onClick={onAction}
        sx={{
          bgcolor: colors.deepAmber,
          color: 'white',
          fontWeight: 600,
          px: 4,
          py: 1.25,
          fontSize: '0.9375rem',
          '&:hover': {
            bgcolor: '#b45309',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
          },
        }}
      >
        {actionLabel}
      </Button>
    </Box>
  );
};
