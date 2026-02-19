import React, { useId } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { SHUTTER_SPEED_VALUES } from '../../types';

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
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {SHUTTER_SPEED_VALUES.map((speed) => (
          <MenuItem key={speed} value={speed}>
            {speed}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
