import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  Box,
  ListItemText,
} from '@mui/material';
import moment from 'moment';

function GraphCustomizer({
  summary = [], // Add default value to ensure it's an array
  selectedHospitals = [], // Add default value to ensure it's an array
  handleHospitalSelection,
  startDate,
  handleStartDateChange,
  endDate,
  handleEndDateChange,
  setStartDate,
  setEndDate,
}) {
  // Define quarters covering 3 months each
  const quarters = [
    { label: 'Q1', startMonth: 0, endMonth: 2 }, // Jan - Mar
    { label: 'Q2', startMonth: 3, endMonth: 5 }, // Apr - Jun
    { label: 'Q3', startMonth: 6, endMonth: 8 }, // Jul - Sep
    { label: 'Q4', startMonth: 9, endMonth: 11 }, // Oct - Dec
  ];

  // State to track the selected quarter
  const [selectedQuarter, setSelectedQuarter] = useState('');

  // Function to set date range for a given quarter and year
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
    setSelectedQuarter(quarters[quarterIndex].label); // Set the selected quarter
  };

  // Get the current month
  const currentMonth = moment().month();

  // Determine how many quarters to show based on the current month
  const currentQuarterIndex = quarters.findIndex(
    (q) => currentMonth >= q.startMonth && currentMonth <= q.endMonth
  );

  // Create an array for the dropdown showing the current and previous 3 quarters
  const availableQuarters = [
    ...quarters.slice(currentQuarterIndex, currentQuarterIndex + 1),
    ...quarters.slice(0, currentQuarterIndex).reverse(),
  ];

  // Set the current quarter as default on component load
  useEffect(() => {
    setQuarter(moment().year(), currentQuarterIndex);
  }, [currentQuarterIndex]); // Run when currentQuarterIndex changes

  // Handle quarter selection (single select)
  const handleQuarterSelection = (event) => {
    const quarterLabel = event.target.value;
    if (quarterLabel === '') {
      setSelectedQuarter(''); // Clear selected quarter when empty is selected
      return;
    }
    // Find the correct index in the original quarters array (not the reordered one)
    const selectedIndex = quarters.findIndex((q) => q.label === quarterLabel);
    setQuarter(moment().year(), selectedIndex); // Update the date range when a quarter is selected
  };

  // Check if current selected dates are inside any quarter range
  const isDateInQuarterRange = (startDate, endDate) =>
    quarters.some((q) => {
      const start = moment().year(moment(startDate).year()).month(q.startMonth).startOf('month');
      const end = moment().year(moment(endDate).year()).month(q.endMonth).endOf('month');
      return moment(startDate).isBetween(start, end, undefined, '[]') &&
        moment(endDate).isBetween(start, end, undefined, '[]');
    });

  // Use effect to check date range when dates are changed manually
  useEffect(() => {
    const isInQuarter = isDateInQuarterRange(startDate, endDate);
    if (!isInQuarter) {
      setSelectedQuarter(''); // Clear the quarter if date range is outside the quarters
    }
  }, [startDate, endDate]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center', // Center align the whole row horizontally
        alignItems: 'center', // Align items vertically in the middle
        gap: 4, // Add space between elements
        width: '75vw', // Ensure it spans the full width of the viewport
        padding: 1, // Add some padding around the content
      }}
    >
      {/* "Select/Unselect All" option */}
      <Box>
        <Checkbox
          checked={selectedHospitals.length === summary.length}
          indeterminate={
            selectedHospitals.length > 0 &&
            selectedHospitals.length < summary.length
          }
          onChange={() => {
            if (selectedHospitals.length === summary.length) {
              handleHospitalSelection({ target: { value: [] } });
            } else {
              const allHospitals = summary.map((hospital) => hospital.name);
              handleHospitalSelection({ target: { value: allHospitals } });
            }
          }}
        />
        <ListItemText
          primary={
            selectedHospitals.length === summary.length
              ? 'Unselect All'
              : 'Select All'
          }
        />
      </Box>

      {/* Hospital Selection */}
      <Box>
        <FormControl fullWidth>
          <InputLabel id="hospital-select-label">Select Hospitals</InputLabel>
          <Select
            labelId="hospital-select-label"
            id="hospital-select"
            multiple
            value={selectedHospitals}
            onChange={handleHospitalSelection}
            renderValue={(selected) => {
              if (!selected || selected.length === 0) {
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
            {/* Hospital options */}
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

      {/* Date Pickers */}
      <Box sx={{ display: 'flex', gap: 4 }}>
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

      {/* Quarter Selection */}
      <FormControl >
        <InputLabel id="quarter-select-label"
            sx={{
              backgroundColor: 'white', // Give the label a white background
              px: 1, // Add padding on the x-axis to provide spacing around the text
              transform: 'translate(14px, -9px) scale(0.75)', // Adjust positioning and scaling
              pointerEvents: 'none', // Prevent clicking on the label itself
            }}
          
        >Select Quarter</InputLabel>
        <Select
          labelId="quarter-select-label"
          value={selectedQuarter}
          onChange={handleQuarterSelection}
          sx={{ width: 150 }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {availableQuarters.map((quarter) => (
            <MenuItem key={quarter.label} value={quarter.label}>
              {quarter.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default GraphCustomizer;

