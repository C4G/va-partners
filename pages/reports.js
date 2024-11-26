// Import necessary libraries and components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { readUser } from "./api/user";
import { getSession } from "next-auth/react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import { findAllHospital } from "@/pages/api/hospital";
import { Container } from "react-bootstrap";
import Navigation from "./navigation/Navigation";
import Layout from './components/layout';
import moment from "moment";
import { useState, useEffect } from "react";
import GraphCustomizer from "./components/GraphCustomizer";
import { Tab, Tabs, Paper, Button, Box } from "@mui/material";
import ReportCustomizer from './customizedReport';
import { AgGridReact } from 'ag-grid-react'; 
import "ag-grid-community/styles/ag-grid.css"; 
import "ag-grid-community/styles/ag-theme-quartz.css"; 
import EditIcon from '@mui/icons-material/Edit';
import { Drawer, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useDebounce } from "utils/global/useDebounce";
import { buildDashboardQueryParams } from '@/utils/ui/build-dashboard-query-params';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

// Configure Chart.js data label plugin globally
ChartJS.defaults.plugins.datalabels.font.size = 16;
ChartJS.defaults.plugins.datalabels.font.weight = "bold";
ChartJS.defaults.plugins.datalabels.display = function(context){
  return context.dataset.data[context.dataIndex] != 0;
};

// Define graph options (colors, borders, etc.)
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

// Placeholder for existing graph building functions

// Function to build Activities Graph using countsData
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

// Function to build Breakdown Graph based on type
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

// Function to build Devices Graph
function buildDevicesGraph(countsData) {
  if (!countsData || countsData['Devices_Dispensed'] === undefined || countsData['Devices_Dispensed'] === null) {
    console.error('Devices dispensed data not available in countsData');
    return {
      labels: [],
      datasets: [],
    };
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

// Function to build Recommended Devices Graph
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


// Function to build Devices Breakdown Graph
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

// Function to build Recommended Devices Breakdown Graph
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


function buildTotalBeneficiariesGraph(uniqueBeneficiaries) {
  return {
    labels: ["Accurate Beneficiaries"],
    datasets: [
      {
        label: "Number of Beneficiaries",
        data: [uniqueBeneficiaries],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };
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

const visualAcuityOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Visual Acuity Distribution',
    },
    tooltip: {
      enabled: true,
    },
    datalabels: {
      // Custom formatter to display count and percentage
      formatter: (value, context) => {
        const dataset = context.chart.data.datasets[context.datasetIndex];
        const total = dataset.data.reduce((acc, val) => acc + val, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return `${value} (${percentage}%)`;
      },
      color: '#000', // Set text color for better readability
      anchor: 'end',
      align: 'start',
      offset: -5,
      font: {
        weight: 'bold',
        size: 14,
      },
    },
  },
};

// Function to build Training Types Graph
function buildTrainingTypesGraph(countsData) {
  if (!countsData || !countsData["Training_Types"]) {
    return {
      labels: [],
      datasets: [
        {
          label: "Training Types",
          data: [],
          ...graphOptions,
        },
      ],
    };
  }

  const trainingTypes = countsData["Training_Types"];
  const labels = Object.keys(trainingTypes);
  const dataPoints = Object.values(trainingTypes);

  return {
    labels: labels,
    datasets: [
      {
        label: "Training Types",
        data: dataPoints,
        backgroundColor: labels.map(() => "rgba(54, 162, 235, 0.2)"),
        borderColor: labels.map(() => "rgba(54, 162, 235, 1)"),
        borderWidth: 1,
      },
    ],
  };
}

// Function to build Training Subtypes Graph
function buildTrainingSubtypesGraph(countsData, selectedType) {
  if (
    !countsData ||
    !countsData["Training_Subtypes"] ||
    !countsData["Training_Subtypes"][selectedType]
  ) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const trainingSubtypes = countsData["Training_Subtypes"][selectedType];
  const labels = Object.keys(trainingSubtypes);
  const dataPoints = Object.values(trainingSubtypes);

  return {
    labels: labels,
    datasets: [
      {
        label: `Subtypes of ${selectedType}`,
        data: dataPoints,
        backgroundColor: labels.map(() => "rgba(255, 99, 132, 0.2)"),
        borderColor: labels.map(() => "rgba(255, 99, 132, 1)"),
        borderWidth: 1,
      },
    ],
  };
}

// Function to build Unique Beneficiaries by Activity Graph with Drilldown
function buildUniqueBeneficiariesGraph(countsData, drilledDown) {
  if (!countsData) return null;

  const uniqueBeneficiariesByActivity = countsData["Unique_Beneficiaries_By_Activity"];
  if (!drilledDown) {
    const total = Object.values(uniqueBeneficiariesByActivity).reduce((sum, val) => sum + val, 0)
    return {
      labels: ["Total Unique Beneficiaries"],
      datasets: [
        {
          label: 'Total',
          data: [total],
          backgroundColor: ["rgba(75, 192, 192, 0.6)"],
          borderColor: ["rgba(75, 192, 192, 1)"],
          borderWidth: 1,
        },
      ],
    };
  } else {
    // Provide the detailed breakdown

    const labels = Object.keys(uniqueBeneficiariesByActivity).map(
      (key) => `${key} (${uniqueBeneficiariesByActivity[key]})`
    );
    const dataPoints = Object.values(uniqueBeneficiariesByActivity);

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Unique Beneficiaries by Activity',
          data: dataPoints,
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    return chartData;
  }
}

// Function to calculate age from date of birth
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

// Edit Button Renderer for AgGrid
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

// Fetch data server-side
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
        hospitals: [],
      },
    };
  }

  // Fetch user data
  const user = await readUser(session.user.email);
  const isAdmin = Boolean(user.admin);
  
  let hospitals = await findAllHospital();

  if (!isAdmin) {
    hospitals = hospitals.filter((hospital) => user.hospitalRoles.map(role => role.hospitalId).includes(hospital.id));
  }

  return {
    props: {
      hospitals: JSON.parse(JSON.stringify(hospitals)),
      user: JSON.parse(JSON.stringify(user)),
      error: null,
    },
  };
}

// PaginatedTable Component for rendering data table with pagination
function PaginatedTable({
  data,
  columnDefs,
  page,
  totalRecords,
  onPageChange,
  pageSize,
  onPageSizeChange,
}) {
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Calculate the start and end record numbers
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  // Generate an array of page numbers for the dropdown
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div>
      {/* AG Grid Table */}
      <div className="ag-theme-quartz" style={{ height: "600px", width: "100%" }}>
        <AgGridReact
          rowData={data}
          columnDefs={columnDefs}
          pagination={false} // Pagination handled manually
        />
      </div>

      {/* Pagination Controls */}
      <div
        className="pagination-controls"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '10px',
          flexWrap: 'wrap', // Allows wrapping on smaller screens
          gap: '10px', // Adds spacing between controls
        }}
      >
        {/* Previous Page Button */}
        <Button
          variant="contained"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>

        {/* Record Range Display */}
        <Box>
          <span>{`${startRecord} to ${endRecord} of ${totalRecords}`}</span>
        </Box>

        {/* Page Number Dropdown */}
        <Box display="flex" alignItems="center">
          <span style={{ marginRight: '5px' }}>Page:</span>
          <select
            value={page}
            onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
            style={{ padding: '5px' }}
          >
            {pageNumbers.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: '5px' }}>of {totalPages}</span>
        </Box>

        {/* Page Size Dropdown */}
        <Box display="flex" alignItems="center">
          <span style={{ marginRight: '5px' }}>Page Size:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            style={{ padding: '5px' }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </Box>

        {/* Next Page Button */}
        <Button
          variant="contained"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalRecords === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Main Summary Component
export default function Summary({
  user,
  hospitals,
  trainingTypes,
  trainingSubTypes,
  
}) {
  // State variables for date range
  const [startDate, setStartDate] = useState(
    moment().subtract(1, "year").format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

  // Debounced date range to prevent excessive API calls
  const debouncedDateRange = useDebounce({ startDate, endDate }, 500);

  // State variables for tabs
  const [masterTabIndex, setMasterTabIndex] = useState(0); // Table/Graph
  const [subTabIndex, setSubTabIndex] = useState(0); // Sub-tabs within Table
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedHospitalNames, setSelectedHospitalNames] = useState([]);

  // State variables for counts and graph data
  const [countsData, setCountsData] = useState(null);
  const [isTableActive, setIsTableActive] = useState(true);
  const [isGraphActive, setIsGraphActive] = useState(false);
  
  // Pagination state variables
  const [pageSize, setPageSize] = useState(50); // Default page size

  // Page numbers for each sub-tab
  const [beneficiaryPage, setBeneficiaryPage] = useState(1);
  const [visionEnhancementPage, setVisionEnhancementPage] = useState(1);
  const [trainingPage, setTrainingPage] = useState(1);
  const [comprehensivePage, setComprehensivePage] = useState(1);
  const [counselingPage, setCounselingPage] = useState(1);

  // Data states
  const [comprehensiveEvaluations, setComprehensiveEvaluations] = useState([]);
  const [counselingRecords, setCounselingRecords] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [visionEnhancements, setVisionEnhancements] = useState([]);
  const [trainings, setTrainings] = useState([]); 

  // Loading and counts states
  const [isLoading, setIsLoading] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [totalVisionEnhancements, setTotalVisionEnhancements] = useState(0);
  const [totalTrainings, setTotalTrainings] = useState(0);
  const [totalComprehensiveEvaluations, setTotalComprehensiveEvaluations] = useState(0);
  const [totalCounselingRecords, setTotalCounselingRecords] = useState(0);

  // Filter states
  const [selectedGenders, setSelectedGenders] = useState(['Male','Female', 'Other']);
  const [selectedMdvi, setSelectedMdvi] = useState(['Yes', 'No']);
  const [minAge, setMinAge] = useState(null);
  const [maxAge, setMaxAge] = useState(null);

  // Drawer state for filters
  const [drawerOpen, setDrawerOpen] = useState(false);

  // State variables for graph tabs
  const [activeGraphTab, setActiveGraphTab] = useState(0);
  const [activeBeneficiaryGraphTab, setActiveBeneficiaryGraphTab] = useState(0);
  const [activeDevicesGraphTab, setActiveDevicesGraphTab] = useState(0);
  const [activeRecDevicesGraphTab, setActiveRecDevicesGraphTab] = useState(0);
  const [activeActivitiesGraphTab, setActiveActivitiesGraphTab] = useState(0);

  // New state variable for drilldown
  const [uniqueBeneficiariesDrilledDown, setUniqueBeneficiariesDrilledDown] = useState(false);
  const [trainingDrillDown, setTrainingDrillDown] = useState({
    active: false,
    type: null, // Holds the currently selected Training type for drill-down
  });

  const downloadChartData = (chartData, filename) => {
    if (!chartData || !chartData.labels || !chartData.datasets) {
      console.error("Invalid chart data");
      return;
    }
  
    const { labels, datasets } = chartData;
    const csvRows = [];
  
    // Add headers
    csvRows.push(['Label', ...datasets.map(ds => ds.label)]);
  
    // Add data rows
    labels.forEach((label, index) => {
      const row = [label];
      datasets.forEach(ds => {
        row.push(ds.data[index]);
      });
      csvRows.push(row);
    });
  
    // Convert to CSV string
    const csvContent = csvRows.map(e => e.join(",")).join("\n");
  
    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
    // Create a link to download the Blob
    const link = document.createElement("a");
  
    // Safely handle selectedHospitalNames
    let sanitizedHospitalNames = 'All_Hospitals';
    if (Array.isArray(selectedHospitalNames) && selectedHospitalNames.length > 0) {
      if (selectedHospitalNames.length === 1) {
        // Replace spaces with underscores for a single hospital name
        sanitizedHospitalNames = selectedHospitalNames[0].replace(/\s+/g, '_');
      } else {
        // Use 'MULTI' if multiple hospitals are selected
        sanitizedHospitalNames = 'MULTI';
      }
    }
  
    // Safely handle startDate and endDate
    const formattedStartDate = startDate ? moment(startDate).format('YYYY-MM-DD') : 'Unknown_StartDate';
    const formattedEndDate = endDate ? moment(endDate).format('YYYY-MM-DD') : 'Unknown_EndDate';
  
    // Construct the complete filename
    const completeFilename = `${filename}_${sanitizedHospitalNames}_${formattedStartDate}_${formattedEndDate}.csv`;
  
    // Create the download link
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", completeFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  // Graph options
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

  // Handle tab changes to set active states
  useEffect(() => {
    setIsTableActive(masterTabIndex === 0);
    setIsGraphActive(masterTabIndex === 1);
  }, [masterTabIndex]);

  // Reset data when filters change
  useEffect(() => {
    setBeneficiaries([]);
    setVisionEnhancements([]);
    setTrainings([]);
    setComprehensiveEvaluations([]);
    setCounselingRecords([]);

    setTotalBeneficiaries(0);
    setTotalVisionEnhancements(0);
    setTotalTrainings(0);
    setTotalComprehensiveEvaluations(0);
    setTotalCounselingRecords(0);
    setTotalSessions(0);
  }, [selectedHospitals, startDate, endDate, selectedGenders, selectedMdvi, minAge, maxAge]);

  // Fetch counts data when graph is active and filters change
  useEffect(() => {
    if (selectedHospitals.length === 0 || !isGraphActive) {
      return;
    }

    const fetchCountsData = async () => {
      try {
        const startDateUTC = debouncedDateRange.startDate ? moment(debouncedDateRange.startDate).utc().startOf('day').toISOString() : null;
        const endDateUTC = debouncedDateRange.endDate ? moment(debouncedDateRange.endDate).utc().endOf('day').toISOString() : null;
        const params = {
          hospitalIds: selectedHospitals,
          startDate: startDateUTC,
          endDate: endDateUTC,
          // genders: selectedGenders,
          // mdvis: selectedMdvi,
          // min_age: minAge,
          // max_age: maxAge,
        };

        const response = await fetch(`/api/v2/dashboard/count?${buildDashboardQueryParams(params)}`);

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
  }, [isGraphActive, selectedGenders, selectedMdvi, minAge, maxAge, selectedHospitals, debouncedDateRange.startDate, debouncedDateRange.endDate]);

  // Update totals when countsData changes
  useEffect(() => {
    if (countsData) {
      const totalSessions = computeTotalSessions(countsData);
      setTotalSessions(totalSessions);
  
      setTotalBeneficiaries(countsData["Total_Beneficiaries"] || 0);
    }
  }, [countsData]);

  // Fetch table data when table is active and filters or pagination change
  useEffect(() => {
    if (!isTableActive || selectedHospitals.length === 0) return;

    const fetchData = async (type, page, setData, setTotal) => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const startDateUTC = new Date(startDate);
        startDateUTC.setUTCHours(0, 0, 0, 0);
        const endDateUTC = new Date(endDate);
        endDateUTC.setUTCHours(23, 59, 59, 999);
        const params = {
          offset,
          limit: pageSize, // Use selected page size here
          startDate: startDateUTC.toISOString(),
          endDate: endDateUTC.toISOString(),
          hospitalIds: selectedHospitals,
          genders: selectedGenders,
          min_age: minAge,
          max_age: maxAge,
          mdvis: selectedMdvi
        }
        const response = await fetch(`/api/v2/dashboard/${type}?${buildDashboardQueryParams(params)}`);
        const result = await response.json();
        setData(result.records || []);
        setTotal(result.totalRecords || 0);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    switch (subTabIndex) {
      case 0:
        fetchData("Beneficiary", beneficiaryPage, setBeneficiaries, setTotalBeneficiaries);
        break;
      case 1:
        fetchData("Vision_Enhancement", visionEnhancementPage, setVisionEnhancements, setTotalVisionEnhancements);
        break;
      case 2:
        fetchData("Training", trainingPage, setTrainings, setTotalTrainings);
        break;
      case 3:
        fetchData("Comprehensive_Low_Vision_Evaluation", comprehensivePage, setComprehensiveEvaluations, setTotalComprehensiveEvaluations);
        break;
      case 4:
        fetchData("Counselling_Education", counselingPage, setCounselingRecords, setTotalCounselingRecords);
        break;
      default:
        break;
    }
  }, [
    isTableActive,
    subTabIndex,
    beneficiaryPage,
    visionEnhancementPage,
    trainingPage,
    comprehensivePage,
    counselingPage,
    selectedHospitals,
    startDate,
    endDate,
    selectedGenders,
    selectedMdvi,
    minAge,
    maxAge,
    pageSize, // Include pageSize in dependencies
  ]);

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setBeneficiaryPage(1); // Reset to the first page when page size changes
    setVisionEnhancementPage(1);
    setTrainingPage(1);
    setComprehensivePage(1);
    setCounselingPage(1);
  };

  // Handle drawer open
  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Define column definitions (placeholders)
  
const counselingEducationColDefs =[
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
];

  const comprehensiveLowVisionEvaluationColDefs=[
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
  ];

  const trainingColDefs =[
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
  ];

  const visionEnhancementColDefs=[
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
  ];

  const beneficiaryColDefs = [
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
  ];
  
  // Handle sub-tab changes
  const handleSubTabChange = (event, newValue) => {
    setSubTabIndex(newValue);
  };

  // Set initial selected hospital on mount
  useEffect(() => {
    setSelectedHospitals([hospitals?.[0]?.id]);
  }, [hospitals]);

  useEffect(() => {
    setSelectedHospitalNames([hospitals?.[0]?.name]);
  }, [hospitals]);

  // Handle hospital selection changes
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

  // Handle select all hospitals
  const handleAllSelect = (e, allSelect) => {
    if (allSelect) {
      setSelectedHospitals(hospitals.map((item) => item.id));
      setSelectedHospitalNames(hospitals.map((item) => item.name));
    } else {
      setSelectedHospitals([]);
      setSelectedHospitalNames([]);
    }
  };

  // Generate graph data
  const genderGraphData = buildGenderGraph(beneficiaries);
  const ageGraphData = buildAgeGraph(beneficiaries);
  const recDevicesGraphData = countsData ? buildRecDevicesGraph(countsData) : null;
  const electronicRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'Electronic') : null;
  const spectacleRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'Spectacle') : null;
  const opticalRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'Optical') : null;
  const nonOpticalRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, 'NonOptical') : null;
  
  const visualAcuityCategories = [
    'Blindness',
    'Severe visual impairment',
    'Moderate visual impairment',
    'Mild visual impairment',
    'Visual Acuity normal',
    // 'Other',
  ];

  const visualAcuityChartData = countsData && countsData.distanceBinocularVisionBE_counts ? {
    labels: visualAcuityCategories, // Use predefined categories
    datasets: [
      {
        label: 'Number of Cases',
        data: visualAcuityCategories.map(category => countsData.distanceBinocularVisionBE_counts[category] || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',      // Blindness
          'rgba(255, 206, 86, 0.6)',      // Severe visual impairment
          'rgba(54, 162, 235, 0.6)',      // Moderate visual impairment
          'rgba(255, 159, 64, 0.6)',      // Mild visual impairment
          'rgba(153, 102, 255, 0.6)',     // Visual Acuity normal
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',        // Blindness
          'rgba(255, 206, 86, 1)',        // Severe visual impairment
          'rgba(54, 162, 235, 1)',        // Moderate visual impairment
          'rgba(255, 159, 64, 1)',        // Mild visual impairment
          'rgba(153, 102, 255, 1)',       // Visual Acuity normal
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  // Generate Unique Beneficiaries Graph Data with Drilldown
  const uniqueBeneficiariesGraphData = buildUniqueBeneficiariesGraph(countsData, uniqueBeneficiariesDrilledDown);


// Define options with an onClick handler for Training Types chart
const trainingTypesOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Training Types Distribution',
    },
    tooltip: {
      enabled: true,
    },
  },
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const chartElement = elements[0];
      const index = chartElement.index;

      const trainingGraphData = buildTrainingTypesGraph(countsData);

      // Ensure labels exist and index is valid
      if (
        trainingGraphData.labels &&
        trainingGraphData.labels.length > index
      ) {
        const selectedType = trainingGraphData.labels[index];
        setTrainingDrillDown({ active: true, type: selectedType });
      } else {
        console.error("Selected type is undefined or out of bounds.");
      }
    }
  },
};

// Define options for Training Subtypes chart
const trainingSubtypesOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: `Training Subtypes Distribution for ${trainingDrillDown.type}`,
    },
    tooltip: {
      enabled: true,
    },
  },
};
  // Define options with an onClick handler for Unique Beneficiaries chart
  const uniqueBeneficiariesOptions = {
    ...options,
    onClick: (event, elements) => {
      if (elements.length > 0 && !uniqueBeneficiariesDrilledDown) {
        const chartElement = elements[0];
        const index = chartElement.index;

        // Check if the clicked bar is the 'Total Unique Beneficiaries' bar
        if (uniqueBeneficiariesGraphData.labels[index] === "Total Unique Beneficiaries") {
          setUniqueBeneficiariesDrilledDown(true);
        }
      }
    },
  };

  // Back button to return from drilldown
  const backButton = uniqueBeneficiariesDrilledDown ? (
    <Button variant="outlined" onClick={() => setUniqueBeneficiariesDrilledDown(false)} style={{ marginBottom: '10px' }}>
      Back to Total
    </Button>
  ) : null;

  
// Function to build Gender Graph
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

// Function to build Age Graph
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

  // Handle graph tabs
  const renderGraph = () => {
    if (selectedHospitals.length === 0) {
      return <p><br></br>Please select hospitals to view the graphs.</p>;
    }
    switch (activeGraphTab) {
      case 0:
        switch (activeBeneficiaryGraphTab) {
          case 0:
            return (
              <div>
                <Bar data={buildTotalBeneficiariesGraph(countsData?.Unique_Beneficiaries ?? 0)} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildTotalBeneficiariesGraph(countsData?.Unique_Beneficiaries), 'Total_Beneficiaries')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
            case 1:
            return countsData ? (
              <div>
                {backButton}
                <Bar 
                  data={uniqueBeneficiariesGraphData} 
                  options={uniqueBeneficiariesOptions} 
                />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(uniqueBeneficiariesGraphData, 'Unique_Beneficiaries')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 2:
            return (
              <div>
                <Bar data={buildSessionsGraph(totalSessions)} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildSessionsGraph(totalSessions), 'Total_Sessions')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          case 3:
            return (
              <div>
                <Bar data={genderGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(genderGraphData, 'Gender_Distribution')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          case 4:
            return (
              <div>
                <Bar data={ageGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(ageGraphData, 'Age_Distribution')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          default:
            return null;
        }
      case 1:
        switch (activeActivitiesGraphTab) {
          case 0: {
            if (!countsData) {
              return <p>Loading...</p>;
            }
            const activitiesChartData = buildActivitiesGraph(countsData);
            if (activitiesChartData.labels.length === 0) {
              return <p>No Activities data available for the selected filters.</p>;
            }
            return (
              <div>
                <Bar data={activitiesChartData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(activitiesChartData, 'All_Activities')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          }
          case 1:
            return countsData ? (
              <div>
                {trainingDrillDown.active && (
                  <Button
                    variant="outlined"
                    onClick={() =>
                      setTrainingDrillDown({ active: false, type: null })
                    }
                    style={{ marginBottom: '10px' }}
                  >
                    Back to Training Types
                  </Button>
                )}
                {trainingDrillDown.active ? (
                  buildTrainingSubtypesGraph(countsData, trainingDrillDown.type).labels.length > 0 ? (
                    <div>
                      <Bar
                        data={buildTrainingSubtypesGraph(countsData, trainingDrillDown.type)}
                        options={trainingSubtypesOptions}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => downloadChartData(buildTrainingSubtypesGraph(countsData, trainingDrillDown.type), `Training_Subtypes_${trainingDrillDown.type}`)}
                        style={{ marginTop: '10px' }}
                      >
                        Download Data
                      </Button>
                    </div>
                  ) : (
                    <p>No sub-type data available for {trainingDrillDown.type}.</p>
                  )
                ) : (
                  <div>
                    <Bar
                      data={buildTrainingTypesGraph(countsData)}
                      options={trainingTypesOptions}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => downloadChartData(buildTrainingTypesGraph(countsData), 'Training_Types')}
                      style={{ marginTop: '10px' }}
                    >
                      Download Data
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 2:
            return countsData ? (
              <div>
                <Bar data={buildBreakdownGraph(countsData, 'counsellingEducation')} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildBreakdownGraph(countsData, 'counsellingEducation'), 'Counselling_Education')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
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
              <div>
                <Bar data={buildDevicesGraph(countsData)} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildDevicesGraph(countsData), 'Dispensed_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 1:
            return countsData ? (
              <div>
                <Bar data={buildDevicesBreakdownGraph(countsData, 'Electronic')} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildDevicesBreakdownGraph(countsData, 'Electronic'), 'Dispensed_Electronic_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 2:
            return countsData ? (
              <div>
                <Bar data={buildDevicesBreakdownGraph(countsData, 'Spectacle')} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildDevicesBreakdownGraph(countsData, 'Spectacle'), 'Dispensed_Spectacle_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 3:
            return countsData ? (
              <div>
                <Bar data={buildDevicesBreakdownGraph(countsData, 'Optical')} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildDevicesBreakdownGraph(countsData, 'Optical'), 'Dispensed_Optical_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 4:
            return countsData ? (
              <div>
                <Bar data={buildDevicesBreakdownGraph(countsData, 'NonOptical')} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildDevicesBreakdownGraph(countsData, 'NonOptical'), 'Dispensed_NonOptical_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          default:
            return null;
        }
      case 3:
        switch (activeRecDevicesGraphTab) {
          case 0:
            return (
              <div>
                <Bar data={recDevicesGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(recDevicesGraphData, 'Recommended_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          case 1:
            return (
              <div>
                <Bar data={electronicRecDevicesGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(electronicRecDevicesGraphData, 'Recommended_Electronic_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          case 2:
            return (
              <div>
                <Bar data={spectacleRecDevicesGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(spectacleRecDevicesGraphData, 'Recommended_Spectacle_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          case 3:
            return (
              <div>
                <Bar data={opticalRecDevicesGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(opticalRecDevicesGraphData, 'Recommended_Optical_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          case 4:
            return (
              <div>
                <Bar data={nonOpticalRecDevicesGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(nonOpticalRecDevicesGraphData, 'Recommended_NonOptical_Devices')}
                  style={{ marginTop: '10px' }}
                >
                  Download Data
                </Button>
              </div>
            );
          default:
            return null;
        }
    case 4:
      return visualAcuityChartData ? (
        <div>
          <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
            <Bar data={visualAcuityChartData} options={visualAcuityOptions} />
          </Box>
          <Button
            variant="outlined"
            onClick={() => downloadChartData(visualAcuityChartData, 'Visual_Acuity_Distribution')}
            style={{ marginTop: '10px' }}
          >
            Download Data
          </Button>
        </div>
      ) : (
        <p>No Visual Acuity data available.</p>
      );
    default:
      return null;
  }
};

  return (
    <Layout>
      <div className="content">
        <Navigation user={user} />
        <Container className="p-3">
          {/* Filters and Drawer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <GraphCustomizer
              user={user}
              summary={hospitals}
              selectedHospitals={selectedHospitalNames}
              genders={selectedGenders}
              mdvis={selectedMdvi}
              minAge={minAge}
              maxAge={maxAge}
              handleHospitalSelection={handleMultiSelectChange}
              startDate={startDate}
              handleStartDateChange={(e) => setStartDate(e.target.value)}
              endDate={endDate}
              handleEndDateChange={(e) => setEndDate(e.target.value)}
              handleAllSelect={handleAllSelect}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
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

          {/* Master Tabs - Toggle between Table and Charts */}
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

          {/* Render Table or Charts based on selected Master Tab */}
          {masterTabIndex === 0 && (
            <div>
              {/* Sub-Tabs within Table */}
              <Tabs value={subTabIndex} onChange={handleSubTabChange} centered>
                <Tab label="Beneficiaries" />
                <Tab label="Vision Enhancement" />
                <Tab label="Training" />
                <Tab label="Comprehensive Low Vision Evaluation" />
                <Tab label="Counselling" />
              </Tabs>

              {/* Beneficiaries Tab */}
              {subTabIndex === 0 && (
                isLoading ? (
                  <p>Loading...</p>
                ) : beneficiaries.length > 0 ? (
                  <PaginatedTable
                    data={beneficiaries}
                    columnDefs={beneficiaryColDefs} // Placeholder for Beneficiary column definitions
                    page={beneficiaryPage}
                    totalRecords={totalBeneficiaries}
                    pageSize={pageSize} 
                    onPageSizeChange={handlePageSizeChange} 
                    onPageChange={(newPage) => setBeneficiaryPage(newPage)}
                  />
                ) : (
                  <p>No Beneficiary records found for the selected filters.</p>
                )
              )}

              {/* Vision Enhancement Tab */}
              {subTabIndex === 1 && (
                isLoading ? (
                  <p>Loading...</p>
                ) : visionEnhancements.length > 0 ? (
                  <PaginatedTable
                    data={visionEnhancements}
                    columnDefs={visionEnhancementColDefs} // Placeholder for Vision Enhancement column definitions
                    page={visionEnhancementPage}
                    totalRecords={totalVisionEnhancements}
                    pageSize={pageSize} 
                    onPageSizeChange={handlePageSizeChange} 
                    onPageChange={(newPage) => setVisionEnhancementPage(newPage)}
                  />
                ) : (
                  <p>No Vision Enhancement records found for the selected filters.</p>
                )
              )}

              {/* Training Tab */}
              {subTabIndex === 2 && (
                isLoading ? (
                  <p>Loading...</p>
                ) : trainings.length > 0 ? (
                  <PaginatedTable
                    data={trainings}
                    columnDefs={trainingColDefs} // Placeholder for Training column definitions
                    page={trainingPage}
                    totalRecords={totalTrainings}
                    pageSize={pageSize} 
                    onPageSizeChange={handlePageSizeChange} 
                    onPageChange={(newPage) => setTrainingPage(newPage)}
                  />
                ) : (
                  <p>No Training records found for the selected filters.</p>
                )
              )}

              {/* Comprehensive Low Vision Evaluation Tab */}
              {subTabIndex === 3 && (
                isLoading ? (
                  <p>Loading...</p>
                ) : comprehensiveEvaluations.length > 0 ? (
                  <PaginatedTable
                    data={comprehensiveEvaluations}
                    columnDefs={comprehensiveLowVisionEvaluationColDefs} // Placeholder for Comprehensive Low Vision Evaluation column definitions
                    page={comprehensivePage}
                    totalRecords={totalComprehensiveEvaluations}
                    pageSize={pageSize} 
                    onPageSizeChange={handlePageSizeChange} 
                    onPageChange={(newPage) => setComprehensivePage(newPage)}
                  />
                ) : (
                  <p>No Comprehensive Low Vision Evaluation records found for the selected filters.</p>
                )
              )}

              {/* Counselling Tab */}
              {subTabIndex === 4 && (
                isLoading ? (
                  <p>Loading...</p>
                ) : counselingRecords.length > 0 ? (
                  <PaginatedTable
                    data={counselingRecords}
                    columnDefs={counselingEducationColDefs} // Placeholder for Counseling Education column definitions
                    page={counselingPage}
                    totalRecords={totalCounselingRecords}
                    pageSize={pageSize} 
                    onPageSizeChange={handlePageSizeChange} 
                    onPageChange={(newPage) => setCounselingPage(newPage)}
                  />
                ) : (
                  <p>No Counselling records found for the selected filters.</p>
                )
              )}
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

                    {/* Beneficiary Graph Sub-Tabs */}
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

                    {/* Activities Graph Sub-Tabs */}
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

                    {/* Dispensed Devices Graph Sub-Tabs */}
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

                    {/* Recommended Devices Graph Sub-Tabs */}
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
