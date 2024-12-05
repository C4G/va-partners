import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import moment from 'moment';

export default function TextFieldWrapper({ label, value, setDate }) {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);
  
  const handleChange = (event) => {
    setTempValue(event.target.value);
  };

  const handleBlur = () => {
    setDate(tempValue);
  };

  return (
    <TextField
      abel={label}
      value={moment(tempValue).format('YYYY-MM-DD')}
            type="date"
      onChange={handleChange}
      onBlur={handleBlur}
      InputLabelProps={{
        shrink: true,
      }}
      fullWidth
    />
  );
}