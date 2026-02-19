import React, { useId } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { Lens } from '../../types';
import { colors } from '../../theme';

interface LensSelectorProps {
  value: string;
  lenses: Lens[];
  onChange: (lensId: string) => void;
  label?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export const LensSelector: React.FC<LensSelectorProps> = ({
  value,
  lenses,
  onChange,
  label = 'Lens',
  required = false,
  fullWidth = true,
}) => {
  const id = useId();

  return (
    <FormControl fullWidth={fullWidth} required={required}>
      <InputLabel
        id={`${id}-label`}
        sx={{
          color: colors.silverGray,
          '&.Mui-focused': {
            color: colors.deepAmber,
          },
        }}
      >
        {label}
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          fontWeight: 500,
          '& .MuiSelect-select': {
            color: colors.charcoal,
          },
        }}
      >
        {lenses.map((lens) => (
          <MenuItem
            key={lens.id}
            value={lens.id}
            sx={{
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: 'rgba(217, 119, 6, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(217, 119, 6, 0.12)',
                },
              },
            }}
          >
            {lens.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
