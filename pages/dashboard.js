// pages/dashboard.js
import Navigation from "./navigation/Navigation";
import Layout from './components/layout';
import Head from "next/head";
import { getSession } from "next-auth/react";
import { readUser } from "./api/user";
import { AgGridReact } from 'ag-grid-react'; 
import "ag-grid-community/styles/ag-grid.css"; 
import "ag-grid-community/styles/ag-theme-quartz.css"; 
import { useState, useEffect, useRef } from "react";
import { readBeneficiaryOtherParam } from "./api/beneficiary";
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from "@mui/material";
import * as agCharts from 'ag-charts-community'; 

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
export default function FeedbackPage(props) {
  const globalFieldOptions = { filter: true };
  const pagination = true;
  const paginationPageSize = 100;
  const paginationPageSizeSelector = [50, 100, 500];

  // State for filtering
  const [rowData, setRowData] = useState(props.users);
  const [selectedHospitals, setSelectedHospitals] = useState([]); // State for selected hospitals
  const genderChartRef = useRef(null);  // Reference to keep track of the gender chart
  const ageChartRef = useRef(null);  // Reference to keep track of the age chart
  const mDVIChartRef = useRef(null);  // Reference to keep track of the mDVI chart

  useEffect(() => {
    if (props.hospitals.length > 0) {
      // Auto-select the first hospital from the list
      setSelectedHospitals([props.hospitals[0]]);
      // Filter data based on the first hospital
      const filteredData = props.users.filter(user => user.hospitalName === props.hospitals[0]);
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

  // Update gender data for the bar chart
  const updateGenderData = (data) => {
    const maleCount = data.filter(user => user.gender.toLowerCase() === 'male' || user.gender.toLowerCase() === 'm').length;
    const femaleCount = data.filter(user => user.gender.toLowerCase() === 'female' || user.gender.toLowerCase() === 'f').length;

    const chartData = [
      { category: "Male", value: maleCount },
      { category: "Female", value: femaleCount }
    ];

    renderBarChart(genderChartRef, chartData, "Gender Breakdown", "genderChartContainer");
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

    data.forEach(user => {
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

    renderBarChart(ageChartRef, chartData, "Age Breakdown", "ageChartContainer");
  };

  // Update mDVI data for the bar chart
  const updateMVDIData = (data) => {
    const yesCount = data.filter(user => user.mDVI && user.mDVI.toLowerCase() === 'yes').length;
    const noCount = data.filter(user => user.mDVI && user.mDVI.toLowerCase() === 'no').length;

    const chartData = [
      { category: "Yes", value: yesCount },
      { category: "No", value: noCount }
    ];

    renderBarChart(mDVIChartRef, chartData, "mDVI Breakdown", "mDVIChartContainer");
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
          fontWeight: 'bold',
          fontSize: 14,
          color: '#ffffff', // White text for better contrast
        },
        tooltip: {
          enabled: true,  // Enable tooltips on hover
          renderer: (params) => {
            return { content: `${params.xKey}: ${params.yValue}` };
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
        }
      ],
      legend: {
        enabled: false,  // Bar charts typically don't use legends
      },
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
          return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
    <Layout>
      <Navigation user={props.user} />
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="container-flex" style={{ padding: '1rem' }}>
        <FormControl style={{ minWidth: 200, marginBottom: '1rem' }}>
          <InputLabel>Filter by Hospital</InputLabel>
          <Select
            multiple
            value={selectedHospitals}
            onChange={handleHospitalChange}
            renderValue={(selected) => selected.join(', ')}
          >
            {props.hospitals.map((hospital) => (
              <MenuItem key={hospital} value={hospital}>
                <Checkbox checked={selectedHospitals.indexOf(hospital) > -1} />
                <ListItemText primary={hospital} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div
          className="ag-theme-quartz" // applying the Data Grid theme
          style={{ height: 'calc(50vh)' }} // the Data Grid will fill the size of the parent container
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            pagination={pagination}
            paginationPageSize={paginationPageSize}
            paginationPageSizeSelector={paginationPageSizeSelector}
          />
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '30%' }}>
            <div id="genderChartContainer" style={{ width: "100%", height: "400px" }}></div>
          </div>
          <div style={{ width: '30%' }}>
            <div id="ageChartContainer" style={{ width: "100%", height: "400px" }}></div>
          </div>
          <div style={{ width: '30%' }}>
            <div id="mDVIChartContainer" style={{ width: "100%", height: "400px" }}></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}




