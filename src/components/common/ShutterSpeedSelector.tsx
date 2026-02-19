import React, { useId } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { SHUTTER_SPEED_VALUES } from '../../types';
import { colors } from '../../theme';

interface ShutterSpeedSelectorProps {
  value: string;
  onChange: (shutterSpeed: string) => void;
  label?: string;
  fullWidth?: boolean;
}

export const ShutterSpeedSelector: React.FC<ShutterSpeedSelectorProps> = ({
  value,
  onChange,
  label = 'Shutter Speed',
  fullWidth = true,
}) => {
  const id = useId();

  return (
    <FormControl fullWidth={fullWidth}>
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
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
          '& .MuiSelect-select': {
            color: colors.charcoal,
          },
        }}
      >
        {SHUTTER_SPEED_VALUES.map((speed) => (
          <MenuItem
            key={speed}
            value={speed}
            sx={{
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: 'rgba(217, 119, 6, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(217, 119, 6, 0.12)',
                },
              },
            }}
          >
            {speed}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
