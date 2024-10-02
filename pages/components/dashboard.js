import Navigation from "../navigation/Navigation";
import Layout from './layout';
import Head from "next/head";
import { getSession } from "next-auth/react";
import { readUser } from "../api/user";
import { AgGridReact } from 'ag-grid-react'; 
import "ag-grid-community/styles/ag-grid.css"; 
import "ag-grid-community/styles/ag-theme-quartz.css"; 
import { useState, useEffect, useRef } from "react";
import { readBeneficiaryOtherParam } from "../api/beneficiary";
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Tabs, Tab, Box, TextField } from "@mui/material";
import * as agCharts from 'ag-charts-community';

// Helper function to calculate date for the last 6 months
function getSixMonthsAgoDate() {
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
  return sixMonthsAgo.toISOString().split('T')[0];  // Format as yyyy-mm-dd
}

// Beneficiary Table Component
function BeneficiaryTable({ users, selectedHospitals, rowData, setRowData }) {
  const globalFieldOptions = { filter: true };
  const pagination = true;
  const paginationPageSize = 100;
  const paginationPageSizeSelector = [50, 100, 500];

  useEffect(() => {
    if (selectedHospitals.length > 0) {
      const filteredData = users.filter(user => selectedHospitals.includes(user.hospitalName));
      setRowData(filteredData);
    } else {
      setRowData(users); // Show all users if no hospital is selected
    }
  }, [selectedHospitals, users, setRowData]);

  const colDefs = [
    { field: "mrn", tooltipField: "mrn", ...globalFieldOptions },
    { field: "beneficiaryName", ...globalFieldOptions },
    { field: "hospitalName", ...globalFieldOptions }, 
    {
      field: "dateOfBirth",
      headerName: "Date of Birth",
      valueFormatter: params => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toLocaleDateString('en-GB');  // Format as dd/mm/yyyy
        }
        return '';
      },
      ...globalFieldOptions,
    },
    {
      field: "gender",
      headerName: "Gender",
      valueFormatter: params => {
        if (params.value) {
          const gender = params.value.toLowerCase();
          return gender === 'm' || gender === 'male' ? 'Male' : 'Female';
        }
        return '';
      },
      ...globalFieldOptions,
    },
    { field: "phoneNumber", ...globalFieldOptions },
    { field: "education", ...globalFieldOptions },
    { field: "occupation", ...globalFieldOptions },
    { field: "districts", ...globalFieldOptions },
    { field: "state", ...globalFieldOptions },
    { field: "diagnosis", ...globalFieldOptions },
    { field: "vision", ...globalFieldOptions },
    { field: "mDVI", ...globalFieldOptions },
    { field: "extraInformation", ...globalFieldOptions },
    { field: "consent", ...globalFieldOptions },
    { field: "deleted", ...globalFieldOptions }
  ];

  return (
    <div className="ag-theme-quartz" style={{ height: 'calc(50vh)' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
      />
    </div>
  );
}

// Vision Enhancement Table Component (unchanged)
function VisionEnhancementTable({ users, selectedHospitals, startDate, endDate }) {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);

  const colDefs = [
    { field: "date", headerName: "Date", filter: true, sortable: true, valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-GB') : '';  // Format as dd/mm/yyyy
    }},
    { field: "beneficiary.mrn", headerName: "MRN", filter: true, sortable: true },
    { field: "beneficiary.name", headerName: "Beneficiary Name", filter: true, sortable: true },
    { field: "beneficiary.gender", headerName: "Gender", filter: true, sortable: true },
    { field: "sessionNumber", headerName: "Session Number", filter: true, sortable: true },
    { field: "Diagnosis", headerName: "Diagnosis", filter: true, sortable: true },
    { field: "MDVI", headerName: "MDVI", filter: true, sortable: true },
    { field: "extraInformation", headerName: "Extra Information", filter: true, sortable: true },
  ];

  const filterDataByHospitalAndDate = (visionEnhancementData, users) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let filteredData = visionEnhancementData;

    if (selectedHospitals.length > 0) {
      const filteredUsers = users.filter(user => selectedHospitals.includes(user.hospitalName));
      const filteredMRNs = filteredUsers.map(user => user.mrn);
      filteredData = visionEnhancementData.filter(visionRecord => filteredMRNs.includes(visionRecord.beneficiaryId));
    }

    filteredData = filteredData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });

    return mapMRNToName(filteredData, users);
  };

  const mapMRNToName = (visionEnhancementData, users) => {
    return visionEnhancementData.map(visionRecord => {
      const matchingUser = users.find(user => user.mrn === visionRecord.beneficiaryId);
      return {
        ...visionRecord,
        beneficiary: {
          ...visionRecord.beneficiary,
          name: matchingUser ? matchingUser.beneficiaryName : "Unknown",
          gender: matchingUser ? matchingUser.gender : "Unknown",
        },
      };
    });
  };

  useEffect(() => {
    async function fetchVisionEnhancementData() {
      try {
        const response = await fetch("/api/visionEnhancement");
        const visionEnhancementData = await response.json();

        const filteredData = filterDataByHospitalAndDate(visionEnhancementData, users);
        setRowData(filteredData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vision enhancement data:", error);
        setLoading(false);
      }
    }

    fetchVisionEnhancementData();
  }, [users, selectedHospitals, startDate, endDate]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ag-theme-quartz" style={{ height: 'calc(50vh)' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        pagination
        paginationPageSize={100}
      />
    </div>
  );
}

// Training Table Component (updated)
function TrainingTable({ users, selectedHospitals, startDate, endDate }) {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);

  const colDefs = [
    { field: "date", headerName: "Date", filter: true, sortable: true, valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-GB') : '';  // Format as dd/mm/yyyy
    }},
    { field: "beneficiary.mrn", headerName: "MRN", filter: true, sortable: true },
    { field: "beneficiary.name", headerName: "Beneficiary Name", filter: true, sortable: true },
    { field: "sessionNumber", headerName: "Session Number", filter: true, sortable: true },
    { field: "type", headerName: "Type of Training", filter: true, sortable: true },
    { field: "subType", headerName: "Sub-Type", filter: true, sortable: true },
    { field: "extraInformation", headerName: "Extra Information", filter: true, sortable: true },
  ];

  const filterDataByHospitalAndDate = (trainingData, users) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let filteredData = trainingData;

    if (selectedHospitals.length > 0) {
      const filteredUsers = users.filter(user => selectedHospitals.includes(user.hospitalName));
      const filteredMRNs = filteredUsers.map(user => user.mrn);
      filteredData = trainingData.filter(trainingRecord => filteredMRNs.includes(trainingRecord.beneficiaryId));
    }

    filteredData = filteredData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });

    return mapMRNToName(filteredData, users);
  };

  const mapMRNToName = (trainingData, users) => {
    return trainingData.map(trainingRecord => {
      const matchingUser = users.find(user => user.mrn === trainingRecord.beneficiaryId);
      return {
        ...trainingRecord,
        beneficiary: {
          ...trainingRecord.beneficiary,
          name: matchingUser ? matchingUser.beneficiaryName : "Unknown",
          gender: matchingUser ? matchingUser.gender : "Unknown",
        },
      };
    });
  };

  useEffect(() => {
    async function fetchTrainingData() {
      try {
        const response = await fetch("/api/training");  // Call the API to fetch the training data
        const trainingData = await response.json();

        const filteredData = filterDataByHospitalAndDate(trainingData, users);
        setRowData(filteredData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching training data:", error);
        setLoading(false);
      }
    }

    fetchTrainingData();
  }, [users, selectedHospitals, startDate, endDate]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ag-theme-quartz" style={{ height: 'calc(50vh)' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        pagination
        paginationPageSize={100}
      />
    </div>
  );
}

// Comprehensive Low Vision Evaluation Table Component
function ComprehensiveLowVisionEvaluationTable({ users, selectedHospitals, startDate, endDate }) {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);

  const colDefs = [
    { field: "date", headerName: "Date", filter: true, sortable: true, valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-GB') : '';  // Format as dd/mm/yyyy
    }},
    { field: "beneficiary.mrn", headerName: "MRN", filter: true, sortable: true },
    { field: "beneficiary.name", headerName: "Beneficiary Name", filter: true, sortable: true },
    { field: "diagnosis", headerName: "Diagnosis", filter: true, sortable: true },
    { field: "sessionNumber", headerName: "Session Number", filter: true, sortable: true },
    { field: "distanceVisualAcuityRE", headerName: "Distance Visual Acuity RE", filter: true, sortable: true },
    { field: "distanceVisualAcuityLE", headerName: "Distance Visual Acuity LE", filter: true, sortable: true },
    { field: "nearVisualAcuityRE", headerName: "Near Visual Acuity RE", filter: true, sortable: true },
    { field: "nearVisualAcuityLE", headerName: "Near Visual Acuity LE", filter: true, sortable: true },
    { field: "recommendationSpectacle", headerName: "Recommendation (Spectacle)", filter: true, sortable: true },
    { field: "trainingGivenSpectacle", headerName: "Training Given (Spectacle)", filter: true, sortable: true },
    // Add other columns based on the schema provided.
  ];

  const filterDataByHospitalAndDate = (clveData, users) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let filteredData = clveData;

    if (selectedHospitals.length > 0) {
      const filteredUsers = users.filter(user => selectedHospitals.includes(user.hospitalName));
      const filteredMRNs = filteredUsers.map(user => user.mrn);
      filteredData = clveData.filter(clveRecord => filteredMRNs.includes(clveRecord.beneficiaryId));
    }

    filteredData = filteredData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });

    return mapMRNToName(filteredData, users);
  };

  const mapMRNToName = (clveData, users) => {
    return clveData.map(clveRecord => {
      const matchingUser = users.find(user => user.mrn === clveRecord.beneficiaryId);
      return {
        ...clveRecord,
        beneficiary: {
          ...clveRecord.beneficiary,
          name: matchingUser ? matchingUser.beneficiaryName : "Unknown",
          gender: matchingUser ? matchingUser.gender : "Unknown",
        },
      };
    });
  };

  useEffect(() => {
    async function fetchCLVEData() {
      try {
        const response = await fetch("/api/comprehensiveLowVisionEvaluation");  // Call the API to fetch the CLVE data
        const clveData = await response.json();

        const filteredData = filterDataByHospitalAndDate(clveData, users);
        setRowData(filteredData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching CLVE data:", error);
        setLoading(false);
      }
    }

    fetchCLVEData();
  }, [users, selectedHospitals, startDate, endDate]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ag-theme-quartz" style={{ height: 'calc(50vh)' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        pagination
        paginationPageSize={100}
      />
    </div>
  );
}

// Counselling Education Table Component
function CounsellingEducationTable({ selectedHospitals, startDate, endDate }) {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);

  const colDefs = [
    { field: "date", headerName: "Date", filter: true, sortable: true, valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString('en-GB') : '';  // Format as dd/mm/yyyy
    }},
    { field: "beneficiary.mrn", headerName: "MRN", filter: true, sortable: true },
    { field: "beneficiary.name", headerName: "Beneficiary Name", filter: true, sortable: true },
    { field: "sessionNumber", headerName: "Session Number", filter: true, sortable: true },
    { field: "vision", headerName: "Vision", filter: true, sortable: true },
    { field: "type", headerName: "Type", filter: true, sortable: true },
    { field: "typeCounselling", headerName: "Type of Counselling", filter: true, sortable: true },
    { field: "MDVI", headerName: "MDVI", filter: true, sortable: true },
    { field: "extraInformation", headerName: "Extra Information", filter: true, sortable: true },
  ];

  const filterDataByHospitalAndDate = (counsellingData) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let filteredData = counsellingData;

    if (selectedHospitals.length > 0) {
      // Assuming counselling data has a relation to hospital (adjust logic if necessary)
      filteredData = counsellingData.filter(record => selectedHospitals.includes(record.beneficiary.hospitalName));
    }

    filteredData = filteredData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });

    return filteredData;
  };

  useEffect(() => {
    async function fetchCounsellingData() {
      try {
        const response = await fetch("/api/counsellingEducation");  // Call the API to fetch the counselling education data
        const counsellingData = await response.json();

        const filteredData = filterDataByHospitalAndDate(counsellingData);
        setRowData(filteredData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching counselling education data:", error);
        setLoading(false);
      }
    }

    fetchCounsellingData();
  }, [selectedHospitals, startDate, endDate]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ag-theme-quartz" style={{ height: 'calc(50vh)' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        pagination
        paginationPageSize={100}
      />
    </div>
  );
}


// Server-Side Function
export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (session == null) {
    return {
      props: {
        user: null,
        users: [],
      }
    };
  }
  const user = await readUser(session.user.email);
  let users = await readBeneficiaryOtherParam();

  // Extract unique hospital names
  const hospitals = [...new Set(users.map(user => user.hospitalName))];

  return {
    props: {
      users: JSON.parse(JSON.stringify(users)),
      user: JSON.parse(JSON.stringify(user)),
      hospitals, // Pass the hospital names to the component
    },
  };
}

// React Component
export default function Dashboard(props) {
  const globalFieldOptions = { filter: true };
  const pagination = true;
  const paginationPageSize = 100;
  const paginationPageSizeSelector = [50, 100, 500];

  // State for filtering
  const [tabIndex, setTabIndex] = useState(0); // State to manage the active tab
  const [rowData, setRowData] = useState(props.users);
  const [selectedHospitals, setSelectedHospitals] = useState([]); // State for selected hospitals
  const [startDate, setStartDate] = useState(getSixMonthsAgoDate());  // Default to 6 months ago
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);  // Default to today
  const genderChartRef = useRef(null);  // Reference to keep track of the gender chart
  const ageChartRef = useRef(null);  // Reference to keep track of the age chart
  const mDVIChartRef = useRef(null);  // Reference to keep track of the mDVI chart

    const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };


  useEffect(() => {
    if (props.hospitals?.length > 0) {
      // Auto-select the first hospital from the list
      setSelectedHospitals([props.hospitals[0]]);
      // Filter data based on the first hospital
      const filteredData = props.users?.filter(user => user.hospitalName === props.hospitals[0]);
      setRowData(filteredData);
      updateGenderData(filteredData);
      updateAgeData(filteredData);
      updateMVDIData(filteredData);
    }
  }, [props.hospitals, props.users]); // Re-run if hospitals or users change

  const handleHospitalChange = (event) => {
    const value = event.target.value;
    setSelectedHospitals(value);

    // Filter the table data based on the selected hospitals
    let filteredData;
    if (value.length === 0) {
      filteredData = props.users; // If nothing is selected, show all data
    } else {
      filteredData = props.users.filter(user => value.includes(user.hospitalName));
    }
    setRowData(filteredData);
    updateGenderData(filteredData); // Update gender data for the bar chart
    updateAgeData(filteredData);    // Update age data for the bar chart
    updateMVDIData(filteredData);   // Update mDVI data for the bar chart
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    if (name === 'startDate') setStartDate(value);
    else setEndDate(value);
  };

  // Update gender data for the bar chart
  const updateGenderData = (data) => {
    const maleCount = data?.filter(user => user.gender.toLowerCase() === 'male' || user.gender.toLowerCase() === 'm').length;
    const femaleCount = data?.filter(user => user.gender.toLowerCase() === 'female' || user.gender.toLowerCase() === 'f').length;

    const chartData = [
      { category: "Male", value: maleCount },
      { category: "Female", value: femaleCount }
    ];

    renderBarChart(genderChartRef, chartData, "Gender", "genderChartContainer");
  };

  // Calculate age based on dateOfBirth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Update age data for the bar chart
  const updateAgeData = (data) => {
    const ageGroups = {
      "0-18": 0,
      "19-35": 0,
      "36-50": 0,
      "51-65": 0,
      "66+": 0
    };

    data?.forEach(user => {
      const age = calculateAge(user.dateOfBirth);
      if (age <= 18) ageGroups["0-18"]++;
      else if (age <= 35) ageGroups["19-35"]++;
      else if (age <= 50) ageGroups["36-50"]++;
      else if (age <= 65) ageGroups["51-65"]++;
      else ageGroups["66+"]++;
    });

    const chartData = Object.entries(ageGroups).map(([ageGroup, count]) => ({
      category: ageGroup,
      value: count
    }));

    renderBarChart(ageChartRef, chartData, "Age", "ageChartContainer");
  };

  // Update mDVI data for the bar chart
  const updateMVDIData = (data) => {
    const yesCount = data?.filter(user => user.mDVI && user.mDVI.toLowerCase() === 'yes').length;
    const noCount = data?.filter(user => user.mDVI && user.mDVI.toLowerCase() === 'no').length;

    const chartData = [
      { category: "Yes", value: yesCount },
      { category: "No", value: noCount }
    ];

    renderBarChart(mDVIChartRef, chartData, "mDVI", "mDVIChartContainer");
  };

 // Function to render or update the bar chart using AG Charts
const renderBarChart = (chartRef, chartData, title, containerId) => {
  if (chartRef.current) {
    chartRef.current.destroy();  // Destroy the old chart if it exists
  }

  const options = {
    container: document.getElementById(containerId), // Specifying the container
    data: chartData,
    series: [{
      type: 'bar',
      xKey: 'category', // Category on the x-axis (e.g., Male, Female, Age Groups)
      yKey: 'value',    // Value on the y-axis
      label: {
        enabled: true,
        // fontWeight: 'bold',
        fontSize: 14,
        color: '#000000', // Change the text color to black
        formatter: (params) => `${Math.round(params.value)}`,  // Format the label to remove decimals
        position: 'top',  // Move the label to the top of the bar
        placement: 'outside', 
      },
      tooltip: {
        enabled: true,  // Enable tooltips on hover
        renderer: (params) => {
          return { content: `${params.datum.category}: ${Math.round(params.datum.value)}` }; // Fixing the tooltip to correctly display category and value without decimals
        }
      }
    }],
    title: {
      text: title,   // Adding the chart title
      fontSize: 18,  // Optional: You can adjust the font size
    },
    axes: [
      {
        type: 'category',
        position: 'bottom', // Categories go on the bottom axis
      },
      {
        type: 'number',
        position: 'left',  // Values go on the left axis
        tick: {
          count: 5,  // Adjust the number of ticks on the y-axis if needed
        },
      }
    ]
  };

  const chart = agCharts.AgCharts.create(options);  // Correctly creating the chart using the correct method
  chartRef.current = chart;  // Store the chart reference for cleanup later
};

  useEffect(() => {
    // Initialize gender, age, and mDVI data when the component is first rendered
    updateGenderData(props.users);
    updateAgeData(props.users);
    updateMVDIData(props.users);
  }, []);

  const [colDefs] = useState([
    { field: "mrn", tooltipField: "mrn", ...globalFieldOptions },
    { field: "beneficiaryName", ...globalFieldOptions },
    { field: "hospitalName", ...globalFieldOptions }, 
    {
      field: "dateOfBirth",
      headerName: "Date of Birth",
      valueFormatter: params => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toLocaleDateString('en-GB');
        }
        return '';
      },
      ...globalFieldOptions,
    },
    {
      field: "gender",
      headerName: "Gender",
      valueFormatter: params => {
        if (params.value) {
          const gender = params.value.toLowerCase();
          if (gender === 'm' || gender === 'male') {
            return 'Male';
          } else if (gender === 'f' || gender === 'female') {
            return 'Female';
          }
        }
        return '';
      },
      ...globalFieldOptions,
    },
    { field: "phoneNumber", ...globalFieldOptions },
    { field: "education", ...globalFieldOptions },
    { field: "occupation", ...globalFieldOptions },
    { field: "districts", ...globalFieldOptions },
    { field: "state", ...globalFieldOptions },
    { field: "diagnosis", ...globalFieldOptions },
    { field: "vision", ...globalFieldOptions },
    { field: "mDVI", ...globalFieldOptions },
    { field: "extraInformation", ...globalFieldOptions },
    { field: "consent", ...globalFieldOptions },
    { field: "deleted", ...globalFieldOptions }
  ]);

  return (
    <div style={{ padding: '1rem' }}>
      {/* <Navigation user={props.user} /> */}
      {/* <Head>
        <title>Dashboard</title>
      </Head> */}
      {/* <div className="container-flex" style={{ padding: '1rem' }}> */}
      {/* Filter row: Hospital Filter and Date Range Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {/* Hospital Filter */}
        <FormControl style={{ minWidth: 200 }}>
          <InputLabel>Filter by Hospital</InputLabel>
          <Select
            multiple
            value={selectedHospitals}
            onChange={handleHospitalChange}
            renderValue={(selected) => selected.join(', ')}
          >
            {props.hospitals?.map((hospital) => (
              <MenuItem key={hospital} value={hospital}>
                <Checkbox checked={selectedHospitals.indexOf(hospital) > -1} />
                <ListItemText primary={hospital} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range Filter */}
        <TextField
          label="Start Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          name="startDate"
          value={startDate}
          onChange={handleDateChange}
        />
        <TextField
          label="End Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          name="endDate"
          value={endDate}
          onChange={handleDateChange}
        />
      </div>

      {/* Tabs for switching between the Beneficiary Table, Vision Enhancement Table, Training Table, and Counselling Education Table */}
      <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Beneficiary, Vision Enhancement, Training, and Counselling Education Tabs">
        <Tab label="Beneficiary" />
        <Tab label="Vision Enhancement" />
        <Tab label="Training" />
        <Tab label="Comprehensive Low Vision Enhancement" />
        <Tab label="Counselling" />
      </Tabs>

      {/* Tab Content */}
      <Box hidden={tabIndex !== 0}>
        <BeneficiaryTable users={props.users} selectedHospitals={selectedHospitals} rowData={rowData} setRowData={setRowData} />
      </Box>

      <Box hidden={tabIndex !== 1}>
        <VisionEnhancementTable users={props.users} selectedHospitals={selectedHospitals} startDate={startDate} endDate={endDate} />
      </Box>

      <Box hidden={tabIndex !== 2}>
        <TrainingTable users={props.users} selectedHospitals={selectedHospitals} startDate={startDate} endDate={endDate} />
      </Box>

      <Box hidden={tabIndex !== 3}>
        <ComprehensiveLowVisionEvaluationTable users={props.users} selectedHospitals={selectedHospitals} startDate={startDate} endDate={endDate} />
      </Box>

      <Box hidden={tabIndex !== 4}>
        <CounsellingEducationTable users={props.users} selectedHospitals={selectedHospitals} startDate={startDate} endDate={endDate} />
      </Box>
    {/* </div> */}

        {/* <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '30%' }}>
            <div id="genderChartContainer" style={{ width: "100%", height: "400px" }}></div>
          </div>
          <div style={{ width: '30%' }}>
            <div id="ageChartContainer" style={{ width: "100%", height: "400px" }}></div>
          </div>
          <div style={{ width: '30%' }}>
            <div id="mDVIChartContainer" style={{ width: "100%", height: "400px" }}></div>
          </div>
        </div> */}
      {/* </div> */}
    </div>
  );
  }
