import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Box,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

function ReportCustomizer(props) {
  const {
    selectedGenders = [],
    setSelectedGenders,
    selectedMdvi = [],
    setSelectedMdvi,
    minAge = 0,
    setMinAge,
    maxAge = 100,
    setMaxAge,
    onClose,
  } = props;

  const updateGender = (event) => {
    const gender = event.target.name;
    const isChecked = event.target.checked;
    setSelectedGenders((prev = []) =>
      isChecked ? [...prev, gender] : prev.filter((g) => g !== gender)
    );
  };

  const updateMdvi = (event) => {
    const mdviValue = event.target.name; // 'Yes' or 'No'
    const isChecked = event.target.checked;
    setSelectedMdvi((prev = []) =>
      isChecked ? [...prev, mdviValue] : prev.filter((m) => m !== mdviValue)
    );
  };

  const resetToDefault = () => {
    setSelectedGenders(['Male', 'Female', 'Other']);
    setSelectedMdvi(['Yes', 'No']);
    setMinAge(null);
    setMaxAge(null);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', padding: '16px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>All Filters</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Gender Filter */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><strong>Gender</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['Male', 'Female', 'Other'].map((gender) => (
              <FormControlLabel
                key={gender}
                control={
                  <Checkbox
                    name={gender}
                    checked={selectedGenders.includes(gender)}
                    onChange={updateGender}
                  />
                }
                label={gender}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Age Filter */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><strong>Age</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <TextField
              label="Minimum Age"
              type="number"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value ? Number(e.target.value) : null)}
              fullWidth
            />
            <TextField
              label="Maximum Age"
              type="number"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value ? Number(e.target.value) : null)}
              fullWidth
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* MDVI Filter */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><strong>MDVI</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['Yes', 'No'].map((mdvi) => (
              <FormControlLabel
                key={mdvi}
                control={
                  <Checkbox
                    name={mdvi}
                    checked={selectedMdvi.includes(mdvi)}
                    onChange={updateMdvi}
                  />
                }
                label={mdvi}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Reset to Default Button */}
      <Button
        variant="outlined"
        color="secondary"
        onClick={resetToDefault}
        fullWidth
        sx={{ mt: 1 }}
      >
        Reset to Default
      </Button>
    </div>
  );
}

export default ReportCustomizer;
