import React, { useId } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { Lens } from '../../types';

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
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {lenses.map((lens) => (
          <MenuItem key={lens.id} value={lens.id}>
            {lens.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
