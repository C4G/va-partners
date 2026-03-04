// Import necessary libraries and components
import { findAllHospital } from "@/pages/api/hospital";
import { buildDashboardQueryParams } from "@/utils/ui/build-dashboard-query-params";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, FormControlLabel, FormGroup, IconButton, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";
import { BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import debounce from "lodash.debounce";
import moment from "moment";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { readUser } from "./api/user";
import GraphCustomizer from "./components/GraphCustomizer";
import Layout from "./components/layout";
import ReportCustomizer from "./customizedReport";
import Navigation from "./navigation/Navigation";
import * as XLSX from "xlsx-js-style";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler, ChartDataLabels);

// Configure Chart.js data label plugin globally
ChartJS.defaults.plugins.datalabels.font.size = 16;
ChartJS.defaults.plugins.datalabels.font.weight = "bold";
ChartJS.defaults.plugins.datalabels.display = function (context) {
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
    (countsData["Training"] || 0) + mobileTrainingCount + computerTrainingCount + orientationMobilityTrainingCount;

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

  if (breakdownType === "training") {
    if (!countsData["Training_Subtypes"]) {
      console.error("Training subtypes data not available in countsData");
      return null;
    }
    typeCounts = countsData["Training_Subtypes"];
  } else if (breakdownType === "counsellingEducation") {
    if (!countsData["Counselling_Types"]) {
      console.error("Counselling types data not available in countsData");
      return null;
    }
    typeCounts = countsData["Counselling_Types"];
  } else {
    console.error("Invalid breakdownType:", breakdownType);
    return null;
  }

  const labels = Object.keys(typeCounts);
  const dataPoints = Object.values(typeCounts);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Cumulative Counts",
        data: dataPoints,
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

// Function to build Devices Graph
function buildDevicesGraph(countsData) {
  if (!countsData || countsData["Devices_Dispensed"] === undefined || countsData["Devices_Dispensed"] === null) {
    console.error("Devices dispensed data not available in countsData");
    return {
      labels: [],
      datasets: [],
    };
  }

  const devicesCounts = countsData["Devices_Dispensed"];

  const dispensedSpectacleCount = devicesCounts["Spectacle"] || 0;
  const dispensedElectronicCount = devicesCounts["Electronic"] || 0;
  const dispensedOpticalCount = devicesCounts["Optical"] || 0;
  const dispensedNonOpticalCount = devicesCounts["NonOptical"] || 0;

  const chartData = {
    labels: [
      `Spectacle (${dispensedSpectacleCount})`,
      `Electronic (${dispensedElectronicCount})`,
      `Optical (${dispensedOpticalCount})`,
      `Non-Optical (${dispensedNonOpticalCount})`,
    ],
    datasets: [
      {
        label: "Cumulative Counts",
        data: [dispensedSpectacleCount, dispensedElectronicCount, dispensedOpticalCount, dispensedNonOpticalCount],
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

function buildRecDevicesGraph(countsData) {
  if (!countsData || !countsData["Devices_Recommended"]) {
    // Return an empty chart data object or null
    return {
      labels: [],
      datasets: [],
    };
  }

  const devicesCounts = countsData["Devices_Recommended"];

  const recommendedSpectacleCount = devicesCounts["Spectacle"] || 0;
  const recommendedElectronicCount = devicesCounts["Electronic"] || 0;
  const recommendedOpticalCount = devicesCounts["Optical"] || 0;
  const recommendedNonOpticalCount = devicesCounts["NonOptical"] || 0;

  return {
    labels: [
      `Spectacle (${recommendedSpectacleCount})`,
      `Electronic (${recommendedElectronicCount})`,
      `Optical (${recommendedOpticalCount})`,
      `Non-Optical (${recommendedNonOpticalCount})`,
    ],
    datasets: [
      {
        label: "Cumulative Counts",
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
}

// Function to build Devices Breakdown Graph
function buildDevicesBreakdownGraph(countsData, breakdownType) {
  if (!countsData["Devices_Dispensed"]) {
    console.error("Devices dispensed data not available in countsData");
    return null;
  }

  const devicesCounts = countsData["Devices_Dispensed_Details"] || {};
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
  if (!countsData["Devices_Recommended"]) {
    return null;
  }

  const devicesCounts = countsData["Devices_Recommended_Details"] || {};
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

function buildTotalBeneficiariesGraph(countsData, selectedHospitals, hospitals) {
  if (!countsData) return { labels: [], datasets: [] };

  if (countsData.Activity_Counts_Per_Hospital && selectedHospitals.length > 1) {
    // Multiple hospitals selected, build data per hospital
    const labels = [];
    const dataPoints = [];

    for (const hospitalId of selectedHospitals) {
      const hospitalCounts = countsData.Activity_Counts_Per_Hospital[hospitalId];
      if (!hospitalCounts) continue;

      const totalBeneficiaries = hospitalCounts["Unique_Beneficiaries"] || 0;

      // Get hospital name from hospitals array
      const hospital = hospitals.find((h) => h.id === parseInt(hospitalId, 10));
      const hospitalName = hospital ? hospital.name : `Hospital ${hospitalId}`;

      labels.push(hospitalName);
      dataPoints.push(totalBeneficiaries);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: "Number of Beneficiaries",
          data: dataPoints,
          backgroundColor: labels.map(() => "rgba(54, 162, 235, 0.2)"),
          borderColor: labels.map(() => "rgba(54, 162, 235, 1)"),
          borderWidth: 1,
        },
      ],
    };
  } else {
    // Single hospital selected or counts per hospital not provided
    const totalBeneficiaries = countsData["Unique_Beneficiaries"] || 0;

    return {
      labels: ["Accurate Beneficiaries"],
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
}

function buildSessionsGraph(countsData, selectedHospitals, hospitals) {
  if (!countsData) return null;

  if (countsData.Activity_Counts_Per_Hospital && selectedHospitals.length > 1) {
    // Multiple hospitals selected, build data per hospital
    const labels = [];
    const dataPoints = [];

    for (const hospitalId of selectedHospitals) {
      const hospitalCounts = countsData.Activity_Counts_Per_Hospital[hospitalId];
      if (!hospitalCounts) continue;

      const activityCounts = [
        hospitalCounts["Low_Vision_Evaluation"] || 0,
        hospitalCounts["Comprehensive_Low_Vision_Evaluation"] || 0,
        hospitalCounts["Vision_Enhancement"] || 0,
        hospitalCounts["Training"] || 0,
        hospitalCounts["Mobile_Training"] || 0,
        hospitalCounts["Computer_Training"] || 0,
        hospitalCounts["Orientation_Mobility_Training"] || 0,
        hospitalCounts["Counselling_Education"] || 0,
      ];
      const totalSessions = activityCounts.reduce((sum, count) => sum + count, 0);

      // Get hospital name from hospitals array
      const hospital = hospitals.find((h) => h.id === parseInt(hospitalId, 10));
      const hospitalName = hospital ? hospital.name : `Hospital ${hospitalId}`;

      labels.push(hospitalName);
      dataPoints.push(totalSessions);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: "Number of Sessions",
          data: dataPoints,
          backgroundColor: labels.map(() => "rgba(75, 192, 192, 0.2)"),
          borderColor: labels.map(() => "rgba(75, 192, 192, 1)"),
          borderWidth: 1,
        },
      ],
    };
  } else {
    // Single hospital selected or counts per hospital not provided
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
}

const visualAcuityOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Visual Acuity Distribution",
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
      color: "#000", // Set text color for better readability
      anchor: "end",
      align: "start",
      offset: -5,
      font: {
        weight: "bold",
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
  if (!countsData || !countsData["Training_Subtypes"] || !countsData["Training_Subtypes"][selectedType]) {
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

// Helper functions to assign colors
function getColor(index) {
  const colors = [
    "rgba(255, 99, 132, 0.6)",
    "rgba(54, 162, 235, 0.6)",
    "rgba(255, 206, 86, 0.6)",
    "rgba(75, 192, 192, 0.6)",
    "rgba(153, 102, 255, 0.6)",
    "rgba(255, 159, 64, 0.6)",
    "rgba(119, 221, 119, 0.6)",
    "rgba(0, 191, 255, 0.6)",
    "rgba(255, 99, 71, 0.6)",
    "rgba(128, 0, 128, 0.6)",
  ];
  return colors[index % colors.length];
}

function getBorderColor(index) {
  const colors = [
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(119, 221, 119, 1)",
    "rgba(0, 191, 255, 1)",
    "rgba(255, 99, 71, 1)",
    "rgba(128, 0, 128, 1)",
  ];
  return colors[index % colors.length];
}

function buildUniqueBeneficiariesGraph(countsData, selectedHospitals, hospitals, drilledDown) {
  if (!countsData) return null;

  if (!drilledDown) {
    if (selectedHospitals.length > 1) {
      // Use Unique_Beneficiaries_By_Activity_Per_Hospital
      const activityCountsPerHospital = countsData["Unique_Beneficiaries_By_Activity_Per_Hospital"] || {};

      // Sum total unique beneficiaries for each hospital
      const labels = Object.keys(activityCountsPerHospital); // Hospital names
      const dataPoints = labels.map((hospital) => {
        const activities = activityCountsPerHospital[hospital] || {};
        return Object.values(activities).reduce((sum, count) => sum + count, 0); // Sum of all activities per hospital
      });

      return {
        labels: labels, // Hospital names
        datasets: [
          {
            label: "Total Unique Beneficiaries",
            data: dataPoints,
            backgroundColor: labels.map((_, index) => getColor(index)),
            borderColor: labels.map((_, index) => getBorderColor(index)),
            borderWidth: 1,
          },
        ],
      };
    } else {
      // Not drilled down and single hospital selected: Show total unique beneficiaries for that hospital
      const uniqueBeneficiariesByActivity = countsData["Unique_Beneficiaries_By_Activity"] || {};
      const total = Object.values(uniqueBeneficiariesByActivity).reduce((sum, val) => sum + val, 0);

      return {
        labels: ["Total Unique Beneficiaries"],
        datasets: [
          {
            label: "Total",
            data: [total],
            backgroundColor: ["rgba(75, 192, 192, 0.6)"],
            borderColor: ["rgba(75, 192, 192, 1)"],
            borderWidth: 1,
          },
        ],
      };
    }
  } else {
    if (selectedHospitals.length > 1) {
      // Drilled down: Show stacked bar chart of unique beneficiaries by activity per hospital
      const activityCountsPerHospital = countsData["Unique_Beneficiaries_By_Activity_Per_Hospital"] || {};

      const labels = Object.keys(activityCountsPerHospital); // Hospital names
      const activities = Object.values(activityCountsPerHospital).reduce((acc, activities) => {
        Object.keys(activities).forEach((activity) => {
          if (!acc.includes(activity)) acc.push(activity);
        });
        return acc;
      }, []); // All unique activity names

      // Build dataset for stacked bar chart
      const datasets = activities.map((activity, activityIndex) => {
        const dataPoints = labels.map((hospital) => activityCountsPerHospital[hospital]?.[activity] || 0);

        return {
          label: activity,
          data: dataPoints,
          backgroundColor: getColor(activityIndex),
          borderColor: getBorderColor(activityIndex),
          borderWidth: 1,
        };
      });

      return {
        labels: labels, // Hospital names
        datasets: datasets,
      };
    } else {
      // Drilled down and single hospital selected: Show unique beneficiaries by activity
      const uniqueBeneficiariesByActivity = countsData["Unique_Beneficiaries_By_Activity"] || {};

      const labels = Object.keys(uniqueBeneficiariesByActivity);
      const dataPoints = labels.map((key) => uniqueBeneficiariesByActivity[key]);

      return {
        labels: labels,
        datasets: [
          {
            label: "Unique Beneficiaries by Activity",
            data: dataPoints,
            backgroundColor: labels.map((_, index) => getColor(index)),
            borderColor: labels.map((_, index) => getBorderColor(index)),
            borderWidth: 1,
          },
        ],
      };
    }
  }
}

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
    hospitals = hospitals.filter((hospital) => user.hospitalRole.map((role) => role.hospitalId).includes(hospital.id));
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
function PaginatedTable({ data, columnDefs, page, totalRecords, onPageChange, pageSize, onPageSizeChange }) {
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "10px",
          flexWrap: "wrap", // Allows wrapping on smaller screens
          gap: "10px", // Adds spacing between controls
        }}
      >
        {/* Previous Page Button */}
        <Button variant="contained" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          Previous
        </Button>

        {/* Record Range Display */}
        <Box>
          <span>{`${startRecord} to ${endRecord} of ${totalRecords}`}</span>
        </Box>

        {/* Page Number Dropdown */}
        <Box display="flex" alignItems="center">
          <span style={{ marginRight: "5px" }}>Page:</span>
          <select value={page} onChange={(e) => onPageChange(parseInt(e.target.value, 10))} style={{ padding: "5px" }}>
            {pageNumbers.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span style={{ marginLeft: "5px" }}>of {totalPages}</span>
        </Box>

        {/* Page Size Dropdown */}
        <Box display="flex" alignItems="center">
          <span style={{ marginRight: "5px" }}>Page Size:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            style={{ padding: "5px" }}
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
export default function Summary({ user, hospitals, trainingTypes, trainingSubTypes }) {
  // State variables for date range
  const [startDate, setStartDate] = useState(moment().subtract(1, "year").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));

  const router = useRouter();
  const {
    selectedHospitals: qSelectedHospitals,
    startDate: qStartDate,
    endDate: qEndDate,
    selectedGenders: qSelectedGenders,
    selectedMdvi: qSelectedMdvi,
    minAge: qMinAge,
    maxAge: qMaxAge,
    subTabIndex: qSubTabIndex,
    masterTabIndex: qMasterTabIndex,
    quarter: qQuarter,
  } = router.query;

  // State variables for tabs
  const [masterTabIndex, setMasterTabIndex] = useState(0); // Table/Graph
  const [subTabIndex, setSubTabIndex] = useState(0); // Sub-tabs within Table
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedHospitalNames, setSelectedHospitalNames] = useState([]);

  const [isChartLoading, setIsChartLoading] = useState(false);

  // State variables for counts and graph data
  // const [countsData, setCountsData] = useState(null);
  const [countsData, setCountsData] = useState({
    genderCounts: { Male: 0, Female: 0, Other: 0 },
    ageGroupCounts: { "0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "66+": 0 },
  });
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
  // const [totalSessions, setTotalSessions] = useState(0);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0);
  const [totalVisionEnhancements, setTotalVisionEnhancements] = useState(0);
  const [totalTrainings, setTotalTrainings] = useState(0);
  const [totalComprehensiveEvaluations, setTotalComprehensiveEvaluations] = useState(0);
  const [totalCounselingRecords, setTotalCounselingRecords] = useState(0);

  // Filter states
  const [selectedGenders, setSelectedGenders] = useState(["Male", "Female", "Other"]);
  const [selectedMdvi, setSelectedMdvi] = useState(["Yes", "No"]);
  const [minAge, setMinAge] = useState(null);
  const [maxAge, setMaxAge] = useState(null);

  // Drawer state for filters
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadDataTypes, setDownloadDataTypes] = useState(["Beneficiary"]);
  const [downloadGenders, setDownloadGenders] = useState(["Male", "Female", "Other"]);
  const [downloadMdvi, setDownloadMdvi] = useState(["Yes", "No"]);
  const [downloadMinAge, setDownloadMinAge] = useState(null);
  const [downloadMaxAge, setDownloadMaxAge] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Debounced function to update URL query parameters
  const updateURL = debounce(() => {
    const newQuery = {
      selectedHospitals: JSON.stringify(selectedHospitals),
      startDate: startDate,
      endDate: endDate,
      selectedGenders: JSON.stringify(selectedGenders),
      selectedMdvi: JSON.stringify(selectedMdvi),
      minAge: minAge || "",
      maxAge: maxAge || "",
      subTabIndex: subTabIndex.toString(),
      masterTabIndex: masterTabIndex.toString(),
      quarter: selectedQuarter || "",
    };

    router.replace(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  }, 300); // 300ms debounce delay

  // Synchronize URL with filter states
  useEffect(() => {
    updateURL();

    // Cleanup the debounce on unmount
    return () => {
      updateURL.cancel();
    };
  }, [
    selectedHospitals,
    startDate,
    endDate,
    selectedGenders,
    selectedMdvi,
    minAge,
    maxAge,
    subTabIndex,
    masterTabIndex,
  ]);

  // Initialize filter states from URL query parameters on mount
  useEffect(() => {
    if (qSelectedHospitals) {
      try {
        const parsedHospitals = JSON.parse(qSelectedHospitals);
        setSelectedHospitals(parsedHospitals);
      } catch (error) {
        console.error("Error parsing selectedHospitals from query:", error);
        setSelectedHospitals([]);
      }
    }

    if (qStartDate) {
      setStartDate(qStartDate);
    }
    if (qEndDate) {
      setEndDate(qEndDate);
    }
    if (qSelectedGenders) {
      try {
        const parsedGenders = JSON.parse(qSelectedGenders);
        setSelectedGenders(parsedGenders);
      } catch (error) {
        console.error("Error parsing selectedGenders from query:", error);
        setSelectedGenders(["Male", "Female", "Other"]);
      }
    }
    if (qSelectedMdvi) {
      try {
        const parsedMdvi = JSON.parse(qSelectedMdvi);
        setSelectedMdvi(parsedMdvi);
      } catch (error) {
        console.error("Error parsing selectedMdvi from query:", error);
        setSelectedMdvi(["Yes", "No"]);
      }
    }
    if (qMinAge) {
      setMinAge(Number(qMinAge));
    }
    if (qMaxAge) {
      setMaxAge(Number(qMaxAge));
    }
    if (qSubTabIndex) {
      setSubTabIndex(Number(qSubTabIndex));
    }
    if (qMasterTabIndex) {
      setMasterTabIndex(Number(qMasterTabIndex));
    }
    if (qQuarter) {
      setSelectedQuarter(qQuarter);
    }
  }, [
    qSelectedHospitals,
    qStartDate,
    qEndDate,
    qSelectedGenders,
    qSelectedMdvi,
    qMinAge,
    qMaxAge,
    qSubTabIndex,
    qMasterTabIndex,
    qQuarter,
  ]);
  const EditButtonRenderer = (props) => {
    const { mrn, hospitalId } = props.data;

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

  const toggleDownloadDataType = (key) => {
    setDownloadDataTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleDownloadGender = (g) => {
    setDownloadGenders((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleDownloadMdvi = (m) => {
    setDownloadMdvi((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const flattenRecord = (record) => {
    const flat = {};
    const recurse = (obj, prefix = "") => {
      for (const k in obj) {
        const val = obj[k];
        const key = prefix ? `${prefix}.${k}` : k;
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
          recurse(val, key);
        } else {
          flat[key] = val ?? "";
        }
      }
    };
    recurse(record);
    return flat;
  };

  const handleDownloadReport = async () => {
    if (downloadDataTypes.length === 0) {
      alert("Please select at least one data type.");
      return;
    }
    setIsDownloading(true);
    try {
      const startDateUTC = new Date(startDate).toISOString();
      const endDateUTC = new Date(endDate).toISOString();

      let sanitizedHospitalNames = "All_Hospitals";
      if (Array.isArray(selectedHospitalNames) && selectedHospitalNames.length > 0) {
        sanitizedHospitalNames =
          selectedHospitalNames.length === 1
            ? selectedHospitalNames[0].replace(/\s+/g, "_")
            : "MULTI";
      }
      const formattedStart = moment(startDate).format("YYYY-MM-DD");
      const formattedEnd = moment(endDate).format("YYYY-MM-DD");

      const wb = XLSX.utils.book_new();
      let hasData = false;

      for (const dataType of downloadDataTypes) {
        const params = new URLSearchParams();
        params.append("offset", 0);
        params.append("limit", 99999);
        params.append("startDate", startDateUTC);
        params.append("endDate", endDateUTC);
        selectedHospitals.forEach((id) => params.append("hospitalIds", id));
        downloadGenders.forEach((g) => params.append("genders", g));
        downloadMdvi.forEach((m) => params.append("mdvis", m));
        if (downloadMinAge) params.append("min_age", downloadMinAge);
        if (downloadMaxAge) params.append("max_age", downloadMaxAge);

        const response = await fetch(`/api/v2/dashboard/${dataType}?${params.toString()}`, {
          credentials: "include",
        });
        const result = await response.json();
        const records = result.records || [];

        if (records.length === 0) {
          continue;
        }

        const flatRecords = records.map(flattenRecord);
        const ws = XLSX.utils.json_to_sheet(flatRecords);

        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_col(C) + "1";
          if (!ws[address]) continue;
          ws[address].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "EAEAEA" } },
          };
        }

        const sheetName = dataType.replace(/_/g, " ").substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        hasData = true;
      }

      if (hasData) {
        const fileName = `VisionAid_Report_${sanitizedHospitalNames}_${formattedStart}_${formattedEnd}.xlsx`;
        XLSX.writeFile(wb, fileName);
      } else {
        alert("No records found for the selected criteria.");
      }

      setDownloadModalOpen(false);
    } catch (err) {
      console.error("Download error:", err);
      alert("An error occurred while downloading the report.");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadChartData = (chartData, filename) => {
    if (!chartData || !chartData.labels || !chartData.datasets) {
      console.error("Invalid chart data");
      return;
    }

    const { labels, datasets } = chartData;
    const csvRows = [];

    // Add headers
    csvRows.push(["Label", ...datasets.map((ds) => ds.label)]);

    // Add data rows
    labels.forEach((label, index) => {
      const row = [label];
      datasets.forEach((ds) => {
        row.push(ds.data[index]);
      });
      csvRows.push(row);
    });

    // Convert to CSV string
    const csvContent = csvRows.map((e) => e.join(",")).join("\n");

    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a link to download the Blob
    const link = document.createElement("a");

    // Safely handle selectedHospitalNames
    let sanitizedHospitalNames = "All_Hospitals";
    if (Array.isArray(selectedHospitalNames) && selectedHospitalNames.length > 0) {
      if (selectedHospitalNames.length === 1) {
        // Replace spaces with underscores for a single hospital name
        sanitizedHospitalNames = selectedHospitalNames[0].replace(/\s+/g, "_");
      } else {
        // Use 'MULTI' if multiple hospitals are selected
        sanitizedHospitalNames = "MULTI";
      }
    }

    // Safely handle startDate and endDate
    const formattedStartDate = startDate ? moment(startDate).format("YYYY-MM-DD") : "Unknown_StartDate";
    const formattedEndDate = endDate ? moment(endDate).format("YYYY-MM-DD") : "Unknown_EndDate";

    // Construct the complete filename
    const completeFilename = `${filename}_${sanitizedHospitalNames}_${formattedStartDate}_${formattedEndDate}.csv`;

    // Create the download link
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", completeFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Graph options
  const options = {
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
  }, [selectedHospitals, startDate, endDate, selectedGenders, selectedMdvi, minAge, maxAge]);

  // Fetch counts data when graph is active and filters change
  useEffect(() => {
    if (selectedHospitals.length === 0 || !isGraphActive) {
      return;
    }

    const fetchCountsData = async () => {
      try {
        setIsChartLoading(true); // Start loading
        const startDateUTC = startDate ? moment(startDate).utc().startOf("day").toISOString() : null;
        const endDateUTC = endDate ? moment(endDate).utc().endOf("day").toISOString() : null;
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
      } finally {
        setIsChartLoading(false); // End loading
      }
    };

    fetchCountsData();
  }, [isGraphActive, selectedGenders, selectedMdvi, minAge, maxAge, selectedHospitals, startDate, endDate]);

  // Once hospitals are loaded and selectedHospitals are set, derive selectedHospitalNames
  useEffect(() => {
    if (hospitals && hospitals.length > 0 && selectedHospitals && selectedHospitals.length > 0) {
      const names = hospitals.filter((h) => selectedHospitals.includes(h.id)).map((h) => h.name);
      setSelectedHospitalNames(names);
    }
  }, [hospitals, selectedHospitals]);

  // Update totals when countsData changes
  useEffect(() => {
    if (countsData) {
      // const totalSessions = computeTotalSessions(countsData);
      // setTotalSessions(totalSessions);

      setTotalBeneficiaries(countsData["Unique_Beneficiaries"] || 0);
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
        const endDateUTC = new Date(endDate);
        const params = {
          offset,
          limit: pageSize,
          startDate: startDateUTC.toISOString(),
          endDate: endDateUTC.toISOString(),
          hospitalIds: selectedHospitals,
          genders: selectedGenders,
          min_age: minAge,
          max_age: maxAge,
          mdvis: selectedMdvi,
        };

        // Log the parameters being sent
        console.log(`Fetching data for type: ${type} with params:`, params);

        const queryString = buildDashboardQueryParams(params);
        console.log(`Fetching /api/v2/dashboard/${type}?${queryString}`);

        const response = await fetch(`/api/v2/dashboard/${type}?${queryString}`, {
          method: "GET",
          credentials: "include", // Include credentials for authentication
        });
        const result = await response.json();

        // Log the API response
        console.log(`Response for ${type}:`, result);

        if (response.ok) {
          setData(result.records || []);
          setTotal(result.totalRecords || 0);
        } else {
          console.error(`Error fetching ${type} data:`, result.error);
          alert(`Error fetching ${type} data: ${result.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("An unexpected error occurred while fetching data.");
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
        fetchData(
          "Comprehensive_Low_Vision_Evaluation",
          comprehensivePage,
          setComprehensiveEvaluations,
          setTotalComprehensiveEvaluations
        );
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

  const counselingEducationColDefs = [
    {
      field: "id",
      headerName: "ID",
      filter: true,
      sortable: true,
    },
    {
      field: "beneficiaryId",
      headerName: "Beneficiary ID",
      filter: true,
      sortable: true,
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || "",
      filter: true,
      sortable: true,
    },
    {
      field: "hospitalId",
      headerName: "Hospital ID",
      filter: true,
      sortable: true,
    },
    {
      headerName: "Hospital Name",
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || "",
      filter: true,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "sessionNumber",
      headerName: "Session Number",
      filter: true,
      sortable: true,
    },
    {
      field: "typeCounselling",
      headerName: "Type of Counselling",
      filter: true,
      sortable: true,
    },
    {
      field: "type",
      headerName: "Type",
      filter: true,
      sortable: true,
    },
    {
      field: "vision",
      headerName: "Vision",
      filter: true,
      sortable: true,
    },
    {
      field: "MDVI",
      headerName: "MDVI",
      filter: true,
      sortable: true,
    },
    {
      field: "extraInformation",
      headerName: "Extra Information",
      filter: true,
      sortable: true,
      cellStyle: { whiteSpace: "normal", wordWrap: "break-word" }, // For better text display
    },
  ];

  const comprehensiveLowVisionEvaluationColDefs = [
    {
      field: "id",
      headerName: "ID",
      filter: true,
      sortable: true,
    },
    {
      field: "beneficiaryId",
      headerName: "Beneficiary ID",
      filter: true,
      sortable: true,
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || "",
      filter: true,
      sortable: true,
    },
    {
      field: "hospitalId",
      headerName: "Hospital ID",
      filter: true,
      sortable: true,
    },
    {
      headerName: "Hospital Name",
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || "",
      filter: true,
      sortable: true,
    },
    {
      field: "date",
      headerName: "Date",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "sessionNumber",
      headerName: "Session Number",
      filter: true,
      sortable: true,
    },
    {
      field: "distanceVisualAcuityRE",
      headerName: "Distance Visual Acuity RE",
      filter: true,
      sortable: true,
    },
    {
      field: "distanceVisualAcuityLE",
      headerName: "Distance Visual Acuity LE",
      filter: true,
      sortable: true,
    },
    {
      field: "nearVisualAcuityRE",
      headerName: "Near Visual Acuity RE",
      filter: true,
      sortable: true,
    },
    {
      field: "nearVisualAcuityLE",
      headerName: "Near Visual Acuity LE",
      filter: true,
      sortable: true,
    },
    {
      field: "distanceBinocularVisionBE",
      headerName: "Distance Binocular Vision BE",
      filter: true,
      sortable: true,
    },
    {
      field: "nearBinocularVisionBE",
      headerName: "Near Binocular Vision BE",
      filter: true,
      sortable: true,
    },
    {
      field: "colourVisionRE",
      headerName: "Colour Vision RE",
      filter: true,
      sortable: true,
    },
    {
      field: "colourVisionLE",
      headerName: "Colour Vision LE",
      filter: true,
      sortable: true,
    },
    {
      field: "contrastSensitivityRE",
      headerName: "Contrast Sensitivity RE",
      filter: true,
      sortable: true,
    },
    {
      field: "contrastSensitivityLE",
      headerName: "Contrast Sensitivity LE",
      filter: true,
      sortable: true,
    },
    {
      field: "visualFieldsRE",
      headerName: "Visual Fields RE",
      filter: true,
      sortable: true,
    },
    {
      field: "visualFieldsLE",
      headerName: "Visual Fields LE",
      filter: true,
      sortable: true,
    },
    {
      field: "costElectronic",
      headerName: "Cost Electronic",
      filter: true,
      sortable: true,
    },
    {
      field: "costNonOptical",
      headerName: "Cost Non-Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "costOptical",
      headerName: "Cost Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "costSpectacle",
      headerName: "Cost Spectacle",
      filter: true,
      sortable: true,
    },
    {
      field: "costToBeneficiaryElectronic",
      headerName: "Cost to Beneficiary Electronic",
      filter: true,
      sortable: true,
    },
    {
      field: "costToBeneficiaryNonOptical",
      headerName: "Cost to Beneficiary Non-Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "costToBeneficiaryOptical",
      headerName: "Cost to Beneficiary Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "costToBeneficiarySpectacle",
      headerName: "Cost to Beneficiary Spectacle",
      filter: true,
      sortable: true,
    },
    {
      field: "dispensedDateElectronic",
      headerName: "Dispensed Date Electronic",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "dispensedDateNonOptical",
      headerName: "Dispensed Date Non-Optical",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "dispensedDateOptical",
      headerName: "Dispensed Date Optical",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "dispensedDateSpectacle",
      headerName: "Dispensed Date Spectacle",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "dispensedElectronic",
      headerName: "Dispensed Electronic",
      filter: true,
      sortable: true,
    },
    {
      field: "dispensedNonOptical",
      headerName: "Dispensed Non-Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "dispensedOptical",
      headerName: "Dispensed Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "dispensedSpectacle",
      headerName: "Dispensed Spectacle",
      filter: true,
      sortable: true,
    },
    {
      field: "recommendationElectronic",
      headerName: "Recommendation Electronic",
      filter: true,
      sortable: true,
    },
    {
      field: "recommendationNonOptical",
      headerName: "Recommendation Non-Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "recommendationOptical",
      headerName: "Recommendation Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "recommendationSpectacle",
      headerName: "Recommendation Spectacle",
      filter: true,
      sortable: true,
    },
    {
      field: "trainingGivenElectronic",
      headerName: "Training Given Electronic",
      filter: true,
      sortable: true,
    },
    {
      field: "trainingGivenNonOptical",
      headerName: "Training Given Non-Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "trainingGivenOptical",
      headerName: "Training Given Optical",
      filter: true,
      sortable: true,
    },
    {
      field: "trainingGivenSpectacle",
      headerName: "Training Given Spectacle",
      filter: true,
      sortable: true,
    },
    {
      field: "mdvi",
      headerName: "MDVI",
      filter: true,
      sortable: true,
    },
  ];

  const trainingColDefs = [
    {
      field: "id",
      headerName: "ID",
      filter: true,
      sortable: true,
    },
    {
      field: "beneficiaryId",
      headerName: "Beneficiary ID",
      filter: true,
      sortable: true,
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || "",
      filter: true,
      sortable: true,
    },
    {
      field: "hospitalId",
      headerName: "Hospital ID",
      filter: true,
      sortable: true,
    },
    {
      field: "hospital.name",
      headerName: "Hospital Name",
      filter: true,
      sortable: true,
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || "",
    },
    {
      field: "date",
      headerName: "Date",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "sessionNumber",
      headerName: "Session Number",
      filter: true,
      sortable: true,
    },
    {
      field: "extraInformation",
      headerName: "Extra Information",
      filter: true,
      sortable: true,
      cellStyle: { whiteSpace: "normal", wordWrap: "break-word" }, // For better text display
    },
    {
      field: "type",
      headerName: "Type",
      filter: true,
      sortable: true,
    },
    {
      field: "subType",
      headerName: "Sub-Type",
      filter: true,
      sortable: true,
    },
  ];

  const visionEnhancementColDefs = [
    {
      field: "id",
      headerName: "ID",
      filter: true,
      sortable: true,
    },
    {
      field: "beneficiaryId",
      headerName: "Beneficiary ID",
      filter: true,
      sortable: true,
    },
    {
      headerName: "Beneficiary Name",
      valueGetter: (params) => params.data.beneficiary?.beneficiaryName || "",
      filter: true,
      sortable: true,
    },
    {
      field: "hospitalId",
      headerName: "Hospital ID",
      filter: true,
      sortable: true,
    },
    {
      field: "hospital.name",
      headerName: "Hospital Name",
      filter: true,
      sortable: true,
      valueGetter: (params) => params.data.beneficiary?.hospital?.name || "",
    },
    {
      field: "date",
      headerName: "Date",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
      },
    },
    {
      field: "sessionNumber",
      headerName: "Session Number",
      filter: true,
      sortable: true,
    },
    {
      field: "extraInformation",
      headerName: "Extra Information",
      filter: true,
      sortable: true,
      cellStyle: { whiteSpace: "normal", wordWrap: "break-word" }, // For better text display
    },
    {
      field: "diagnosis",
      headerName: "Diagnosis",
      filter: true,
      sortable: true,
    },
    {
      field: "MDVI",
      headerName: "MDVI",
      filter: true,
      sortable: true,
    },
  ];

  const beneficiaryColDefs = [
    {
      headerName: "Edit",
      cellRenderer: EditButtonRenderer,
      width: 150,
      filter: false,
      sortable: false,
      cellStyle: { display: "flex", justifyContent: "center", alignItems: "center" },
    },
    { field: "mrn", headerName: "MRN", filter: true, sortable: true },
    { field: "beneficiaryName", headerName: "Beneficiary Name", filter: true, sortable: true },
    { field: "hospitalId", headerName: "Hospital ID", filter: true, sortable: true },
    {
      field: "hospital.name",
      headerName: "Hospital Name",
      filter: true,
      sortable: true,
      valueGetter: (params) => params.data.hospital?.name || "",
    },
    {
      field: "dateOfBirth",
      headerName: "Date of Birth",
      filter: "agDateColumnFilter",
      sortable: true,
      valueFormatter: (params) => {
        return params.value ? moment(params.value).format("YYYY-MM-DD") : "";
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
          return "";
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
          if (gender === "male" || gender === "m") {
            return "M";
          } else if (gender === "female" || gender === "f") {
            return "F";
          }
        }
        return "";
      },
    },
    { field: "phoneNumber", headerName: "Phone Number", filter: true, sortable: true },
    { field: "education", headerName: "Education", filter: true, sortable: true },
    { field: "occupation", headerName: "Occupation", filter: true, sortable: true },
    { field: "districts", headerName: "District", filter: true, sortable: true },
    { field: "state", headerName: "State", filter: true, sortable: true },
    { field: "diagnosis", headerName: "Diagnosis", filter: true, sortable: true },
    { field: "diagnosisNotes", headerName: "Diagnosis Notes", filter: true, sortable: true },
    { field: "vision", headerName: "Vision", filter: true, sortable: true },
    {
      field: "mDVI",
      headerName: "MDVI",
      filter: true,
      sortable: true,
      valueFormatter: (params) => (params.value ? "Yes" : "No"),
    },
    { field: "extraInformation", headerName: "Extra Information", filter: true, sortable: true },
  ];

  // Handle sub-tab changes
  const handleSubTabChange = (event, newValue) => {
    setSubTabIndex(newValue);
  };

  // Handle hospital selection changes
  const handleMultiSelectChange = (e) => {
    const {
      target: { value },
    } = e;
    setSelectedHospitalNames(value);
    setSelectedHospitals(hospitals.filter((hospital) => value.includes(hospital.name)).map((hospital) => hospital.id));
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
  const electronicRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, "Electronic") : null;
  const spectacleRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, "Spectacle") : null;
  const opticalRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, "Optical") : null;
  const nonOpticalRecDevicesGraphData = countsData ? buildRecDevicesBreakdownGraph(countsData, "NonOptical") : null;

  const visualAcuityCategories = [
    "Blindness",
    "Severe visual impairment",
    "Moderate visual impairment",
    "Mild visual impairment",
    "Visual Acuity normal",
    // 'Other',
  ];

  const visualAcuityChartData =
    countsData && countsData.distanceBinocularVisionBE_counts
      ? {
        labels: visualAcuityCategories,
        datasets: [
          {
            label: "Number of Cases",
            data: visualAcuityCategories.map(
              (category) => countsData.distanceBinocularVisionBE_counts[category] || 0
            ),
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(153, 102, 255, 0.6)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(153, 102, 255, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
      : null;

  // Generate Unique Beneficiaries Graph Data with Drilldown
  // const uniqueBeneficiariesGraphData = buildUniqueBeneficiariesGraph(countsData, uniqueBeneficiariesDrilledDown);
  const uniqueBeneficiariesGraphData = buildUniqueBeneficiariesGraph(
    countsData,
    selectedHospitals,
    hospitals,
    uniqueBeneficiariesDrilledDown
  );

  // Define options with an onClick handler for Training Types chart
  const trainingTypesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Training Types Distribution",
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
        if (trainingGraphData.labels && trainingGraphData.labels.length > index) {
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
        position: "top",
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

  const uniqueBeneficiariesOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: uniqueBeneficiariesDrilledDown, // Enable stacking when drilled down
        title: {
          display: true,
          text: "Hospitals",
        },
      },
      y: {
        stacked: uniqueBeneficiariesDrilledDown, // Enable stacking when drilled down
        title: {
          display: true,
          text: "Number of Unique Beneficiaries",
        },
        beginAtZero: true,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        // Toggle drill-down mode
        setUniqueBeneficiariesDrilledDown(!uniqueBeneficiariesDrilledDown);
      }
    },
  };

  // Function to build Gender Graph using countsData
  function buildGenderGraph(countsData) {
    if (!countsData || !countsData.genderCounts) {
      return {
        labels: ["Male", "Female"],
        datasets: [
          {
            label: "Gender Distribution",
            data: [0, 0, 0],
            backgroundColor: ["rgba(54, 162, 235, 0.6)", "rgba(255, 99, 132, 0.6)", "rgba(255, 206, 86, 0.6)"],
            borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)", "rgba(255, 206, 86, 1)"],
            borderWidth: 1,
          },
        ],
      };
    }

    const { Male, Female } = countsData.genderCounts;

    const chartData = {
      labels: ["Male", "Female"],
      datasets: [
        {
          label: "Gender Distribution",
          data: [Male, Female],
          backgroundColor: ["rgba(54, 162, 235, 0.6)", "rgba(255, 99, 132, 0.6)", "rgba(255, 206, 86, 0.6)"],
          borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)", "rgba(255, 206, 86, 1)"],
          borderWidth: 1,
        },
      ],
    };

    return chartData;
  }

  // Function to build Age Graph using countsData
  function buildAgeGraph(countsData) {
    if (!countsData || !countsData.ageGroupCounts) {
      return {
        labels: ["0-18", "19-35", "36-50", "51-65", "66+"],
        datasets: [
          {
            label: "Age Distribution",
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(54, 162, 235, 0.6)",
            ],
            borderColor: [
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    const ageGroups = countsData.ageGroupCounts;

    const chartData = {
      labels: Object.keys(ageGroups),
      datasets: [
        {
          label: "Age Distribution",
          data: Object.values(ageGroups),
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(54, 162, 235, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(54, 162, 235, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    return chartData;
  }

  // Handle graph tabs
  const renderGraph = () => {
    if (isChartLoading) {
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <CircularProgress />
          <p>Loading charts...</p>
        </div>
      );
    }

    // If no data yet (and not loading), show a message
    if (!countsData) {
      return <p>Please select filters to view charts.</p>;
    }

    if (selectedHospitals.length === 0) {
      return (
        <p>
          <br></br>Please select hospitals to view the graphs.
        </p>
      );
    }
    switch (activeGraphTab) {
      case 0:
        switch (activeBeneficiaryGraphTab) {
          case 0:
            return countsData ? (
              <div>
                <Bar data={buildTotalBeneficiariesGraph(countsData, selectedHospitals, hospitals)} />
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadChartData(
                      buildTotalBeneficiariesGraph(countsData, selectedHospitals, hospitals),
                      "Total_Beneficiaries"
                    )
                  }
                  style={{ marginTop: "10px" }}
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
                {uniqueBeneficiariesDrilledDown && (
                  <Button
                    variant="outlined"
                    onClick={() => setUniqueBeneficiariesDrilledDown(false)}
                    style={{ marginBottom: "10px" }}
                  >
                    Back to Total
                  </Button>
                )}
                <Bar data={uniqueBeneficiariesGraphData} options={uniqueBeneficiariesOptions} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(uniqueBeneficiariesGraphData, "Unique_Beneficiaries")}
                  style={{ marginTop: "10px" }}
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
                <Bar data={buildSessionsGraph(countsData, selectedHospitals, hospitals)} />
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadChartData(buildSessionsGraph(countsData, selectedHospitals, hospitals), "Total_Sessions")
                  }
                  style={{ marginTop: "10px" }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 3:
            return countsData && countsData.genderCounts ? (
              <div>
                <Bar data={buildGenderGraph(countsData)} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildGenderGraph(countsData), "Gender_Distribution")}
                  style={{ marginTop: "10px" }}
                >
                  Download Data
                </Button>
              </div>
            ) : (
              <p>Loading...</p>
            );
          case 4:
            return countsData && countsData.ageGroupCounts ? (
              <div>
                <Bar data={buildAgeGraph(countsData)} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(buildAgeGraph(countsData), "Age_Distribution")}
                  style={{ marginTop: "10px" }}
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
                  onClick={() => downloadChartData(activitiesChartData, "All_Activities")}
                  style={{ marginTop: "10px" }}
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
                    onClick={() => setTrainingDrillDown({ active: false, type: null })}
                    style={{ marginBottom: "10px" }}
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
                        onClick={() =>
                          downloadChartData(
                            buildTrainingSubtypesGraph(countsData, trainingDrillDown.type),
                            `Training_Subtypes_${trainingDrillDown.type}`
                          )
                        }
                        style={{ marginTop: "10px" }}
                      >
                        Download Data
                      </Button>
                    </div>
                  ) : (
                    <p>No sub-type data available for {trainingDrillDown.type}.</p>
                  )
                ) : (
                  <div>
                    <Bar data={buildTrainingTypesGraph(countsData)} options={trainingTypesOptions} />
                    <Button
                      variant="outlined"
                      onClick={() => downloadChartData(buildTrainingTypesGraph(countsData), "Training_Types")}
                      style={{ marginTop: "10px" }}
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
                <Bar data={buildBreakdownGraph(countsData, "counsellingEducation")} options={options} />
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadChartData(buildBreakdownGraph(countsData, "counsellingEducation"), "Counselling_Education")
                  }
                  style={{ marginTop: "10px" }}
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
                  onClick={() => downloadChartData(buildDevicesGraph(countsData), "Dispensed_Devices")}
                  style={{ marginTop: "10px" }}
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
                <Bar data={buildDevicesBreakdownGraph(countsData, "Electronic")} options={options} />
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadChartData(
                      buildDevicesBreakdownGraph(countsData, "Electronic"),
                      "Dispensed_Electronic_Devices"
                    )
                  }
                  style={{ marginTop: "10px" }}
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
                <Bar data={buildDevicesBreakdownGraph(countsData, "Spectacle")} options={options} />
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadChartData(
                      buildDevicesBreakdownGraph(countsData, "Spectacle"),
                      "Dispensed_Spectacle_Devices"
                    )
                  }
                  style={{ marginTop: "10px" }}
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
                <Bar data={buildDevicesBreakdownGraph(countsData, "Optical")} options={options} />
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadChartData(buildDevicesBreakdownGraph(countsData, "Optical"), "Dispensed_Optical_Devices")
                  }
                  style={{ marginTop: "10px" }}
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
                <Bar data={buildDevicesBreakdownGraph(countsData, "NonOptical")} options={options} />
                <Button
                  variant="outlined"
                  onClick={() =>
                    downloadChartData(
                      buildDevicesBreakdownGraph(countsData, "NonOptical"),
                      "Dispensed_NonOptical_Devices"
                    )
                  }
                  style={{ marginTop: "10px" }}
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
                {!countsData || !countsData["Devices_Recommended"] ? (
                  <p>Loading recommended devices data...</p>
                ) : (
                  <div>
                    <Bar data={buildRecDevicesGraph(countsData)} />
                    <Button
                      variant="outlined"
                      onClick={() => downloadChartData(buildRecDevicesGraph(countsData), "Recommended_Devices")}
                      style={{ marginTop: "10px" }}
                    >
                      Download Data
                    </Button>
                  </div>
                )}
              </div>
            );
          case 1:
            return (
              <div>
                <Bar data={electronicRecDevicesGraphData} options={options} />
                <Button
                  variant="outlined"
                  onClick={() => downloadChartData(electronicRecDevicesGraphData, "Recommended_Electronic_Devices")}
                  style={{ marginTop: "10px" }}
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
                  onClick={() => downloadChartData(spectacleRecDevicesGraphData, "Recommended_Spectacle_Devices")}
                  style={{ marginTop: "10px" }}
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
                  onClick={() => downloadChartData(opticalRecDevicesGraphData, "Recommended_Optical_Devices")}
                  style={{ marginTop: "10px" }}
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
                  onClick={() => downloadChartData(nonOpticalRecDevicesGraphData, "Recommended_NonOptical_Devices")}
                  style={{ marginTop: "10px" }}
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
            <Box sx={{ textAlign: "center", marginTop: "20px" }}>
              <Bar data={visualAcuityChartData} options={visualAcuityOptions} />
            </Box>
            <Button
              variant="outlined"
              onClick={() => downloadChartData(visualAcuityChartData, "Visual_Acuity_Distribution")}
              style={{ marginTop: "10px" }}
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <GraphCustomizer
              user={user}
              summary={hospitals}
              selectedHospitals={selectedHospitalNames}
              handleHospitalSelection={handleMultiSelectChange}
              startDate={startDate}
              endDate={endDate}
              handleAllSelect={handleAllSelect}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              selectedQuarter={selectedQuarter}
              setSelectedQuarter={setSelectedQuarter}
            />

            {/* All Filters Button */}
            <Button
              variant="contained"
              startIcon={<MenuIcon />}
              onClick={handleDrawerOpen}
              sx={{ marginLeft: 0, width: "160px", height: "55px" }}
            >
              All Filters
            </Button>
          </Box>

          {/* Drawer component to hold filters */}
          <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}>
            <Box sx={{ width: 310 }} role="presentation">
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
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    setDownloadDataTypes(
                      ["Beneficiary", "Vision_Enhancement", "Training", "Comprehensive_Low_Vision_Evaluation", "Counselling_Education"][subTabIndex]
                        ? [["Beneficiary", "Vision_Enhancement", "Training", "Comprehensive_Low_Vision_Evaluation", "Counselling_Education"][subTabIndex]]
                        : ["Beneficiary"]
                    );
                    setDownloadGenders([...selectedGenders]);
                    setDownloadMdvi([...selectedMdvi]);
                    setDownloadMinAge(minAge);
                    setDownloadMaxAge(maxAge);
                    setDownloadModalOpen(true);
                  }}
                >
                  Download Report
                </Button>
              </Box>

              {/* Sub-Tabs within Table */}
              <Tabs value={subTabIndex} onChange={handleSubTabChange} centered>
                <Tab label="Beneficiaries" />
                <Tab label="Vision Enhancement" />
                <Tab label="Training" />
                <Tab label="Comprehensive Low Vision Evaluation" />
                <Tab label="Counselling" />
              </Tabs>

              {/* Beneficiaries Tab */}
              {subTabIndex === 0 &&
                (isLoading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <CircularProgress />
                    <p>Loading beneficiaries...</p>
                  </div>
                ) : beneficiaries.length > 0 ? (
                  <PaginatedTable
                    data={beneficiaries}
                    columnDefs={beneficiaryColDefs}
                    page={beneficiaryPage}
                    totalRecords={totalBeneficiaries}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    onPageChange={(newPage) => setBeneficiaryPage(newPage)}
                  />
                ) : (
                  <p>No Beneficiary records found for the selected filters.</p>
                ))}

              {/* Vision Enhancement Tab */}
              {subTabIndex === 1 &&
                (isLoading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <CircularProgress />
                    <p>Loading vision enhancements...</p>
                  </div>
                ) : visionEnhancements.length > 0 ? (
                  <PaginatedTable
                    data={visionEnhancements}
                    columnDefs={visionEnhancementColDefs}
                    page={visionEnhancementPage}
                    totalRecords={totalVisionEnhancements}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    onPageChange={(newPage) => setVisionEnhancementPage(newPage)}
                  />
                ) : (
                  <p>No Vision Enhancement records found for the selected filters.</p>
                ))}

              {/* Training Tab */}
              {subTabIndex === 2 &&
                (isLoading ? (
                  <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <CircularProgress />
                    <p>Loading trainings ...</p>
                  </div>
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
                ))}

              {/* Comprehensive Low Vision Evaluation Tab */}
              {subTabIndex === 3 &&
                (isLoading ? (
                  <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <CircularProgress />
                    <p>Loading CLVEs ...</p>
                  </div>
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
                ))}

              {/* Counselling Tab */}
              {subTabIndex === 4 &&
                (isLoading ? (
                  <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <CircularProgress />
                    <p>Loading counsellings ...</p>
                  </div>
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
                ))}
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

      <Dialog open={downloadModalOpen} onClose={() => setDownloadModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Download Report</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>Data Type</Typography>
          <FormGroup sx={{ mb: 2 }}>
            {[
              { key: "Beneficiary", label: "Beneficiaries" },
              { key: "Vision_Enhancement", label: "Vision Enhancement" },
              { key: "Training", label: "Training" },
              { key: "Comprehensive_Low_Vision_Evaluation", label: "Comprehensive Low Vision Evaluation" },
              { key: "Counselling_Education", label: "Counselling Education" },
            ].map(({ key, label }) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={downloadDataTypes.includes(key)}
                    onChange={() => toggleDownloadDataType(key)}
                    size="small"
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>

          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>Gender</Typography>
          <FormGroup row sx={{ mb: 2 }}>
            {["Male", "Female", "Other"].map((g) => (
              <FormControlLabel
                key={g}
                control={
                  <Checkbox checked={downloadGenders.includes(g)} onChange={() => toggleDownloadGender(g)} size="small" />
                }
                label={g}
              />
            ))}
          </FormGroup>

          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>MDVI</Typography>
          <FormGroup row sx={{ mb: 2 }}>
            {["Yes", "No"].map((m) => (
              <FormControlLabel
                key={m}
                control={
                  <Checkbox checked={downloadMdvi.includes(m)} onChange={() => toggleDownloadMdvi(m)} size="small" />
                }
                label={m}
              />
            ))}
          </FormGroup>

          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>Age Range</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              label="Min Age"
              type="number"
              size="small"
              value={downloadMinAge ?? ""}
              onChange={(e) => setDownloadMinAge(e.target.value ? Number(e.target.value) : null)}
              fullWidth
            />
            <TextField
              label="Max Age"
              type="number"
              size="small"
              value={downloadMaxAge ?? ""}
              onChange={(e) => setDownloadMaxAge(e.target.value ? Number(e.target.value) : null)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDownloadModalOpen(false)} disabled={isDownloading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReport}
            disabled={isDownloading || downloadDataTypes.length === 0}
          >
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
