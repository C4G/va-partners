import { useState, useEffect } from 'react';
import moment from 'moment';
import XLSX from 'xlsx-js-style';
import { calculateAge } from "@/utils/global/calculate-age";
import {
  setAhdHeader,
  setClveHeader,
  setLveHeader,
  getReportData,
  filterTrainingSummaryByDateRange,
} from '@/constants/reportFunctions';

// Import Material-UI components
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
    summary = [],
    trainingTypes = [],
    startDate: initialStartDate,
    endDate: initialEndDate,
    selectedHospitals: initialSelectedHospitals = [],
    onClose,
  } = props;

  // Local states for filters
  const [startDate, setStartDate] = useState(
    initialStartDate || moment().subtract(1, 'year').toDate()
  );
  const [endDate, setEndDate] = useState(
    initialEndDate || moment().toDate()
  );
  const [selectedHospitals, setSelectedHospitals] = useState(
    initialSelectedHospitals || []
  );
  const [selectedGenders, setSelectedGenders] = useState([
    'M',
    'F',
    'Other',
  ]);
  const [selectedMdvi, setSelectedMdvi] = useState([
    'Yes',
    'No',
    'At Risk',
  ]);
  const [selectedSheets, setSelectedSheets] = useState([
    'Summary of Services',
    'Beneficiary',
    'Vision Enhancement',
    'Low Vision Screening',
    'Comprehensive Low Vision Evaluation',
    'Electronic Devices Break Up',
    'Training',
    'Counselling Education',
  ]);
  const [selectedTrainingTypes, setSelectedTrainingTypes] = useState(
    trainingTypes || []
  );
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(100);

  // Synchronize startDate with props
  useEffect(() => {
    if (initialStartDate) {
      setStartDate(initialStartDate);
    }
  }, [initialStartDate]);

  // Synchronize endDate with props
  useEffect(() => {
    if (initialEndDate) {
      setEndDate(initialEndDate);
    }
  }, [initialEndDate]);

  // Synchronize selectedHospitals with props
  useEffect(() => {
    if (initialSelectedHospitals) {
      setSelectedHospitals(initialSelectedHospitals);
    }
  }, [initialSelectedHospitals]);

  // Event Handlers
  const updateGender = (event) => {
    const gender = event.target.name;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedGenders((prev) => [...prev, gender]);
    } else {
      setSelectedGenders((prev) => prev.filter((g) => g !== gender));
    }
  };

  const updateMdvi = (event) => {
    const mdvi = event.target.name;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedMdvi((prev) => [...prev, mdvi]);
    } else {
      setSelectedMdvi((prev) => prev.filter((m) => m !== mdvi));
    }
  };

  const updateSheets = (event) => {
    const sheet = event.target.name;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedSheets((prev) => [...prev, sheet]);
    } else {
      setSelectedSheets((prev) => prev.filter((s) => s !== sheet));
    }
  };

  const updateTrainingTypes = (event) => {
    const trainingType = event.target.name;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedTrainingTypes((prev) => [...prev, trainingType]);
    } else {
      setSelectedTrainingTypes((prev) => prev.filter((t) => t !== trainingType));
    }
  };

  const downloadFilteredReport = async () => {
    try {
      // Fetching beneficiary list
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setUTCHours(0, 0, 0, 0);
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setUTCHours(23, 59, 59, 999);

      const selectedHospitalIds = summary
        .filter((hospital) => selectedHospitals.includes(hospital.name))
        .map((hospital) => hospital.id);

      const beneficiaryListAPI = selectedHospitalIds.map((id) =>
        fetch(
          `/api/beneficiaryList?id=${id}&startDate=${adjustedStartDate.toUTCString()}&endDate=${adjustedEndDate.toUTCString()}`,
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
      const beneficiaryList = finalResult.flat();

      const dateFilteredBeneficiaryData = filterTrainingSummaryByDateRange(
        adjustedStartDate,
        adjustedEndDate,
        beneficiaryList,
        'beneficiary'
      );

      const numTotalBeneficiaries = dateFilteredBeneficiaryData.length;

      const filteredBeneficiaryData = dateFilteredBeneficiaryData.filter(
        (item) =>
          selectedHospitalIds.includes(item.hospital.id) &&
          selectedGenders.includes(item.gender) &&
          selectedMdvi.includes(item.mDVI) &&
          minAge <= calculateAge(item.dateOfBirth) &&
          calculateAge(item.dateOfBirth) <= maxAge
      );

      const numFilteredBeneficiaries = filteredBeneficiaryData.length;

      // Filter summary data based on start and end date of the training
      const dateFilteredSummary = filterTrainingSummaryByDateRange(
        adjustedStartDate,
        adjustedEndDate,
        summary,
        'hospital'
      );

      // Filter summary data based on selected hospitals
      const filteredSummary = dateFilteredSummary.filter((item) =>
        selectedHospitalIds.includes(item.id)
      );

      // Get report data
      const reportData = getReportData(
        filteredBeneficiaryData,
        filteredSummary,
        numTotalBeneficiaries === numFilteredBeneficiaries
      );

      // Ensure all data variables are arrays
      const beneficiaryData = reportData.beneficiaryData || [];
      const visionEnhancementData = reportData.visionEnhancementData || [];
      const lowVisionEvaluationData = reportData.lowVisionEvaluationData || [];
      const comprehensiveLowVisionEvaluationData = reportData.comprehensiveLowVisionEvaluationData || [];
      const electronicDevicesData = reportData.electronicDevicesData || [];
      const trainingData = reportData.trainingData || [];
      const counsellingEducationData = reportData.counsellingEducationData || [];
      const aggregatedHospitalData = reportData.aggregatedHospitalData || [];

      const wb = XLSX.utils.book_new();

      if (selectedSheets.includes("Beneficiary")) {
        const wben = XLSX.utils.json_to_sheet(beneficiaryData);
        XLSX.utils.book_append_sheet(wb, wben, "Beneficiary Sheet");
      }

      if (selectedSheets.includes("Vision Enhancement")) {
        const wved = XLSX.utils.json_to_sheet(visionEnhancementData);
        XLSX.utils.book_append_sheet(wb, wved, "Vision Enhancement Sheet");
      }

      if (selectedSheets.includes("Low Vision Screening")) {
        const wlved = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wlved, "Low Vision Screening");
        setLveHeader(wlved);
        if (Array.isArray(lowVisionEvaluationData) && lowVisionEvaluationData.length > 0) {
          XLSX.utils.sheet_add_json(wlved, lowVisionEvaluationData, {
            skipHeader: true,
            origin: -1,
          });
        }
      }

      if (selectedSheets.includes("Comprehensive Low Vision Evaluation")) {
        const wclve = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wclve, "CLVE Sheet");
        setClveHeader(wclve);
        if (Array.isArray(comprehensiveLowVisionEvaluationData) && comprehensiveLowVisionEvaluationData.length > 0) {
          XLSX.utils.sheet_add_json(wclve, comprehensiveLowVisionEvaluationData, {
            skipHeader: true,
            origin: -1,
          });
        }
      }

      if (selectedSheets.includes("Electronic Devices Break Up")) {
        const wed = XLSX.utils.json_to_sheet(electronicDevicesData);
        XLSX.utils.book_append_sheet(wb, wed, "Electronic Devices Break Up");
      }

      if (selectedSheets.includes("Training")) {
        let finalTrainingData = trainingData;
        if (trainingTypes.length > selectedTrainingTypes.length) {
          finalTrainingData = trainingData.filter((training) =>
            selectedTrainingTypes.includes(training["Type of Training"])
          );
        }
        const wtd = XLSX.utils.json_to_sheet(finalTrainingData);
        XLSX.utils.book_append_sheet(wb, wtd, "Training Sheet");
      }

      if (selectedSheets.includes("Counselling Education")) {
        const wced = XLSX.utils.json_to_sheet(counsellingEducationData);
        XLSX.utils.book_append_sheet(wb, wced, "Counselling Education Sheet");
      }

      // Add Summary of Services sheet
      if (selectedSheets.includes("Summary of Services")) {
        const wahd = XLSX.utils.aoa_to_sheet([]);
        XLSX.utils.book_append_sheet(wb, wahd, "Summary of Services");

        // Set headers using setAhdHeader
        setAhdHeader(
          wahd,
          filteredSummary.map((hospital) => hospital.name)
        );

        // Validate aggregatedHospitalData before adding
        if (Array.isArray(aggregatedHospitalData) && aggregatedHospitalData.length > 0) {
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
          const startRow = wahd["!ref"] ? XLSX.utils.decode_range(wahd["!ref"]).e.r + 1 : 0;

          // Add data to the sheet
          XLSX.utils.sheet_add_aoa(wahd, dataToAdd, { origin: { r: startRow, c: 0 } });
        }
      }

      // Generate the filename based on the filter date range and the selected hospitals
      let reportHospitalName = "ALL";
      const selectedHospitalNames = summary
        .filter((hospital) => selectedHospitals.includes(hospital.name))
        .map((hospital) => hospital.name);

      if (selectedHospitalNames.length === 1) {
        reportHospitalName = selectedHospitalNames[0];
      } else if (selectedHospitalNames.length > 1) {
        reportHospitalName = "MULTI";
      }

      const fileNameComponents = [];
      fileNameComponents.push("Report");
      fileNameComponents.push(reportHospitalName);
      fileNameComponents.push(adjustedStartDate.toUTCString().split('T')[0]);
      fileNameComponents.push(adjustedEndDate.toUTCString().split('T')[0]);

      const filename = fileNameComponents.join("_") + ".xlsx";
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <div style={{ width: '300px', padding: '16px' }}>
      {/* Header with title and close button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <br></br>
        <Typography variant="h6">All Filters</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Gender */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><strong>Gender</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="M"
                  checked={selectedGenders.includes("M")}
                  onChange={updateGender}
                />
              }
              label="Male"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="F"
                  checked={selectedGenders.includes("F")}
                  onChange={updateGender}
                />
              }
              label="Female"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="Other"
                  checked={selectedGenders.includes("Other")}
                  onChange={updateGender}
                />
              }
              label="Other"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Age */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><strong>Age</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <TextField
              label="Minimum Age"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value))}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Maximum Age"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              fullWidth
              margin="normal"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* MDVI */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><strong>MDVI</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="Yes"
                  checked={selectedMdvi.includes("Yes")}
                  onChange={updateMdvi}
                />
              }
              label="Yes"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="No"
                  checked={selectedMdvi.includes("No")}
                  onChange={updateMdvi}
                />
              }
              label="No"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="At Risk"
                  checked={selectedMdvi.includes("At Risk")}
                  onChange={updateMdvi}
                />
              }
              label="At Risk"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Sheets to Include */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><strong>Sheets To Include</strong></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {[
              'Summary of Services',
              'Beneficiary',
              'Vision Enhancement',
              'Low Vision Screening',
              'Comprehensive Low Vision Evaluation',
              'Electronic Devices Break Up',
              'Training',
              'Counselling Education',
            ].map((sheet) => (
              <FormControlLabel
                key={sheet}
                control={
                  <Checkbox
                    name={sheet}
                    checked={selectedSheets.includes(sheet)}
                    onChange={updateSheets}
                  />
                }
                label={sheet}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Training Types */}
      {selectedSheets.includes("Training") && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography><strong>Training Types</strong></Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {trainingTypes && trainingTypes.length > 0 ? (
                trainingTypes.map((type) => (
                  <FormControlLabel
                    key={type}
                    control={
                      <Checkbox
                        name={type}
                        checked={selectedTrainingTypes.includes(type)}
                        onChange={updateTrainingTypes}
                      />
                    }
                    label={type}
                  />
                ))
              ) : (
                <Typography>No training types available</Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          downloadFilteredReport();
        }}
        fullWidth
        style={{ marginTop: '16px' }}
      >
        Download Customized Report
      </Button>
    </div>
  );
}

export default ReportCustomizer;