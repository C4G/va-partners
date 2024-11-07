import { useState, useEffect } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  Box,
  ListItemText,
  Button, // Add Button import
} from '@mui/material';
import moment from 'moment';

// Add the following imports
import XLSX from 'xlsx-js-style';
import { calculateAge } from 'utils/global/calculate-age';
import {
  setAhdHeader,
  setClveHeader,
  setLveHeader,
  getReportData,
  filterTrainingSummaryByDateRange,
} from '@/constants/reportFunctions';

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

  // Get the current month
  const currentMonth = moment().month();

  // Determine the current quarter index based on the current month
  const currentQuarterIndex = quarters.findIndex(
    (q) => currentMonth >= q.startMonth && currentMonth <= q.endMonth
  );

  // Create an array for the dropdown showing the current and previous quarters
  const availableQuarters = [
    ...quarters.slice(currentQuarterIndex, currentQuarterIndex + 1),
    ...quarters.slice(0, currentQuarterIndex).reverse(),
  ];

  // Append "(Current)" to the current quarter's label
  const updatedAvailableQuarters = availableQuarters.map((quarter, index) => {
    if (index === 0) {
      return { ...quarter, label: `${quarter.label} (Current)` };
    } else {
      return quarter;
    }
  });

  const downloadFilteredReport = async () => {
    try {
      // Set default filters
      const selectedGenders = ['M', 'F', 'Other'];
      const selectedMdvi = ['Yes', 'No', 'At Risk'];

      const minAge = 0;
      const maxAge = 100;

      // Adjust the start and end dates
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setUTCHours(0, 0, 0, 0);
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setUTCHours(23, 59, 59, 999);

      // Get selected hospital IDs
      const selectedHospitalIds = summary
        .filter((hospital) => selectedHospitals.includes(hospital.name))
        .map((hospital) => hospital.id);

      // Fetch beneficiary data
      const beneficiaryListAPI = selectedHospitalIds.map((id) =>
        fetch(
          `/api/v2/dashboard/beneficiaryWithDetails?hospitalIds=${id}&startDate=${adjustedStartDate.toISOString()}&endDate=${adjustedEndDate.toISOString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const responses = await Promise.all(beneficiaryListAPI);
      const finalResult = await Promise.all(
        responses.map((res) => (res.json ? res.json().catch((err) => err) : res))
      );
      // const beneficiaryList = finalResult.flat();
      const beneficiaryList = finalResult.flatMap(result => result.records || []);

      // Filter beneficiary data by date range
      const dateFilteredBeneficiaryData = filterTrainingSummaryByDateRange(
        adjustedStartDate,
        adjustedEndDate,
        beneficiaryList || [], // Fallback to empty array if undefined
  'beneficiary'
      );

      const numTotalBeneficiaries = dateFilteredBeneficiaryData.length;

      // Further filter data based on default filters
      const filteredBeneficiaryData = dateFilteredBeneficiaryData.filter(
        (item) =>
          selectedHospitalIds.includes(item.hospital.id) &&
          selectedGenders.includes(item.gender) &&
          selectedMdvi.includes(item.mDVI) &&
          minAge <= calculateAge(item.dateOfBirth) &&
          calculateAge(item.dateOfBirth) <= maxAge
      );

      const numFilteredBeneficiaries = filteredBeneficiaryData.length;

      // Filter summary data
      const dateFilteredSummary = filterTrainingSummaryByDateRange(
        adjustedStartDate,
        adjustedEndDate,
        summary,
        'hospital'
      );

      const filteredSummary = dateFilteredSummary.filter((item) =>
        selectedHospitalIds.includes(item.id)
      );

      // Generate report data
      const reportData = getReportData(
        filteredBeneficiaryData,
        filteredSummary,
        numTotalBeneficiaries === numFilteredBeneficiaries
      );

      // Destructure report data
      const {
        beneficiaryData = [],
        visionEnhancementData = [],
        lowVisionEvaluationData = [],
        comprehensiveLowVisionEvaluationData = [],
        electronicDevicesData = [],
        trainingData = [],
        counsellingEducationData = [],
        aggregatedHospitalData = [],
      } = reportData;

      const wb = XLSX.utils.book_new();
      let sheetsAdded = false;

      // Append sheets based on available data
      if (beneficiaryData.length > 0) {
        const wben = XLSX.utils.json_to_sheet(beneficiaryData);
        XLSX.utils.book_append_sheet(wb, wben, 'Beneficiary Sheet');
        sheetsAdded = true;
      }

      if (visionEnhancementData.length > 0) {
        const wved = XLSX.utils.json_to_sheet(visionEnhancementData);
        XLSX.utils.book_append_sheet(wb, wved, 'Vision Enhancement Sheet');
        sheetsAdded = true;
      }

      if (lowVisionEvaluationData.length > 0) {
        const wlved = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wlved, 'Low Vision Screening');
        setLveHeader(wlved);
        XLSX.utils.sheet_add_json(wlved, lowVisionEvaluationData, {
          skipHeader: true,
          origin: -1,
        });
        sheetsAdded = true;
      }

      if (comprehensiveLowVisionEvaluationData.length > 0) {
        const wclve = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wclve, 'CLVE Sheet');
        setClveHeader(wclve);
        XLSX.utils.sheet_add_json(wclve, comprehensiveLowVisionEvaluationData, {
          skipHeader: true,
          origin: -1,
        });
        sheetsAdded = true;
      }

      if (electronicDevicesData.length > 0) {
        const wed = XLSX.utils.json_to_sheet(electronicDevicesData);
        XLSX.utils.book_append_sheet(wb, wed, 'Electronic Devices Break Up');
        sheetsAdded = true;
      }

      if (trainingData.length > 0) {
        const wtd = XLSX.utils.json_to_sheet(trainingData);
        XLSX.utils.book_append_sheet(wb, wtd, 'Training Sheet');
        sheetsAdded = true;
      }

      if (counsellingEducationData.length > 0) {
        const wced = XLSX.utils.json_to_sheet(counsellingEducationData);
        XLSX.utils.book_append_sheet(wb, wced, 'Counselling Education Sheet');
        sheetsAdded = true;
      }

      if (aggregatedHospitalData.length > 0) {
        const wahd = XLSX.utils.aoa_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wahd, 'Summary of Services');

        // Set headers using setAhdHeader
        setAhdHeader(
          wahd,
          filteredSummary.map((hospital) => hospital.name)
        );

        // Convert aggregatedHospitalData to worksheet format
        const dataToAdd = aggregatedHospitalData.map((row) => {
          const rowData = [];
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              rowData.push(row[key]);
            }
          }
          return rowData;
        });

        // Find the starting row after headers
        const startRow = wahd['!ref']
          ? XLSX.utils.decode_range(wahd['!ref']).e.r + 1
          : 0;

        // Add data to the sheet
        XLSX.utils.sheet_add_aoa(wahd, dataToAdd, { origin: { r: startRow, c: 0 } });
        sheetsAdded = true;
      }

      if (!sheetsAdded) {
        alert('No data available for the selected filters.');
        return;
      }

      // Generate the filename
      let reportHospitalName = 'ALL';
      const selectedHospitalNames = summary
        .filter((hospital) => selectedHospitals.includes(hospital.name))
        .map((hospital) => hospital.name);

      if (selectedHospitalNames.length === 1) {
        reportHospitalName = selectedHospitalNames[0];
      } else if (selectedHospitalNames.length > 1) {
        reportHospitalName = 'MULTI';
      }

      const fileNameComponents = [];
      fileNameComponents.push('Report');
      fileNameComponents.push(reportHospitalName);
      fileNameComponents.push(adjustedStartDate.toISOString().split('T')[0]);
      fileNameComponents.push(adjustedEndDate.toISOString().split('T')[0]);

      const filename = fileNameComponents.join('_') + '.xlsx';
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

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

    // Get the label used in the dropdown
    let quarterLabel = q.label;
    if (quarterIndex === currentQuarterIndex) {
      quarterLabel = `${q.label} (Current)`;
    }
    setSelectedQuarter(quarterLabel); // Set the selected quarter
  };

  // Set the current quarter as default on component load
  useEffect(() => {
    setQuarter(moment().year(), currentQuarterIndex);
  }, [currentQuarterIndex]); // Run when currentQuarterIndex changes

  // Handle quarter selection (single select)
  const handleQuarterSelection = (event) => {
    let quarterLabel = event.target.value;
    if (quarterLabel === '') {
      setSelectedQuarter(''); // Clear selected quarter when empty is selected
      return;
    }
    // Remove ' (Current)' from the label if present
    quarterLabel = quarterLabel.replace(' (Current)', '');
    // Find the correct index in the original quarters array
    const selectedIndex = quarters.findIndex((q) => q.label === quarterLabel);
    setQuarter(moment().year(), selectedIndex); // Update the date range when a quarter is selected
  };

  // Check if current selected dates are inside any quarter range
  const isDateInQuarterRange = (startDate, endDate) =>
    quarters.some((q) => {
      const start = moment()
        .year(moment(startDate).year())
        .month(q.startMonth)
        .startOf('month');
      const end = moment()
        .year(moment(endDate).year())
        .month(q.endMonth)
        .endOf('month');
      return (
        moment(startDate).isBetween(start, end, undefined, '[]') &&
        moment(endDate).isBetween(start, end, undefined, '[]')
      );
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
      <FormControl>
        <InputLabel
          id="quarter-select-label"
          sx={{
            backgroundColor: 'white', // Give the label a white background
            px: 1, // Add padding on the x-axis to provide spacing around the text
            transform: 'translate(14px, -9px) scale(0.75)', // Adjust positioning and scaling
            pointerEvents: 'none', // Prevent clicking on the label itself
          }}
        >
          Select Quarter
        </InputLabel>
        <Select
          labelId="quarter-select-label"
          value={selectedQuarter}
          onChange={handleQuarterSelection}
          sx={{ width: 150 }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {updatedAvailableQuarters.map((quarter) => (
            <MenuItem key={quarter.label} value={quarter.label}>
              {quarter.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
          {/* Download Customized Report Button */}
    <Button
      variant="contained"
      color="primary"
      onClick={downloadFilteredReport}
      startIcon={<DownloadIcon />}
      sx={{ height: '56px' }} 
    >
      Download Report
    </Button>
    </Box>
  );
}

export default GraphCustomizer;
