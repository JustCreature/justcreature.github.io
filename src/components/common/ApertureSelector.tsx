import React, { useMemo, useId } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { APERTURE_VALUES, type ApertureEnum } from '../../types';

interface ApertureSelectorProps {
  value: string;
  onChange: (aperture: string) => void;
  maxAperture?: string;
  label?: string;
  fullWidth?: boolean;
}

export const ApertureSelector: React.FC<ApertureSelectorProps> = ({
  value,
  onChange,
  maxAperture,
  label = 'Aperture',
  fullWidth = true,
}) => {
  const id = useId();
  const availableApertures = useMemo(() => {
    if (!maxAperture) return APERTURE_VALUES;
    const maxIndex = APERTURE_VALUES.indexOf(maxAperture as ApertureEnum);
    return maxIndex >= 0 ? APERTURE_VALUES.slice(maxIndex) : APERTURE_VALUES;
  }, [maxAperture]);

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value as string)}
      >
        {availableApertures.map((aperture) => (
          <MenuItem key={aperture} value={aperture}>
            {aperture}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
