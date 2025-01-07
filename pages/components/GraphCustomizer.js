import { useEffect } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Box,
  ListItemText,
  Grid,
  FormControlLabel,
  Tooltip,
  IconButton,
} from '@mui/material';
import moment from 'moment';

import XLSX from 'xlsx-js-style';
import {
  getReportData,
  setAhdHeader,
  setClveHeader,
  setLveHeader,
} from '@/constants/reportFunctions';
import { buildDashboardQueryParams } from '@/utils/ui/build-dashboard-query-params';
import { buildSummarySheet } from '@/utils/ui/build-summary-sheet';
import { buildCashGrantSummaryOfFinances } from '@/utils/ui/build-cash-grant-summary-of-finances';
import { buildNilCashGrantSummaryOfFinances } from '@/utils/ui/build-nil-cash-grant-summary-of-finances';
import TextFieldWrapper from './TextFieldWrapper';

const refData = `S.no\tPrograms\tTypes\tDescription
1\tScreening /Out reach activities/ Camp\tLow Vision Screening\tLow vision screening of the school of the blind and Identification of the visually impaired for assistive technology
2\t\tIdentification of MDVI\tBeneficiaries come under Multiple disabilities and vision impairment.
3\tFunctional Vision/Early Intervention/ Vision enhancement\t\tAge group less than 7 years. Training of infants,children and parents to improve the brain’s ability to use and interpret visual information especially in kids with Cortical visual impairment (CVI)
4\tLVD beneficiairies/Comprehensive Low Vision Evaluation - CLVE\t\tLow vision assessment / Functional vision assessment done by a Professional - Optometrist / Low vision care specialist / Rehabilitation Specialist
5\tAssistive devices and aids\tAssistive devices/aids/RLF tactile books/ Optical/ Non Optical/ Electronic\tDevices for individuals with low vision and total blindness
6\tLow vision device training\tTraining is given after dispensing devices\t
7\tCounseling & referrals/ Counseling and education\tEducation and counseling\tList of referrals
8\tOrientation & Mobility training (O and M)\t\tTraining to help the visually impaired orient to the environment around and navigate safely
9\tComputer training\t\tTraining programs are conducted to build proficiency in computer skills using assistive technology like screen readers, magnification and contrast modifications
10\tMobile technologies \t\tEducating on various mobile apps for navigation and other functions
11\tVisual skills training\tAll subtypes under it as a whole\tVisual skills training greater than 7 years and adults
12\tOther training\tCorporate skill development\tComputer Programming, Digital accessibility testing DAT
13\t\tBraille Training & resources and Training with Braille reader / ORBIT reader\tTraining on Braille devices for education and Braille literacy
14\t\tTraining for Life skills/ Money identification/ Home management / Kitchen skills\t
15\t\tJob Coaching /IBPS\tIntegrated training program for Institute of Banking Personnel Selection and other job coaching
16\t\tSpoken english training\tTraining to speak in English for both beginners and Intermediate.`;
const refRows = refData.split('\n').map(row => row.split('\t'));

const hospitalAbbr = {
  "Aravind Eye Hospital, Madurai": "AEH, MDU",
  "Aravind Eye Hospital, Coimbatore": "AEH, CBE",
  "Aravind Eye Hospital, Pondicherry": "AEH, PY",
  "Aravind Eye Hospital, Tirupati": "AEH, TPTY",
  "Aravind Eye Hospital, Tirunelveli": "AEH, TVL",
  "Sankara Nethralaya, Chennai": "SN, CHE",
  "Sankara Nethralaya, Kolkata": "SN, KOL",
  "Dr. Shroff's Charity Eye Hospital": "SCEH, DL",
  "Narayana Nethralaya, Rajajinagar, Bangalore": "NN, BLR",
  "Dr. Jawahar Lal Rohatgi Eye Hospital, Kanpur": "JLR, UP",
  "Sitapur Eye Hospital, Sitapur, UP": "SEH, UP",
  "Voluntary Health Services": "VHS, CHE",
  "Community Eye Care Foundation": "CECF, PUN"
};

function GraphCustomizer({
  summary = [],
  selectedHospitals = [],
  handleHospitalSelection,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedQuarter,
  setSelectedQuarter,
  minAge,
  maxAge,
  genders,
  mdvis,
}) {
  // Define quarters covering 3 months each
  const quarters = [
    { label: 'Q4', startMonth: 9, endMonth: 11 }, // Oct - Dec
    { label: 'Q3', startMonth: 6, endMonth: 8 },  // Jul - Sep
    { label: 'Q2', startMonth: 3, endMonth: 5 },  // Apr - Jun
    { label: 'Q1', startMonth: 0, endMonth: 2 },  // Jan - Mar
  ];

  const currentMonth = moment().month();
  const currentQuarterIndex = quarters.findIndex(
    (q) => currentMonth >= q.startMonth && currentMonth <= q.endMonth
  );

  // Rotate quarters array so current quarter is first, then past quarters
  const availableQuarters = [
    ...quarters.slice(currentQuarterIndex, quarters.length),
    ...quarters.slice(0, currentQuarterIndex)
  ];

  const initialQuarterIndex = availableQuarters.findIndex(
    (q) => currentMonth >= q.startMonth && currentMonth <= q.endMonth
  );

  const setQuarter = (year, quarterIndex) => {
    if (initialQuarterIndex < quarterIndex) {
      year -= 1;
    }
    const q = availableQuarters[quarterIndex];
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

    let quarterLabel = q.label;
    setSelectedQuarter(quarterLabel);
  };

  // If no quarter is selected, default to the current quarter
  useEffect(() => {
    if (!selectedQuarter) {
      setQuarter(moment().year(), initialQuarterIndex);
    }
  }, [selectedQuarter, initialQuarterIndex]);

  const handleQuarterSelection = (event) => {
    let quarterLabel = event.target.value;
    if (quarterLabel === '') {
      setSelectedQuarter('');
      return;
    }
    const selectedIndex = availableQuarters.findIndex((q) => q.label === quarterLabel);
    setQuarter(moment().year(), selectedIndex);
  };

  const downloadFilteredReport = async () => {
    try {
      const adjustedStartDate = new Date(startDate);
      const adjustedEndDate = new Date(endDate);

      const hospitalIds = summary
        .filter((hospital) => selectedHospitals.includes(hospital.name))
        .map((hospital) => hospital.id);

      const params = {
        hospitalIds,
        startDate: adjustedStartDate.toISOString(),
        endDate: adjustedEndDate.toISOString(),
        min_age: minAge,
        max_age: maxAge,
        genders,
        mdvis,
      };

      const types = [
        "Beneficiary",
        "Vision_Enhancement",
        "Training",
        "Low_Vision_Evaluation",
        "Comprehensive_Low_Vision_Evaluation",
        "Counselling_Education"
      ];

      const apiCalls = types.map((type) => fetch(`/api/v2/dashboard/${type}?${buildDashboardQueryParams(params)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }));

      const responses = await Promise.all(apiCalls);
      const finalResult = await Promise.all(
        responses.map((res) => (res.json ? res.json().catch((err) => err) : res))
      );

      const allBeneficiaryData = finalResult[0].records.map((record) => ({
        ...record,
        'Comprehensive_Low_Vision_Evaluation': finalResult[4].records.filter((clve) => clve.beneficiaryId === record.mrn),
        'Counselling_Education': finalResult[5].records.filter((ce) => ce.beneficiaryId === record.mrn),
        'Vision_Enhancement': finalResult[1].records.filter((ve) => ve.beneficiaryId === record.mrn),
        'Training': finalResult[2].records.filter((t) => t.beneficiaryId === record.mrn),
        'Low_Vision_Evaluation': finalResult[3].records.filter((lve) => lve.beneficiaryId === record.mrn),
      }));

      const hospitalSummary = summary.filter((hospital) => selectedHospitals.includes(hospital.name)).map((hospital) => ({
        ...hospital,
        beneficiary: finalResult[0].records.filter((b) => b.hospitalId === hospital.id),
        visionEnhancement: finalResult[1].records.filter((ve) => ve.hospitalId === hospital.id),
        training: finalResult[2].records.filter((t) => t.hospitalId === hospital.id),
        lowVisionEvaluation: finalResult[3].records.filter((lve) => lve.hospitalId === hospital.id),
        comprehensiveLowVisionEvaluation: finalResult[4].records.filter((clve) => clve.hospitalId === hospital.id),
        counsellingEducation: finalResult[5].records.filter((ce) => ce.hospitalId === hospital.id),
      }));

      const reportData = getReportData(allBeneficiaryData, hospitalSummary, true);

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

      const wref = XLSX.utils.aoa_to_sheet(refRows);
      const wben = XLSX.utils.json_to_sheet(beneficiaryData);
      const wved = XLSX.utils.json_to_sheet(visionEnhancementData);

      const wlved = XLSX.utils.json_to_sheet([]);
      const wclve = XLSX.utils.json_to_sheet([]);

      const wed = XLSX.utils.json_to_sheet(electronicDevicesData);
      const wtd = XLSX.utils.json_to_sheet(trainingData);
      const wced = XLSX.utils.json_to_sheet(counsellingEducationData);

      const wahd = XLSX.utils.json_to_sheet([]);

      if (hospitalSummary.length === 1) {
        XLSX.utils.book_append_sheet(wb, buildSummarySheet(), "Summary");
        const tier = hospitalSummary[0].tier;
        if (tier === 'NIL_CASH_GRANT') {
          XLSX.utils.book_append_sheet(wb, buildNilCashGrantSummaryOfFinances(), "Summary of Finances Tier 2 & 3");
        }
        if (tier === 'RECEIVE_CASH_GRANT') {
          XLSX.utils.book_append_sheet(wb, buildCashGrantSummaryOfFinances(), "Summary of Finances");
        }
      }
      XLSX.utils.book_append_sheet(wb, wahd, "Summary of Services");
      XLSX.utils.book_append_sheet(wb, wref, "Reference");
      XLSX.utils.book_append_sheet(wb, wclve, "CLVE_LVD Beneficiaries");
      XLSX.utils.book_append_sheet(wb, wved, "Vision Enhancement Sheet");
      XLSX.utils.book_append_sheet(wb, wtd, "Training Sheet");
      XLSX.utils.book_append_sheet(wb, wced, "Counselling Education Sheet");
      XLSX.utils.book_append_sheet(wb, wlved, "Camp_Low Vision Screening");
      XLSX.utils.book_append_sheet(wb, wben, "Overall Beneficiary Sheet");
      XLSX.utils.book_append_sheet(wb, wed, "Electronic Devices Break Up");
      XLSX.utils.book_append_sheet(wb, [], "Action items from prev quarter");

      setClveHeader(wclve);
      XLSX.utils.sheet_add_json(wclve, comprehensiveLowVisionEvaluationData, {
        skipHeader: true,
        origin: -1,
      });

      setLveHeader(wlved);
      XLSX.utils.sheet_add_json(wlved, lowVisionEvaluationData, {
        skipHeader: true,
        origin: -1,
      });

      setAhdHeader(
        wahd,
        selectedHospitals,
      );
      XLSX.utils.sheet_add_json(wahd, aggregatedHospitalData, {
        skipHeader: true,
        origin: -1,
      });

      // Bold Summary of Services rows
      const rows = Array.from({ length: 8 }, (_, i) => i + 4);
      const columns = Array.from({ length: 26 }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i));
      for (const row of rows) {
        for (const column of columns) {
          const cell = column + row;
          const cellValue = wahd[cell]?.v;
          if (cellValue != null) wahd[cell].s = { font: { bold: true } };
        }
      }

      // Adjust Reference sheet column widths
      const wscols = [];
      const wrefcols = [4, 53, 66, 84];
      for (let i = 0; i < refRows[0].length; i++) {
        wscols.push({ wch: wrefcols[i] });
      }
      wref['!cols'] = wscols;

      let reportHospitalName = hospitalAbbr[selectedHospitals[0]];
      if (selectedHospitals.length === summary.length) {
        reportHospitalName = "ALL";
      } else if (selectedHospitals.length > 1) {
        reportHospitalName = "MULTI";
      } else if (reportHospitalName === undefined) {
        reportHospitalName = selectedHospitals[0];
      }
      let fileNameComponents = [];
      fileNameComponents.push("Report");
      fileNameComponents.push(reportHospitalName);
      fileNameComponents.push(adjustedStartDate.toISOString().split('T')[0]);
      fileNameComponents.push(adjustedEndDate.toISOString().split('T')[0]);
      const filename = fileNameComponents.join("_") + ".xlsx";

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Select/Unselect All */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedHospitals.length === summary.length && summary.length > 0}
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
            }
            label={
              selectedHospitals.length === summary.length
                ? 'Unselect All'
                : 'Select All'
            }
          />
        </Grid>

        {/* Hospital Selection */}
        <Grid item xs={12} sm={6} md={3}>
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
        </Grid>

        {/* Start Date */}
        <Grid item xs={12} sm={6} md={2}>
          <TextFieldWrapper
            label="Start Date"
            value={moment(startDate).format('YYYY-MM-DD')}
            setDate={setStartDate}
          />
        </Grid>

        {/* End Date */}
        <Grid item xs={12} sm={6} md={2}>
          <TextFieldWrapper
            label="End Date"
            value={moment(endDate).format('YYYY-MM-DD')}
            setDate={setEndDate}
          />
        </Grid>

        {/* Quarter Selection */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel id="quarter-select-label">Select Quarter</InputLabel>
            <Select
              labelId="quarter-select-label"
              value={selectedQuarter}
              onChange={handleQuarterSelection}
              label="Select Quarter"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {availableQuarters.map((quarter, index) => (
                <MenuItem key={quarter.label} value={quarter.label}>
                  {quarter.label + (index === 0 ? ' (Current)' : '')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Download Report Button */}
        <Grid item xs={12} sm={6} md={1}>
          <Tooltip title="Download Report">
            <IconButton
              onClick={downloadFilteredReport}
              aria-label="download report"
              sx={{
                height: '55px',
                width: '55px',
                borderRadius: '5px',
                backgroundColor: '#2074d4',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1864c4',
                },
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
}

export default GraphCustomizer;
