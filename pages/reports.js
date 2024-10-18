import { readUser, allHospitalRoles } from "./api/user";
import { getSession } from "next-auth/react";
import { Chart as ChartJS } from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import { getSummaryForAllHospitals } from "@/pages/api/hospital";
import { Container } from "react-bootstrap";
import Navigation from "./navigation/Navigation";
import Layout from './components/layout';
import moment from "moment";
import { useState, useEffect } from "react";
import GraphCustomizer from "./components/GraphCustomizer";
import { Tab, Tabs, Paper } from "@mui/material";
import { isNotNullBlankOrUndefined } from "@/constants/globalFunctions";
import {
  filterTrainingSummaryByDateRange,
} from "@/constants/reportFunctions";
import ReportCustomizer from './customizedReport';
import { AgGridReact } from 'ag-grid-react'; 
import "ag-grid-community/styles/ag-grid.css"; 
import "ag-grid-community/styles/ag-theme-quartz.css"; 
import { getTrainingTypes } from './api/trainingType';

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

  const getHospitalIdsByUsers = (id, users) => {
    let hospitalIds = [];
    for (const user of users) {
      if (user.userId === id) {
        hospitalIds.push(user.hospitalId);
      }
    }
    return hospitalIds;
  };

  // If it's a non-admin user, we only want to show the summary for their hospital
  const user = await readUser(session.user.email);
  const roles = await allHospitalRoles();
  let hospitalIds;
  const isAdmin = user.admin != null;
  if (!isAdmin) {
    hospitalIds = getHospitalIdsByUsers(user.id, roles);
  }

  // Fetch the summary and other necessary data
  const summary = await getSummaryForAllHospitals(isAdmin, hospitalIds);

  // Fetch trainingTypes before returning props
  const trainingTypes = await getTrainingTypes();

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      summary: JSON.parse(JSON.stringify(summary)),
      error: null,
      trainingTypes, // Pass trainingTypes to props
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

// Function that builds a bar graph to show number of beneficiaries per hospital
function buildBeneficiaryGraph(data) {
  // data is an array of hospital objects
  const simplifiedData = data.map((hospital) => {
    return {
      name: hospital.name,
      value: hospital.beneficiary.length,
    };
  });

  // create a bar graph with graphData
  const graphData = {
    labels: simplifiedData.map((hospital) => hospital.name),
    datasets: [
      {
        label: "Beneficiaries",
        data: simplifiedData.map((hospital) => hospital.value),
        ...graphOptions,
      },
    ],
  };
  return graphData;
}

// Function that builds a bar graph to show all the activities involved
function buildActivitiesGraph(data) {
  //First get the evaluations
  const lowVisionScreeningCount = data.reduce(
    (sum, item) => sum + item.lowVisionEvaluation.length,
    0
  );
  const comprehensiveLowVisionEvaluationCount = data.reduce(
    (sum, item) => sum + item.comprehensiveLowVisionEvaluation.length,
    0
  );
  const visionEnhancementCount = data.reduce(
    (sum, item) => sum + item.visionEnhancement.length,
    0
  );

  // Then the trainings
  const mobileTrainingCount = data.reduce(
    (sum, item) => sum + item.mobileTraining.length,
    0
  );
  const computerTrainingCount = data.reduce(
    (sum, item) => sum + item.computerTraining.length,
    0
  );
  const orientationMobilityTrainingCount = data.reduce(
    (sum, item) => sum + item.orientationMobilityTraining.length,
    0
  );
  const trainingCount =
    data.reduce((sum, item) => sum + item.training.length, 0) +
    mobileTrainingCount +
    computerTrainingCount +
    orientationMobilityTrainingCount;

  // Then the counselling
  const counsellingCount = data.reduce(
    (sum, item) => sum + item.counsellingEducation.length,
    0
  );

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

// Function that builds a bar graph at a sublevel. This function is called
// with both "training" and "counselling" as the breakdownType
function buildBreakdownGraph(data, breakdownType) {
  const types = data.reduce((types, hospital) => {
    const hospitalTypes = hospital[breakdownType].map((item) => item.type);
    return [...types, ...hospitalTypes];
  }, []);

  const typeCounts = types.reduce((counts, type) => {
    const count = counts[type] || 0;
    return {
      ...counts,
      [type]: count + 1,
    };
  }, {});

  const chartData = {
    labels: Object.keys(typeCounts),
    datasets: [
      {
        label: "Cumulative Counts",
        data: Object.values(typeCounts),
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

// Function that builds a bar graph to show the number of devices dispensed
function buildDevicesGraph(data) {
  // The device information is stored inside the comprehensiveLowVisionEvaluation array
  // Inside the array, there are fields dispensedSpectacle, dispensedElectronic, dispensedOptical, dispensedNonOptical
  // We want to count the number of entries in which these fields are not empty
  const dispensedSpectacleCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.dispensedSpectacle)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.dispensedSpectacle.split("; ").length;
      }, 0);
      return sum + count;
    },
    0
  );
  const dispensedElectronicCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.dispensedElectronic)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.dispensedElectronic.split("; ").length;
      }, 0);
      return sum + count;
    },
    0
  );
  const dispensedOpticalCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.dispensedOptical)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.dispensedOptical.split("; ").length;
      }, 0);
      return sum + count;
    },
    0
  );
  const dispensedNonOpticalCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.dispensedNonOptical)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.dispensedNonOptical.split("; ").length;
      }, 0);
      return sum + count;
    },
    0
  );

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

// Function that builds a bar graph to show the number of devices recommended
function buildRecDevicesGraph(data) {
  // The device information is stored inside the comprehensiveLowVisionEvaluation array
  // Inside the array, there are fields dispensedSpectacle, dispensedElectronic, dispensedOptical, dispensedNonOptical
  // We want to count the number of entries in which these fields are not empty
  const dispensedSpectacleCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.recommendationSpectacle)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.recommendationSpectacle.split(",").length;
      }, 0);
      return sum + count;
    },
    0
  );
  const dispensedElectronicCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.recommendationElectronic)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.recommendationElectronic.split(",").length;
      }, 0);
      return sum + count;
    },
    0
  );
  const dispensedOpticalCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.recommendationOptical)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.recommendationOptical.split(",").length;
      }, 0);
      return sum + count;
    },
    0
  );
  const dispensedNonOpticalCount = data.reduce(
    (sum, item) => {
      const items = item.comprehensiveLowVisionEvaluation.filter(
        (evaluation) => isNotNullBlankOrUndefined(evaluation.recommendationNonOptical)
      );
      const count = items.reduce((sum, evaluation) => {
        return sum + evaluation.recommendationNonOptical.split(",").length;
      }, 0);
      return sum + count;
    },
    0
  );

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

// Function that builds a bar graph at a sublevel. This function is called
// with different devices types as the breakdownType (can be one of the AllowedDevices)
const allowedDevices = ["Electronic", "Spectacle", "Optical", "NonOptical"];
function buildDevicesBreakdownGraph(data, breakdownType) {
  if (!allowedDevices.includes(breakdownType)) {
    breakdownType = "Electronic";
  }
  const dispensedKey = "dispensed" + breakdownType;
  const deviceList = data.reduce((types, hospital) => {
    const filteredEvaluations = hospital.comprehensiveLowVisionEvaluation.filter(
      (evaluation) => isNotNullBlankOrUndefined(evaluation[dispensedKey])
    )
    const deviceTypes = filteredEvaluations.map((item) => item[dispensedKey].split("; "));
    return [...types, ...deviceTypes];
  }, []);

  const types = deviceList.reduce((accumulator, currentValue) => {
    return accumulator.concat(currentValue);
  }, []);

  const typeCounts = types.reduce((counts, type) => {
    const count = counts[type] || 0;
    return {
      ...counts,
      [type]: count + 1,
    };
  }, {});

  const chartData = {
    labels: Object.keys(typeCounts),
    datasets: [
      {
        label: "Cumulative Counts",
        data: Object.values(typeCounts),
        ...graphOptions,
      },
    ],
  };

  return chartData;
}

// Function that builds a bar graph at a sublevel for recommended devices. This function is called
// with different devices types as the breakdownType (can be one of the AllowedDevices)
function buildRecDevicesBreakdownGraph(data, breakdownType) {
  if (!allowedDevices.includes(breakdownType)) {
    breakdownType = "Electronic";
  }
  const dispensedKey = "recommendation" + breakdownType;
  const deviceList = data.reduce((types, hospital) => {
    const filteredEvaluations = hospital.comprehensiveLowVisionEvaluation.filter(
      (evaluation) => isNotNullBlankOrUndefined(evaluation[dispensedKey])
    )
    const deviceTypes = filteredEvaluations.map((item) => item[dispensedKey].split(","));
    return [...types, ...deviceTypes];
  }, []);

  const types = deviceList.reduce((accumulator, currentValue) => {
    return accumulator.concat(currentValue);
  }, []);

  const typeCounts = types.reduce((counts, type) => {
    const count = counts[type] || 0;
    return {
      ...counts,
      [type]: count + 1,
    };
  }, {});

  const chartData = {
    labels: Object.keys(typeCounts),
    datasets: [
      {
        label: "Cumulative Counts",
        data: Object.values(typeCounts),
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

export default function Summary({
  user,
  summary,
  trainingTypes,
}) {
  // create start date and end data states, start date is set to one year ago, end date is set to today
  const [startDate, setStartDate] = useState(
    moment().subtract(1, "year").toDate()
  );
  const [endDate, setEndDate] = useState(moment().toDate());
  const [masterTabIndex, setMasterTabIndex] = useState(0); // State to manage the master tab (Table/Graph)
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedHospitalNames, setSelectedHospitalNames] = useState([]);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Column Definitions for AgGridReact
  const [colDefs] = useState([
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

  // Fetch Beneficiaries based on selected hospitals and date range
  useEffect(() => {
    async function fetchBeneficiaries() {
      if (selectedHospitals.length === 0) {
        setBeneficiaries([]);
        return;
      }
      setIsLoading(true);
      try {
        // Ensure startDate and endDate are correctly set
        const startDateUTC = new Date(startDate);
        startDateUTC.setUTCHours(0, 0, 0, 0);
        const endDateUTC = new Date(endDate);
        endDateUTC.setUTCHours(23, 59, 59, 999);

        // Fetch data from the API
        const beneficiaryListAPI = selectedHospitals.map((id) =>
          fetch(
            `/api/beneficiaryList?id=${id}&startDate=${startDateUTC.toUTCString()}&endDate=${endDateUTC.toUTCString()}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          )
        );
        const responses = await Promise.all(beneficiaryListAPI);
        const finalResult = await Promise.all(
          responses.map((res) => (res.json ? res.json().catch((err) => err) : res))
        );
        const beneficiaryList = finalResult.flat();

        // Filter the data based on date range and selected hospitals
        const dateFilteredBeneficiaryData = filterTrainingSummaryByDateRange(
          startDate,
          endDate,
          beneficiaryList,
          "beneficiary"
        );

        const filteredBeneficiaryData = dateFilteredBeneficiaryData.filter((item) =>
          selectedHospitals.includes(item.hospital.id)
        );

        setBeneficiaries(filteredBeneficiaryData);
      } catch (error) {
        setErrorState(error);
        console.error("Error fetching beneficiary list:", errorState);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBeneficiaries();
  }, [selectedHospitals, startDate, endDate, errorState]);

  useEffect(() => {
    setSelectedHospitals([summary?.[0]?.id]);
  }, [summary]);

  useEffect(() => {
    setSelectedHospitalNames([summary?.[0]?.name]);
  }, [summary]);

  const handleMultiSelectChange = (e) => {
    const {
      target: { value },
    } = e;
    setSelectedHospitalNames(value);
    setSelectedHospitals(
      summary
        .filter((hospital) => value.includes(hospital.name))
        .map((hospital) => hospital.id)
    );
  };

  const handleAllSelect = (e, allSelect) => {
    if (allSelect) {
      setSelectedHospitals(summary.map((item) => item.id));
      setSelectedHospitalNames(summary.map((item) => item.name));
    } else {
      setSelectedHospitals([]);
      setSelectedHospitalNames([]);
    }
  };

  // filter summary data based on start and end date of the training
  const dateFilteredSummary = filterTrainingSummaryByDateRange(
    startDate,
    endDate,
    summary,
    "hospital"
  );

  // filter summary data based on selected hospitals
  const filteredSummary = dateFilteredSummary.filter((item) =>
    selectedHospitals.includes(item.id)
  );

  // generate all the data for required graphs
  const beneficiaryGraphData = buildBeneficiaryGraph(filteredSummary);
  const genderGraphData = buildGenderGraph(beneficiaries);
  const ageGraphData = buildAgeGraph(beneficiaries);
  const activitiesGraphData = buildActivitiesGraph(filteredSummary);
  const trainingBreakdownGraphData = buildBreakdownGraph(
    filteredSummary,
    "training"
  );
  const counsellingBreakdownGraphData = buildBreakdownGraph(
    filteredSummary,
    "counsellingEducation"
  );
  const devicesGraphData = buildDevicesGraph(filteredSummary);
  const electronicDevicesGraphData =  buildDevicesBreakdownGraph(filteredSummary, "Electronic");
  const spectacleDevicesGraphData =  buildDevicesBreakdownGraph(filteredSummary, "Spectacle");
  const opticalDevicesGraphData =  buildDevicesBreakdownGraph(filteredSummary, "Optical");
  const nonOpticalDevicesGraphData =  buildDevicesBreakdownGraph(filteredSummary, "NonOptical");

  const recDevicesGraphData = buildRecDevicesGraph(filteredSummary);
  const electronicRecDevicesGraphData =  buildRecDevicesBreakdownGraph(filteredSummary, "Electronic");
  const spectacleRecDevicesGraphData =  buildRecDevicesBreakdownGraph(filteredSummary, "Spectacle");
  const opticalRecDevicesGraphData =  buildRecDevicesBreakdownGraph(filteredSummary, "Optical");
  const nonOpticalRecDevicesGraphData =  buildRecDevicesBreakdownGraph(filteredSummary, "NonOptical");

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
    switch (activeGraphTab) {
      case 0:
        switch (activeBeneficiaryGraphTab) {
          case 0:
            return <Bar data={beneficiaryGraphData} options={options} />;
          case 1:
            return <Bar data={genderGraphData} options={options} />;
          case 2:
            return <Bar data={ageGraphData} options={options} />;
          default:
            return null;
        }
      case 1:
        switch (activeActivitiesGraphTab) {
          case 0:
            return <Bar data={activitiesGraphData} options={options} />;
          case 1:
            return <Bar data={trainingBreakdownGraphData} options={options} />;
          case 2:
            return <Bar data={counsellingBreakdownGraphData} options={options} />;
          default:
            return null;
        }
      case 2:
        switch (activeDevicesGraphTab) {
          case 0:
            return <Bar data={devicesGraphData} options={options} />;
          case 1:
            return <Bar data={electronicDevicesGraphData} options={options} />;
          case 2:
            return <Bar data={spectacleDevicesGraphData} options={options} />;
          case 3:
              return <Bar data={opticalDevicesGraphData} options={options} />;
          case 4:
              return <Bar data={nonOpticalDevicesGraphData} options={options} />;
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
          <h1 className="text-center mt-4 mb-4">Reports</h1>
          
          <div className="col-md-3">
            <GraphCustomizer
              user={user}
              summary={summary}
              selectedHospitals={selectedHospitalNames}
              handleHospitalSelection={handleMultiSelectChange}
              startDate={startDate}
              handleStartDateChange={(e) => setStartDate(moment(e.target.value).toDate())}
              endDate={endDate}
              handleEndDateChange={(e) => setEndDate(moment(e.target.value).toDate())}
              handleAllSelect={handleAllSelect}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          </div>
          <br />

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
            <Tab label="Download" />
          </Tabs>

          {/* Render Table, Graphs, or Download based on selected Master Tab */}
          {masterTabIndex === 0 && (
              <div>
              <h2 className="text-center mt-4 mb-4">Beneficiaries Table</h2>
              {isLoading && <p>Loading beneficiaries...</p>}
              {!isLoading && beneficiaries.length > 0 && (
                <div className="ag-theme-quartz" style={{ height: '600px', width: '100%' }}>
                  <AgGridReact
                    rowData={beneficiaries}
                    columnDefs={colDefs}
                    pagination={true}
                    paginationPageSize={50} // Adjust page size as needed
                  />
                </div>
              )}
              {!isLoading && beneficiaries.length === 0 && (
                <p>No beneficiaries found for the selected date range.</p>
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
                        <Tab label="All Beneficiaries" />
                        <Tab label="Gender Distribution" />
                        <Tab label="Age Distribution" />
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

                    {/* Render the selected graph */}
                    {renderGraph()}
                  </Paper>
                </div>
              </div>
            </div>
          )}
          {masterTabIndex === 2 && (
            <div className="text-center mt-4">
              <div className="mt-4">
                {/* Customized Report Page */}
                <ReportCustomizer
                  user={user}
                  summary={summary}
                  trainingTypes={trainingTypes}
                  startDate={startDate}
                  endDate={endDate}
                  selectedHospitals={selectedHospitalNames}
                />
              </div>
            </div>
          )}
        </Container>
        <br />
      </div>
    </Layout>
  );
}
