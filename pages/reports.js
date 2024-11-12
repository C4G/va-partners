import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler, // If you're using any filling effects
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register Filler if used
);
import { readUser } from "./api/user";
import { getSession } from "next-auth/react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import {
  findAllHospital,
} from "@/pages/api/hospital";
import { Container } from "react-bootstrap";
import Navigation from "./navigation/Navigation";
import Layout from './components/layout';
import moment from "moment";
import { useState, useEffect } from "react";
import GraphCustomizer from "./components/GraphCustomizer";
import { Tab, Tabs, Paper } from "@mui/material";
import ReportCustomizer from './customizedReport';
import { AgGridReact } from 'ag-grid-react'; 
import "ag-grid-community/styles/ag-grid.css"; 
import "ag-grid-community/styles/ag-theme-quartz.css"; 
import EditIcon from '@mui/icons-material/Edit';
import { Drawer, IconButton, Button, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useDebounce } from "utils/global/useDebounce";
import { buildDashboardQueryParams } from '@/utils/ui/build-dashboard-query-params';

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);

  if (session == null) {
    console.log("session is null");
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
      props: {
        user: null,
        users: [],
      },
    };
  }

  // If it's a non admin user, we only want to show their hospital(s)
  const user = await readUser(session.user.email);
  const isAdmin = Boolean(user.admin);
  
  let hospitals = await findAllHospital();

  if (!isAdmin) {
    hospitals = hospitals.filter((hospital) => user.hospitalRoles.map(role => role.hospitalId).includes(hospital.id));
  }


  // We return summary counts and paginated summaries for user hospital(s).
  // TODO: Add API endpoints for these and call on download report click
  // const summary = await getHospitalsSummaries(hospitalIds) || [];
  
  // const summaryCounts = await getHospitalsSummariesCounts(hospitalIds);

  return {
    props: {
      hospitals: JSON.parse(JSON.stringify(hospitals)),
      user: JSON.parse(JSON.stringify(user)),
      // summary: JSON.parse(JSON.stringify([])),
      // summaryCounts: JSON.parse(JSON.stringify([])),
      error: null,
    },
  };
}

// Configure Chart data label plugin globally
ChartJS.register(ChartDataLabels);
ChartJS.defaults.plugins.datalabels.font.size = 16;
ChartJS.defaults.plugins.datalabels.font.weight = "bold";
ChartJS.defaults.plugins.datalabels.display = function(context){
  return context.dataset.data[context.dataIndex] != 0;
};

// Graph Options that are constant for all graphs
const graphOptions = {
  backgroundColor: [
    "rgba(255, 99, 132, 0.2)",
    "rgba(54, 162, 235, 0.2)",
    "rgba(255, 206, 86, 0.2)",
    "rgba(75, 192, 192, 0.2)",
    "rgba(153, 102, 255, 0.2)",
    "rgba(255, 159, 64, 0.2)",
    "rgba(255, 99, 132, 0.2)",
    "rgba(119, 221, 119, 0.2)",
  ],
  borderColor: [
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(255, 99, 132, 1)",
    "rgba(119, 221, 119, 1)",
  ],
  borderWidth: 1,
};


// Function to compute total sessions
function computeTotalSessions(countsData) {
  if (!countsData) return 0;
  const activityCounts = [
    countsData["Low_Vision_Evaluation"] || 0,
    countsData["Comprehensive_Low_Vision_Evaluation"] || 0,
    countsData["Vision_Enhancement"] || 0,
    countsData["Training"] || 0,
    countsData["Mobile_Training"] || 0,
    countsData["Computer_Training"] || 0,
    countsData["Orientation_Mobility_Training"] || 0,
    countsData["Counselling_Education"] || 0,
  ];
  const totalSessions = activityCounts.reduce((sum, count) => sum + count, 0);
  return totalSessions;
}

// Function to build the Activities Graph using countsData
function buildActivitiesGraph(countsData) {
  if (!countsData) return null;

  const lowVisionScreeningCount = countsData["Low_Vision_Evaluation"] || 0;
  const comprehensiveLowVisionEvaluationCount = countsData["Comprehensive_Low_Vision_Evaluation"] || 0;
  const visionEnhancementCount = countsData["Vision_Enhancement"] || 0;

  const mobileTrainingCount = countsData["Mobile_Training"] || 0;
  const computerTrainingCount = countsData["Computer_Training"] || 0;
  const orientationMobilityTrainingCount = countsData["Orientation_Mobility_Training"] || 0;
  const trainingCount =
    (countsData["Training"] || 0) +
    mobileTrainingCount +
    computerTrainingCount +
    orientationMobilityTrainingCount;

  const counsellingCount = countsData["Counselling_Education"] || 0;

  const chartData = {
    labels: [
      `Low Vision Screening (${lowVisionScreeningCount})`,
      `Comprehensive Low Vision Evaluation (${comprehensiveLowVisionEvaluationCount})`,
      `Vision Enhancement (${visionEnhancementCount})`,
      `All Training (${trainingCount})`,
      `All Counselling (${counsellingCount})`,
    ],
    datasets: [
      {
        label: "Cumulative Counts",
        data: [
          lowVisionScreeningCount,
          comprehensiveLowVisionEvaluationCount,
          visionEnhancementCount,
          trainingCount,
          counsellingCount,
        ],
        ...graphOptions,
      },
    ],
  };

  return chartData;
}


function buildBreakdownGraph(countsData, breakdownType) {
  let typeCounts = {};

  if (breakdownType === 'training') {
    if (!countsData['Training_Subtypes']) {
      console.error('Training subtypes data not available in countsData');
      return null;
    }
    typeCounts = countsData['Training_Subtypes'];
  } else if (breakdownType === 'counsellingEducation') {
    if (!countsData['Counselling_Types']) {
      console.error('Counselling types data not available in countsData');
      return null;
    }
    typeCounts = countsData['Counselling_Types'];
  } else {
    console.error('Invalid breakdownType:', breakdownType);
    return null;
  }

  const labels = Object.keys(typeCounts);
  const dataPoints = Object.values(typeCounts);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Cumulative Counts',
        data: dataPoints,
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

function buildDevicesGraph(countsData) {
  if (!countsData || countsData['Devices_Dispensed'] === undefined || countsData['Devices_Dispensed'] === null) {
    console.error('Devices dispensed data not available in countsData');
    return {
      labels: [],
      datasets: [],
    }; // Return empty chart data
  }

  const devicesCounts = countsData['Devices_Dispensed'];

  const dispensedSpectacleCount = devicesCounts['Spectacle'] || 0;
  const dispensedElectronicCount = devicesCounts['Electronic'] || 0;
  const dispensedOpticalCount = devicesCounts['Optical'] || 0;
  const dispensedNonOpticalCount = devicesCounts['NonOptical'] || 0;

  const chartData = {
    labels: [
      `Spectacle (${dispensedSpectacleCount})`,
      `Electronic (${dispensedElectronicCount})`,
      `Optical (${dispensedOpticalCount})`,
      `Non-Optical (${dispensedNonOpticalCount})`,
    ],
    datasets: [
      {
        label: 'Cumulative Counts',
        data: [
          dispensedSpectacleCount,
          dispensedElectronicCount,
          dispensedOpticalCount,
          dispensedNonOpticalCount,
        ],
        ...graphOptions,
      },
    ],
  };

  return chartData;
}



function buildSessionsGraph(totalSessions) {
  return {
    labels: ["Total Sessions"],
    datasets: [
      {
        label: "Number of Sessions",
        data: [totalSessions],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };
}

function buildTotalBeneficiariesGraph(totalBeneficiaries) {
  return {
    labels: ["Total Beneficiaries"],
    datasets: [
      {
        label: "Number of Beneficiaries",
        data: [totalBeneficiaries],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };
}

function buildUniqueBeneficiariesGraph(uniqueBeneficiaries) {
  return {
    labels: ["Unique Beneficiaries"],
    datasets: [
      {
        label: "Unique Beneficiaries",
        data: [uniqueBeneficiaries],
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };
}

function buildRecDevicesGraph(countsData) {
  if (!countsData['Devices_Recommended']) {
    console.error('Devices recommended data not available in countsData');
    return null;
  }

  const devicesCounts = countsData['Devices_Recommended'];

  const recommendedSpectacleCount = devicesCounts['Spectacle'] || 0;
  const recommendedElectronicCount = devicesCounts['Electronic'] || 0;
  const recommendedOpticalCount = devicesCounts['Optical'] || 0;
  const recommendedNonOpticalCount = devicesCounts['NonOptical'] || 0;

  const chartData = {
    labels: [
      `Spectacle (${recommendedSpectacleCount})`,
      `Electronic (${recommendedElectronicCount})`,
      `Optical (${recommendedOpticalCount})`,
      `Non-Optical (${recommendedNonOpticalCount})`,
    ],
    datasets: [
      {
        label: 'Cumulative Counts',
        data: [
          recommendedSpectacleCount,
          recommendedElectronicCount,
          recommendedOpticalCount,
          recommendedNonOpticalCount,
        ],
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

function buildDevicesBreakdownGraph(countsData, breakdownType) {
  if (!countsData['Devices_Dispensed']) {
    console.error('Devices dispensed data not available in countsData');
    return null;
  }

  const devicesCounts = countsData['Devices_Dispensed_Details'] || {};
  const typeCounts = devicesCounts[breakdownType] || {};

  const labels = Object.keys(typeCounts);
  const dataPoints = Object.values(typeCounts);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Dispensed ${breakdownType} Devices`,
        data: dataPoints,
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

function buildRecDevicesBreakdownGraph(countsData, breakdownType) {
  if (!countsData['Devices_Recommended']) {
    console.error('Devices recommended data not available in countsData');
    return null;
  }

  const devicesCounts = countsData['Devices_Recommended_Details'] || {};
  const typeCounts = devicesCounts[breakdownType] || {};

  const labels = Object.keys(typeCounts);
  const dataPoints = Object.values(typeCounts);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Recommended ${breakdownType} Devices`,
        data: dataPoints,
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function buildGenderGraph(beneficiaries) {
  const maleCount = beneficiaries.filter(user => user.gender && (user.gender.toLowerCase() === 'male' || user.gender.toLowerCase() === 'm')).length;

  const femaleCount = beneficiaries.filter(user => user.gender && (user.gender.toLowerCase() === 'female' || user.gender.toLowerCase() === 'f')).length;

  const chartData = {
    labels: ["Male", "Female"],
    datasets: [
      {
        label: "Gender Distribution",
        data: [maleCount, femaleCount],
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

function buildAgeGraph(beneficiaries) {
  const ageGroups = {
    "0-18": 0,
    "19-35": 0,
    "36-50": 0,
    "51-65": 0,
    "66+": 0
  };

  beneficiaries.forEach(user => {
    const age = calculateAge(user.dateOfBirth);
    if (age !== null) {
      if (age <= 18) ageGroups["0-18"]++;
      else if (age <= 35) ageGroups["19-35"]++;
      else if (age <= 50) ageGroups["36-50"]++;
      else if (age <= 65) ageGroups["51-65"]++;
      else ageGroups["66+"]++;
    }
  });

  const chartData = {
    labels: Object.keys(ageGroups),
    datasets: [
      {
        label: "Age Distribution",
        data: Object.values(ageGroups),
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

const EditButtonRenderer = (props) => {
  const mrn = props.data.mrn;
  const hospitalId = props.data.hospitalId;

  return (
    <IconButton
      color="primary"
      onClick={() => {
        const url = `/user?mrn=${encodeURIComponent(mrn)}&hospitalId=${encodeURIComponent(hospitalId)}`;
        window.location.href = url;
      }}
    >
      <EditIcon />
    </IconButton>
  );
};

export default function Summary({
  user,
  hospitals,
  trainingTypes,
  trainingSubTypes,
  
}) {
  // create start date and end data states, start date is set to one year ago, end date is set to today
  const [startDate, setStartDate] = useState(
    moment().subtract(1, "year").toDate()
  );
  const [endDate, setEndDate] = useState(moment().toDate());
  const debouncedStartDate = useDebounce(startDate, 500); // 30 seconds in milliseconds
  const debouncedEndDate = useDebounce(endDate, 500);

  const [masterTabIndex, setMasterTabIndex] = useState(0); // State to manage the master tab (Table/Graph)
  const [subTabIndex, setSubTabIndex] = useState(0); // State for sub-tabs within Beneficiaries
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedHospitalNames, setSelectedHospitalNames] = useState([]);

  const [countsData, setCountsData] = useState(null);

  // State variables to track data fetching
  const [hasFetchedBeneficiaries, setHasFetchedBeneficiaries] = useState(false);
  const [hasFetchedVisionEnhancements, setHasFetchedVisionEnhancements] = useState(false);
  const [hasFetchedTrainings, setHasFetchedTrainings] = useState(false);
  const [hasFetchedComprehensiveLowVisionEvaluations, setHasFetchedComprehensiveLowVisionEvaluations] = useState(false);
  const [hasFetchedCounsellingEducations, setHasFetchedCounsellingEducations] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [uniqueBeneficiaries, setUniqueBeneficiaries] = useState(0);


  const [beneficiaries, setBeneficiaries] = useState([]);
  const [visionEnhancements, setVisionEnhancements] = useState([]);
  const [comprehensiveLowVisionEvaluations, setComprehensiveLowVisionEvaluations] = useState([]); 
  const [counsellingEducations, setCounsellingEducations] = useState([]);


    // Add state variables for filters
    const [selectedGenders, setSelectedGenders] = useState(['Male','Female', 'Other']);
    const [selectedMdvi, setSelectedMdvi] = useState(['Yes', 'No']);
    const [minAge, setMinAge] = useState(0);
    const [maxAge, setMaxAge] = useState(100);

  const [trainings, setTrainings] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);



const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };


  const [counsellingEducationColDefs] = useState([
    { 
      field: "id", 
      headerName: "ID", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "beneficiaryId", 
      headerName: "Beneficiary ID", 
      filter: true, 
      sortable: true 
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || '',
      filter: true,
      sortable: true,
    },
    { 
      field: "hospitalId", 
      headerName: "Hospital ID", 
      filter: true, 
      sortable: true 
    },
    {
      headerName: "Hospital Name",
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || '',
      filter: true,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    { 
      field: "sessionNumber", 
      headerName: "Session Number", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "typeCounselling", 
      headerName: "Type of Counselling", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "type", 
      headerName: "Type", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "vision", 
      headerName: "Vision", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "MDVI", 
      headerName: "MDVI", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "extraInformation", 
      headerName: "Extra Information", 
      filter: true, 
      sortable: true,
      cellStyle: { whiteSpace: 'normal', wordWrap: 'break-word' }, // For better text display
    },
  ]);

    // Fetch counts data using the counts.js API
    useEffect(() => {
      if (selectedHospitals.length === 0) {
        return;
      }
  
      const fetchCountsData = async () => {
        try {
          const startDateUTC = debouncedStartDate ? new Date(debouncedStartDate) : null;
          const endDateUTC = debouncedEndDate ? new Date(debouncedEndDate) : null;
  
          const queryParams = new URLSearchParams();
  
          if (startDateUTC) queryParams.append('startDate', startDateUTC.toISOString());
          if (endDateUTC) queryParams.append('endDate', endDateUTC.toISOString());
  
          selectedHospitals.forEach((id) => queryParams.append("hospitalIds", id));
          // selectedGenders.forEach((gender) => queryParams.append("genders", gender));
          // selectedMdvi.forEach((mdvi) => queryParams.append("mdvis", mdvi));
          // if (minAge !== undefined) queryParams.append("min_age", minAge);
          // if (maxAge !== undefined) queryParams.append("max_age", maxAge);
          console.log(`/api/v2/dashboard/count?${queryParams.toString()}`)
          const response = await fetch(`/api/v2/dashboard/count?${queryParams.toString()}`);

          const data = await response.json();
  
          if (response.ok) {
            setCountsData(data);
          } else {
            console.error("Error fetching counts data:", data.error);
            setCountsData(null);
          }
        } catch (error) {
          console.error("Error fetching counts data:", error);
          setCountsData(null);
        }
      };
  
      fetchCountsData();
    }, [
      selectedHospitals,
      debouncedStartDate,
      debouncedEndDate,
      selectedGenders,
      selectedMdvi,
      minAge,
      maxAge,
    ]);

  // Update total sessions and beneficiaries when countsData changes
  useEffect(() => {
    if (countsData) {
      console.log('countsData in state:', countsData);
      const totalSessions = computeTotalSessions(countsData);
      setTotalSessions(totalSessions);
      setUniqueBeneficiaries(countsData["Beneficiary"] || 0);
      setTotalBeneficiaries(countsData["Beneficiary"] || 0);
    }
  }, [countsData]);

  useEffect(() => {
    setHasFetchedBeneficiaries(false);
    setHasFetchedVisionEnhancements(false);
    setHasFetchedTrainings(false);
    setHasFetchedComprehensiveLowVisionEvaluations(false);
    setHasFetchedCounsellingEducations(false);

    setBeneficiaries([]);
    setVisionEnhancements([]);
    setTrainings([]);
    setComprehensiveLowVisionEvaluations([]);
    setCounsellingEducations([]);
  }, [selectedHospitals, startDate, endDate, selectedGenders, selectedMdvi, minAge, maxAge]);

    // Fetch data based on active tab
    useEffect(() => {
      if (selectedHospitals.length === 0) {
        return;
      }
  
      const fetchDataForTab = async () => {
        setIsLoading(true);
        try {
          // Prepare query parameters
          const startDateUTC = new Date(startDate);
          startDateUTC.setUTCHours(0, 0, 0, 0);
          const endDateUTC = new Date(endDate);
          endDateUTC.setUTCHours(23, 59, 59, 999);

          const params = {
            offset: 0,
            limit: 100,
            startDate: startDateUTC.toISOString(),
            endDate: endDateUTC.toISOString(),
            min_age: minAge,
            max_age: maxAge,
            hospitalIds: selectedHospitals,
            genders: selectedGenders,
            mdvis: selectedMdvi,
          }
  
          // Fetch data based on the active subTabIndex
          switch (subTabIndex) {
            case 0: // Beneficiaries
              if (!hasFetchedBeneficiaries) {
                const response = await fetch(`/api/v2/dashboard/Beneficiary?${buildDashboardQueryParams(params)}`);
                const data = await response.json();
                if (response.ok) {
                  setBeneficiaries(data.records || []);
                  setHasFetchedBeneficiaries(true);
                } else {
                  console.error("Error fetching beneficiaries:", data.error);
                }
              }
              break;
            case 1: // Vision Enhancements
              if (!hasFetchedVisionEnhancements) {
                const response = await fetch(`/api/v2/dashboard/Vision_Enhancement?${buildDashboardQueryParams(params)}`);
                const data = await response.json();
                if (response.ok) {
                  setVisionEnhancements(data.records || []);
                  setHasFetchedVisionEnhancements(true);
                } else {
                  console.error("Error fetching vision enhancements:", data.error);
                }
              }
              break;
            case 2: // Trainings
              if (!hasFetchedTrainings) {
                const response = await fetch(`/api/v2/dashboard/Training?${buildDashboardQueryParams(params)}`);
                const data = await response.json();
                if (response.ok) {
                  setTrainings(data.records || []);
                  setHasFetchedTrainings(true);
                } else {
                  console.error("Error fetching trainings:", data.error);
                }
              }
              break;
            case 3: // Comprehensive Low Vision Evaluations
              if (!hasFetchedComprehensiveLowVisionEvaluations) {
                const response = await fetch(`/api/v2/dashboard/Comprehensive_Low_Vision_Evaluation?${buildDashboardQueryParams(params)}`);
                const data = await response.json();
                if (response.ok) {
                  setComprehensiveLowVisionEvaluations(data.records || []);
                  setHasFetchedComprehensiveLowVisionEvaluations(true);
                } else {
                  console.error("Error fetching Comprehensive Low Vision Evaluations:", data.error);
                }
              }
              break;
            case 4: // Counselling Educations
              if (!hasFetchedCounsellingEducations) {
                const response = await fetch(`/api/v2/dashboard/Counselling_Education?${buildDashboardQueryParams(params)}`);
                const data = await response.json();
                if (response.ok) {
                  setCounsellingEducations(data.records || []);
                  setHasFetchedCounsellingEducations(true);
                } else {
                  console.error("Error fetching Counselling Educations:", data.error);
                }
              }
              break;
            default:
              break;
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchDataForTab();
    }, [
      subTabIndex,
      selectedHospitals,
      startDate,
      endDate,
      selectedGenders,
      selectedMdvi,
      minAge,
      maxAge,
      hasFetchedBeneficiaries,
      hasFetchedVisionEnhancements,
      hasFetchedTrainings,
      hasFetchedComprehensiveLowVisionEvaluations,
      hasFetchedCounsellingEducations,
    ]);

  const [comprehensiveLowVisionEvaluationColDefs] = useState([
    { 
      field: "id", 
      headerName: "ID", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "beneficiaryId", 
      headerName: "Beneficiary ID", 
      filter: true, 
      sortable: true 
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || '',
      filter: true,
      sortable: true,
    },
    { 
      field: "hospitalId", 
      headerName: "Hospital ID", 
      filter: true, 
      sortable: true 
    },
    {
      headerName: "Hospital Name",
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || '',
      filter: true,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    { 
      field: "sessionNumber", 
      headerName: "Session Number", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "distanceVisualAcuityRE", 
      headerName: "Distance Visual Acuity RE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "distanceVisualAcuityLE", 
      headerName: "Distance Visual Acuity LE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "nearVisualAcuityRE", 
      headerName: "Near Visual Acuity RE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "nearVisualAcuityLE", 
      headerName: "Near Visual Acuity LE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "distanceBinocularVisionBE", 
      headerName: "Distance Binocular Vision BE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "nearBinocularVisionBE", 
      headerName: "Near Binocular Vision BE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "colourVisionRE", 
      headerName: "Colour Vision RE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "colourVisionLE", 
      headerName: "Colour Vision LE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "contrastSensitivityRE", 
      headerName: "Contrast Sensitivity RE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "contrastSensitivityLE", 
      headerName: "Contrast Sensitivity LE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "visualFieldsRE", 
      headerName: "Visual Fields RE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "visualFieldsLE", 
      headerName: "Visual Fields LE", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costElectronic", 
      headerName: "Cost Electronic", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costNonOptical", 
      headerName: "Cost Non-Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costOptical", 
      headerName: "Cost Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costSpectacle", 
      headerName: "Cost Spectacle", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costToBeneficiaryElectronic", 
      headerName: "Cost to Beneficiary Electronic", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costToBeneficiaryNonOptical", 
      headerName: "Cost to Beneficiary Non-Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costToBeneficiaryOptical", 
      headerName: "Cost to Beneficiary Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "costToBeneficiarySpectacle", 
      headerName: "Cost to Beneficiary Spectacle", 
      filter: true, 
      sortable: true 
    },
    {
      field: "dispensedDateElectronic",
      headerName: "Dispensed Date Electronic",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    {
      field: "dispensedDateNonOptical",
      headerName: "Dispensed Date Non-Optical",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    {
      field: "dispensedDateOptical",
      headerName: "Dispensed Date Optical",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    {
      field: "dispensedDateSpectacle",
      headerName: "Dispensed Date Spectacle",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    { 
      field: "dispensedElectronic", 
      headerName: "Dispensed Electronic", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "dispensedNonOptical", 
      headerName: "Dispensed Non-Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "dispensedOptical", 
      headerName: "Dispensed Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "dispensedSpectacle", 
      headerName: "Dispensed Spectacle", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "recommendationElectronic", 
      headerName: "Recommendation Electronic", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "recommendationNonOptical", 
      headerName: "Recommendation Non-Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "recommendationOptical", 
      headerName: "Recommendation Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "recommendationSpectacle", 
      headerName: "Recommendation Spectacle", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "trainingGivenElectronic", 
      headerName: "Training Given Electronic", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "trainingGivenNonOptical", 
      headerName: "Training Given Non-Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "trainingGivenOptical", 
      headerName: "Training Given Optical", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "trainingGivenSpectacle", 
      headerName: "Training Given Spectacle", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "mdvi", 
      headerName: "MDVI", 
      filter: true, 
      sortable: true 
    },
  ]);

  const [trainingColDefs] = useState([
    { 
      field: "id", 
      headerName: "ID", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "beneficiaryId", 
      headerName: "Beneficiary ID", 
      filter: true, 
      sortable: true 
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || '',
      filter: true,
      sortable: true,
    },
    { 
      field: "hospitalId", 
      headerName: "Hospital ID", 
      filter: true, 
      sortable: true 
    },
    {
      field: "hospital.name",
      headerName: "Hospital Name",
      filter: true,
      sortable: true,
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || '',
    },
    {
      field: "date",
      headerName: "Date",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    { 
      field: "sessionNumber", 
      headerName: "Session Number", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "extraInformation", 
      headerName: "Extra Information", 
      filter: true, 
      sortable: true,
      cellStyle: { whiteSpace: 'normal', wordWrap: 'break-word' }, // For better text display
    },
    { 
      field: "type", 
      headerName: "Type", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "subType", 
      headerName: "Sub-Type", 
      filter: true, 
      sortable: true 
    },
  ]);

  const [visionEnhancementColDefs] = useState([
    { 
      field: "id", 
      headerName: "ID", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "beneficiaryId", 
      headerName: "Beneficiary ID", 
      filter: true, 
      sortable: true 
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || '',
      filter: true,
      sortable: true,
    },
    { 
      field: "hospitalId", 
      headerName: "Hospital ID", 
      filter: true, 
      sortable: true 
    },
    {
      field: "hospital.name",
      headerName: "Hospital Name",
      filter: true,
      sortable: true,
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || '',
    },
    {
      field: "date",
      headerName: "Date",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    { 
      field: "sessionNumber", 
      headerName: "Session Number", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "extraInformation", 
      headerName: "Extra Information", 
      filter: true, 
      sortable: true,
      cellStyle: { whiteSpace: 'normal', wordWrap: 'break-word' }, // For better text display
    },
    { 
      field: "Diagnosis", 
      headerName: "Diagnosis", 
      filter: true, 
      sortable: true 
    },
    { 
      field: "MDVI", 
      headerName: "MDVI", 
      filter: true, 
      sortable: true 
    },
  ]);

  const [colDefs] = useState([
    {
      headerName: "Edit",
      cellRenderer: EditButtonRenderer,
      width: 150,
      filter: false,
      sortable: false,
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
    },
    { field: "mrn", headerName: "MRN", filter: true, sortable: true },
    { field: "beneficiaryName", headerName: "Beneficiary Name", filter: true, sortable: true },
    { field: "hospitalId", headerName: "Hospital ID", filter: true, sortable: true },
    {
      field: "hospital.name",
      headerName: "Hospital Name",
      filter: true,
      sortable: true,
      valueGetter: (params) => params.data.hospital?.name || '',
    },
    {
      field: "dateOfBirth",
      headerName: "Date of Birth",
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format('YYYY-MM-DD') : '';
      },
    },
    {
      headerName: "Age",
      field: "age",
      valueGetter: (params) => {
        if (params.data.dateOfBirth) {
          const birthDate = new Date(params.data.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        } else {
          return '';
        }
      },
      filter: true,
      sortable: true,
    },
    {
      field: "gender",
      headerName: "Gender",
      filter: true,
      sortable: true,
      valueFormatter: (params) => {
        if (params.value) {
          const gender = params.value.toLowerCase();
          if (gender === 'male' || gender === 'm') {
            return 'M';
          } else if (gender === 'female' || gender === 'f') {
            return 'F';
          }
        }
        return '';
      },
    },
    { field: "phoneNumber", headerName: "Phone Number", filter: true, sortable: true },
    { field: "education", headerName: "Education", filter: true, sortable: true },
    { field: "occupation", headerName: "Occupation", filter: true, sortable: true },
    { field: "districts", headerName: "District", filter: true, sortable: true },
    { field: "state", headerName: "State", filter: true, sortable: true },
    { field: "diagnosis", headerName: "Diagnosis", filter: true, sortable: true },
    { field: "vision", headerName: "Vision", filter: true, sortable: true },
    {
      field: "mDVI",
      headerName: "MDVI",
      filter: true,
      sortable: true,
      valueFormatter: (params) => (params.value ? 'Yes' : 'No'),
    },
    { field: "extraInformation", headerName: "Extra Information", filter: true, sortable: true },
  ]);
  

  const handleSubTabChange = (event, newValue) => {
    setSubTabIndex(newValue);
  };


  useEffect(() => {
    setSelectedHospitals([hospitals?.[0]?.id]);
  }, [hospitals]);

  useEffect(() => {
    setSelectedHospitalNames([hospitals?.[0]?.name]);
  }, [hospitals]);

  const handleMultiSelectChange = (e) => {
    const {
      target: { value },
    } = e;
    setSelectedHospitalNames(value);
    setSelectedHospitals(
      hospitals
        .filter((hospital) => value.includes(hospital.name))
        .map((hospital) => hospital.id)
    );
  };

  const handleAllSelect = (e, allSelect) => {
    if (allSelect) {
      setSelectedHospitals(hospitals.map((item) => item.id));
      setSelectedHospitalNames(hospitals.map((item) => item.name));
    } else {
      setSelectedHospitals([]);
      setSelectedHospitalNames([]);
    }
  };
  

  // generate all the data for required graphs
  const genderGraphData = buildGenderGraph(beneficiaries);
  const ageGraphData = buildAgeGraph(beneficiaries);
  
  // const devicesGraphData = countsData ? buildDevicesGraph(countsData) : null;
  const recDevicesGraphData = countsData ? buildRecDevicesGraph(countsData) : null;
  const electronicRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'Electronic') : null;
  const spectacleRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'Spectacle') : null;
  const opticalRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'Optical') : null;
  const nonOpticalRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'NonOptical') : null;


  const [activeGraphTab, setActiveGraphTab] = useState(0);
  const [activeBeneficiaryGraphTab, setActiveBeneficiaryGraphTab] = useState(0);

  const [activeDevicesGraphTab, setActiveDevicesGraphTab] = useState(0);
  const [activeRecDevicesGraphTab, setActiveRecDevicesGraphTab] = useState(0);
  const [activeActivitiesGraphTab, setActiveActivitiesGraphTab] = useState(0);

  const options={
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  const renderGraph = () => {
    if (selectedHospitals.length === 0) {
      return <p><br></br>Please select hospitals to view the graphs.</p>;
    }
    switch (activeGraphTab) {
      case 0:
        switch (activeBeneficiaryGraphTab) {
          case 0:
            return <Bar data={buildTotalBeneficiariesGraph(totalBeneficiaries)} />;
          case 1:
            return <Bar data={buildUniqueBeneficiariesGraph(uniqueBeneficiaries)} />;
          case 2:
              return <Bar data={buildSessionsGraph(totalSessions)} />;
          case 3:
            return <Bar data={genderGraphData} options={options} />;
          case 4:
            return <Bar data={ageGraphData} options={options} />;
          default:
            return null;
        }
      case 1:
        // if (isTrainingDrillDownActive) {
        //   // Drill Down View to be added
        // }
        switch (activeActivitiesGraphTab) {
          case 0:
            return countsData ? (
              <Bar data={buildActivitiesGraph(countsData)} options={options} />
            ) : (
              <p>Loading...</p>
            );
          case 1:
            return countsData ? (
              <Bar data={buildBreakdownGraph(countsData, 'training')} options={options} />
            ) : (
              <p>Loading...</p>
            );
          case 2:
            return countsData ? (
              <Bar data={buildBreakdownGraph(countsData, 'counsellingEducation')} options={options} />
            ) : (
              <p>Loading...</p>
            );
          default:
            return null;
        }
      case 2:
        switch (activeDevicesGraphTab) {
          case 0:
            return countsData ? (
              <Bar data={buildDevicesGraph(countsData)} options={options} />
            ) : (
              <p>Loading...</p>
            );
          case 1:
            return countsData ? (
              <Bar data={buildDevicesBreakdownGraph(countsData, 'Electronic')} options={options} />
            ) : (
              <p>Loading...</p>
            );
          case 2:
            return countsData ? (
              <Bar data={buildDevicesBreakdownGraph(countsData, 'Spectacle')} options={options} />
            ) : (
              <p>Loading...</p>
            );
          case 3:
              return countsData ? (
                <Bar data={buildDevicesBreakdownGraph(countsData, 'Optical')} options={options} />
              ) : (
                <p>Loading...</p>
              );
          case 4:
              return countsData ? (
                <Bar data={buildDevicesBreakdownGraph(countsData, 'NonOptical')} options={options} />
              ) : (
                <p>Loading...</p>
              );
          default:
            return null;
        }
        case 3:
          switch (activeRecDevicesGraphTab) {
            case 0:
              return <Bar data={recDevicesGraphData} options={options} />;
            case 1:
              return <Bar data={electronicRecDevicesGraphData} options={options} />;
            case 2:
              return <Bar data={spectacleRecDevicesGraphData} options={options} />;
            case 3:
                return <Bar data={opticalRecDevicesGraphData} options={options} />;
            case 4:
                return <Bar data={nonOpticalRecDevicesGraphData} options={options} />;
            default:
              return null;
          }
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="content">
        <Navigation user={user} />
        <Container className="p-3">
            {/* All Filters button next to Select Quarter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <GraphCustomizer
              user={user}
              summary={hospitals}
              selectedHospitals={selectedHospitalNames}
              handleHospitalSelection={handleMultiSelectChange}
              startDate={startDate}
              handleStartDateChange={(e) => setStartDate(moment(e.target.value).toDate())}
              endDate={endDate}
              handleEndDateChange={(e) => setEndDate(moment(e.target.value).toDate())}
              handleAllSelect={handleAllSelect}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              minAge={minAge}
              maxAge={maxAge}
              genders={selectedGenders}
              mdvis={selectedMdvi}
            />

            {/* All Filters Button */}
            <Button
              variant="contained"
              startIcon={<MenuIcon />}
              onClick={handleDrawerOpen}
              sx={{ marginLeft: 0, width: '160px', height:'55px' }}
            >
              All Filters
            </Button>
          </Box>

          {/* Drawer component to hold filters */}
          <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}>
            <Box
              sx={{ width: 310 }}
              role="presentation"
            >
              <ReportCustomizer
              user={user}
                summary={hospitals}
                trainingTypes={trainingTypes}
                trainingSubTypes={trainingSubTypes}
                startDate={startDate}
                endDate={endDate}
                selectedHospitals={selectedHospitalNames}
                selectedGenders={selectedGenders}
                setSelectedGenders={setSelectedGenders}
                selectedMdvi={selectedMdvi}
                setSelectedMdvi={setSelectedMdvi}
                minAge={minAge}
                setMinAge={setMinAge}
                maxAge={maxAge}
                setMaxAge={setMaxAge}
                onClose={handleDrawerClose}
              />
            </Box>
          </Drawer>

          {/* Master Tab - Toggle between Table, Graphs, and Download */}
          <Tabs
            value={masterTabIndex}
            onChange={(event, newValue) => setMasterTabIndex(newValue)}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Table" />
            <Tab label="Charts" />

          </Tabs>

          {/* Render Table, Graphs, or Download based on selected Master Tab */}
          {masterTabIndex === 0 && (
        <div>
          {/* Sub-Tabs for Beneficiaries */}
          <Tabs value={subTabIndex} onChange={handleSubTabChange} centered>
            <Tab label="Beneficiaries" />
            <Tab label="Vision Enhancement" />
            <Tab label="Training" />
            <Tab label="Comprehensive Low Vision Enhancement" />
            <Tab label="Counselling" />
          </Tabs>

          {/* Sub-Tabs Content */}
          {subTabIndex === 0 && (
            <div>
              {isLoading && <p>Loading beneficiaries...</p>}
              {!isLoading && beneficiaries.length > 0 && (
                <div className="ag-theme-quartz" style={{ height: '600px', width: '100%' }}>
                  <AgGridReact
                    rowData={beneficiaries}
                    columnDefs={colDefs}
                    pagination={true}
                    paginationPageSize={50} 
                  />
                </div>
              )}
              {!isLoading && beneficiaries.length === 0 && (
                <p>No beneficiaries found for the selected date range.</p>
              )}
            </div>
          )}
          {subTabIndex === 1 && (
            <div>
              {isLoading && <p>Loading Vision Enhancement data...</p>}
              {!isLoading && visionEnhancements.length > 0 && (
                <div className="ag-theme-quartz" style={{ height: '600px', width: '100%' }}>
                  <AgGridReact
                    rowData={visionEnhancements}
                    columnDefs={visionEnhancementColDefs}
                    pagination={true}
                    paginationPageSize={50} 
                  />
                </div>
              )}
              {!isLoading && visionEnhancements.length === 0 && (
                <p>No Vision Enhancement records found for the selected filters.</p>
              )}
            </div>
          )}
          {subTabIndex === 2 && ( // Training Tab Content
            <div>
              {isLoading && <p>Loading Training data...</p>}
              {!isLoading && trainings.length > 0 && (
                <div className="ag-theme-quartz" style={{ height: '600px', width: '100%' }}>
                  <AgGridReact
                    rowData={trainings}
                    columnDefs={trainingColDefs}
                    pagination={true}
                    paginationPageSize={50} 
                  />
                </div>
              )}
              {!isLoading && trainings.length === 0 && (
                <p>No Training records found for the selected filters.</p>
              )}
            </div>
          )}
            {subTabIndex === 3 && ( // Comprehensive Low Vision Enhancement Tab Content
                <div>
                  {isLoading && <p>Loading Comprehensive Low Vision Enhancement data...</p>}
                  {!isLoading && comprehensiveLowVisionEvaluations.length > 0 && (
                    <div className="ag-theme-quartz" style={{ height: '600px', width: '100%' }}>
                      <AgGridReact
                        rowData={comprehensiveLowVisionEvaluations}
                        columnDefs={comprehensiveLowVisionEvaluationColDefs}
                        pagination={true}
                        paginationPageSize={50} 
                      />
                    </div>
                  )}
                  {!isLoading && comprehensiveLowVisionEvaluations.length === 0 && (
                    <p>No Comprehensive Low Vision Enhancement records found for the selected filters.</p>
                  )}
                </div>
              )}
   {subTabIndex === 4 && ( // Counselling Education Tab Content
      <div>
        {isLoading && <p>Loading Counselling Education data...</p>}
        {!isLoading && counsellingEducations.length > 0 && (
          <div className="ag-theme-quartz" style={{ height: '600px', width: '100%' }}>
            <AgGridReact
              rowData={counsellingEducations}
              columnDefs={counsellingEducationColDefs}
              pagination={true}
              paginationPageSize={50} 
            />
          </div>
        )}
        {!isLoading && counsellingEducations.length === 0 && (
          <p>No Counselling Education records found for the selected filters.</p>
        )}
      </div>
    )}
           {/* {subTabIndex === 5 && (
            <div className="text-center mt-4">
              <p>Coming Soon ...</p>
            </div>
          )} */}
        </div>
      )}
          {masterTabIndex === 1 && (
            <div>
              {/* Graph Customization */}
              <div className="row justify-content-center">
                <div className="col-md-9">
                  <Paper className="text-center">
                    {/* Sub-Tabs for different Graphs */}
                    <Tabs
                      value={activeGraphTab}
                      onChange={(event, newValue) => setActiveGraphTab(newValue)}
                      indicatorColor="primary"
                      textColor="primary"
                      centered
                    >
                      <Tab label="Beneficiaries" />
                      <Tab label="Activities" />
                      <Tab label="Dispensed Devices" />
                      <Tab label="Recommended Devices" />
                      <Tab label="Visual Acuity" />
                    </Tabs>

                    {/* Beneficiary Graph Sub-Tab */}
                    {activeGraphTab === 0 && (
                      <Tabs
                        value={activeBeneficiaryGraphTab}
                        onChange={(event, newValue) => setActiveBeneficiaryGraphTab(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                        centered
                      >
                        
                        <Tab label="Accurate Beneficiaries" />
                        <Tab label="Unique Beneficiaries" />
                        <Tab label="Total Sessions" />
                        <Tab label="Gender" />
                        <Tab label="Age" />
                      </Tabs>
                    )}

                    {/* Activities Graph Sub-Tab */}
                    {activeGraphTab === 1 && (
                      <Tabs
                        value={activeActivitiesGraphTab}
                        onChange={(event, newValue) => setActiveActivitiesGraphTab(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                        centered
                      >
                        <Tab label="All Activities" />
                        <Tab label="Training Activities" />
                        <Tab label="Counselling Activities" />
                      </Tabs>
                    )}

                    {/* Dispensed Devices Graph Sub-Tab */}
                    {activeGraphTab === 2 && (
                      <Tabs
                        value={activeDevicesGraphTab}
                        onChange={(event, newValue) => setActiveDevicesGraphTab(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                        centered
                      >
                        <Tab label="All Devices" />
                        <Tab label="Electronic" />
                        <Tab label="Spectacle" />
                        <Tab label="Optical" />
                        <Tab label="Non-Optical" />
                      </Tabs>
                    )}

                    {/* Recommended Devices Graph Sub-Tab */}
                    {activeGraphTab === 3 && (
                      <Tabs
                        value={activeRecDevicesGraphTab}
                        onChange={(event, newValue) => setActiveRecDevicesGraphTab(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                        centered
                      >
                        <Tab label="All Devices" />
                        <Tab label="Electronic" />
                        <Tab label="Spectacle" />
                        <Tab label="Optical" />
                        <Tab label="Non-Optical" />
                      </Tabs>
                    )}
                    {activeGraphTab === 4 && (
                    <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
                    <div className="text-center mt-4">
              <p>Coming Soon ...</p>
            </div>
                  </Box>
                    )}
                    {/* Render the selected graph */}
                    {renderGraph()}
                  </Paper>
                </div>
              </div>
            </div>
          )}

        </Container>
        <br />
      </div>
    </Layout>
  );
}
