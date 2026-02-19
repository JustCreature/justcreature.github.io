import React, { type ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

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
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Box sx={{ mb: 2, color: 'text.secondary' }}>
        {icon}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    </Box>
  );
};
