// components/GraphCustomizer.js

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Button,
  ButtonGroup,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import moment from 'moment';

function GraphCustomizer({
  user,
  summary =[],
  selectedHospitals,
  handleHospitalSelection,
  startDate,
  handleStartDateChange,
  endDate,
  handleEndDateChange,
  handleAllSelect,
  setStartDate,
  setEndDate,
}) {
  // Define quarters covering 4 months each
  const quarters = [
    { label: 'Q1', startMonth: 0, endMonth: 2 }, // Jan - Mar
    { label: 'Q2', startMonth: 3, endMonth: 5 }, // Apr - Jun
    { label: 'Q3', startMonth: 6, endMonth: 8 }, // Jul - Sep
    { label: 'Q4', startMonth: 9, endMonth: 11 }, // Oct - Dec
  ];

  // Function to set current quarter based on custom quarters
  const setCurrentQuarter = () => {
    const today = moment();
    const currentQuarterIndex = quarters.findIndex(
      (q) => today.month() >= q.startMonth && today.month() <= q.endMonth
    );
    const q = quarters[currentQuarterIndex];
    const start = moment().month(q.startMonth).startOf('month').toDate();
    const end = moment().month(q.endMonth).endOf('month').toDate();
    setStartDate(start);
    setEndDate(end);
  };

  // Function to set date range for a given custom quarter and year
  const setQuarter = (year, quarterIndex) => {
    const q = quarters[quarterIndex];
    const start = moment()
      .year(year)
      .month(q.startMonth)
      .startOf('month')
      .toDate();
    const end = moment()
      .year(year)
      .month(q.endMonth)
      .endOf('month')
      .toDate();
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        marginBottom: 2,
        gap: 2, // spacing between elements
      }}
    >
      {/* Hospital Selection */}
      <Box sx={{ flex: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="hospital-select-label">Select Hospitals</InputLabel>
          <Select
            labelId="hospital-select-label"
            id="hospital-select"
            multiple
            value={selectedHospitals}
            onChange={handleHospitalSelection}
            renderValue={(selected) => {
              if (selected.length === 0) {
                return 'Select Hospitals';
              } else if (selected.length === 1) {
                return selected[0];
              } else {
                return `${selected[0]}, (${selected.length - 1} more selected)`;
              }
            }}
            label="Select Hospitals"
            sx={{ width: 250 }} // Adjust the width of the hospital dropdown
          >
            {summary.map((hospital) => (
              <MenuItem key={hospital.id} value={hospital.name}>
                <Checkbox
                  checked={selectedHospitals.indexOf(hospital.name) > -1}
                />
                <ListItemText primary={hospital.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {/* Select All / Clear All Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={(e) => handleAllSelect(e, true)}
        >
          Select All
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={(e) => handleAllSelect(e, false)}
        >
          Clear All
        </Button>
      </Box>
      {/* Date Pickers */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <TextField
          label="Start Date"
          type="date"
          value={moment(startDate).format('YYYY-MM-DD')}
          onChange={handleStartDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ width: 150 }}
        />
        <TextField
          label="End Date"
          type="date"
          value={moment(endDate).format('YYYY-MM-DD')}
          onChange={handleEndDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ width: 150 }}
        />
      </Box>


      {/* Quarter Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <Box>
          <Button variant="outlined" onClick={setCurrentQuarter}>
            Current Quarter
          </Button>
        </Box>

        <Box>
          <Typography variant="h6" align="center">
            Last Year
          </Typography>
          <ButtonGroup variant="outlined">
            {quarters.map((q, index) => (
              <Button
                key={index}
                onClick={() => setQuarter(moment().year() - 1, index)}
              >
                {q.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>
    </Box>
  );
}

export default GraphCustomizer;
