import { getSession } from "next-auth/react";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Navigation from "./navigation/Navigation";
import Layout from "./components/layout";
import { readUser } from "./api/user";
import { findAllHospital } from "@/pages/api/hospital";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { findAllGrants } from "./api/cashGrant";

const AgGridReact = dynamic(() => import("ag-grid-react").then((m) => m.AgGridReact), { ssr: false });

export default function Grant(props) {
  const [choice, setChoice] = useState("");
  const [quarter, setQuarter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  const [formQuarter, setFormQuarter] = useState("Q1");
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formHospital, setFormHospital] = useState({});

  const [formFields, setFormFields] = useState([
    { name: "budgetHead", label: "Budget Head", value: "", type: "text" },
    { name: "openingBalance", label: "Opening Balance", value: "", type: "number" },
    { name: "amountReceived", label: "Amount Received in Quarter", value: "", type: "number" },
    { name: "dateOfReceipt", label: "Date of Receipt", value: "", type: "date" },
    { name: "remarks", label: "Remarks", value: "", type: "text" },
    { name: "closingBalance", label: "Closing Balance", value: "", type: "number" },
    { name: "manpowerCost", label: "Manpower Cost", value: "", type: "number" },
    { name: "equipmentCost", label: "Equipment Cost", value: "", type: "number" },
    { name: "operationalExpenses", label: "Operational Expenses", value: "", type: "number" },
    { name: "freeLVDs", label: "Free LVDs", value: "", type: "number" },
    { name: "trainingCosts", label: "Training Costs", value: "", type: "number" },
    { name: "additionalCosts", label: "Additional Costs", value: "", type: "number" },
    { name: "details", label: "Details", value: "", type: "text" },
  ]);

  const [gridApi, setGridApi] = useState(null);

  const formatKey = (key) => {
    return (
      key
        // split before capital letters
        .replace(/([A-Z])/g, " $1")
        // trim extra space
        .trim()
        // capitalize first letter
        .replace(/^./, (str) => str.toUpperCase())
    );
  };

  const isExternalFilterPresent = () => {
    return quarter || fromDate || toDate || choice;
  };

  const doesExternalFilterPass = (node) => {
    const data = node.data;

    if (choice) {
      const hospitalName = props.hospitals.find((h) => h.id === Number(choice))?.name;
      if (data.hospital !== hospitalName) return false;
    }

    if (quarter && data.quarter !== quarter) return false;

    if (fromDate && new Date(data.date) < new Date(fromDate)) return false;
    if (toDate && new Date(data.date) > new Date(toDate)) return false;

    return true;
  };

  useEffect(() => {
    if (!gridApi) return;
    gridApi.onFilterChanged();
  }, [gridApi, quarter, fromDate, toDate, choice]);

  const onGridReady = (params) => setGridApi(params.api);

  const columnDefs = useMemo(
    () => [
      { field: "hospital", headerName: "Hospital", flex: 1 },
      { field: "budgetHead", headerName: "Budget Head", flex: 1 },
      { field: "amount", headerName: "Amount Received", flex: 1 },
      { field: "period", headerName: "Period", flex: 1 },
    ],
    []
  );

  const rowData = useMemo(() => {
    if (!props.grants) return [];

    return props.grants.map((g) => ({
      id: g.id,
      budgetHead: g.budgetHead,
      hospital: props.hospitals.find((h) => h.id === Number(g.hospital))?.name || "Unknown",
      amount: g.amountReceived ?? 0,
      period: `${g.quarter} ${g.year}`,
      quarter: g.quarter,
      date: g.dateOfReceipt,
    }));
  }, [props.grants]);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setFormFields((prev) =>
      prev.map((field) => ({
        ...field,
        value: "",
      }))
    );
  };

  const onRowClicked = (event) => {
    const fullGrant = props.grants.find((g) => g.id === event.data.id);
    setSelectedGrant(fullGrant);
    setViewOpen(true);
  };

  const handleFieldChange = (index) => (e) => {
    const newFields = [...formFields];
    newFields[index].value = e.target.value;
    setFormFields(newFields);
  };

  const handleSubmit = async () => {
    const payload = formFields.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {});

    const fullPayload = {
      hospitalId: formHospital,
      quarter: formQuarter,
      year: formYear,
      ...payload,
    };

    try {
      const res = await fetch("/api/cashGrant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fullPayload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to submit form");
      }

      await res.json();
      handleClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const expenses = useMemo(() => {
    const keys = ["manpowerCost", "equipmentCost", "operationalExpenses", "freeLVDs", "trainingCosts", "additionalCosts"];
    return formFields.filter((f) => keys.includes(f.name)).reduce((sum, f) => sum + (parseFloat(f.value) || 0), 0);
  }, [formFields]);

  const selectedExpenses = useMemo(() => {
    if (!selectedGrant) return 0;

    const keys = ["manpowerCost", "equipmentCost", "operationalExpenses", "freeLVDs", "trainingCosts", "additionalCosts"];
    return keys.reduce((sum, key) => {
      return sum + (parseFloat(selectedGrant[key]) || 0);
    }, 0);
  }, [selectedGrant]);

  return (
    <Layout>
      <Navigation user={props.user} />

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", p: 2, justifyContent: "center" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Hospital</InputLabel>
          <Select value={choice} label="Hospital" onChange={(e) => setChoice(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {props.hospitals.map((h) => (
              <MenuItem key={h.id} value={h.id}>
                {h.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="From Date"
          type="date"
          size="small"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="To Date"
          type="date"
          size="small"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Quarter</InputLabel>
          <Select value={quarter} label="Quarter" onChange={(e) => setQuarter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Q1">Q1</MenuItem>
            <MenuItem value="Q2">Q2</MenuItem>
            <MenuItem value="Q3">Q3</MenuItem>
            <MenuItem value="Q4">Q4</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleOpen}>
          New Cash Grant
        </Button>
      </Box>

      <div className="ag-theme-alpine" style={{ height: 500, width: "100%", maxWidth: 900, margin: "0 auto" }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          isExternalFilterPresent={isExternalFilterPresent}
          doesExternalFilterPass={doesExternalFilterPass}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
        />
      </div>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>New Cash Grant Form</DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              mb: 3,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Hospital</InputLabel>
              <Select value={formHospital} label="Hospital" onChange={(e) => setFormHospital(e.target.value)}>
                {props.hospitals.map((h) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Quarter</InputLabel>
              <Select value={formQuarter} label="Quarter" onChange={(e) => setFormQuarter(e.target.value)}>
                <MenuItem value="Q1">Q1</MenuItem>
                <MenuItem value="Q2">Q2</MenuItem>
                <MenuItem value="Q3">Q3</MenuItem>
                <MenuItem value="Q4">Q4</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Year"
              type="number"
              value={formYear}
              onChange={(e) => setFormYear(Number(e.target.value))}
              fullWidth
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
            }}
          >
            {formFields.map((field, idx) => (
              <TextField
                key={field.name}
                label={field.label}
                type={field.type}
                value={field.value}
                onChange={handleFieldChange(idx)}
                fullWidth
                size="small"
              />
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Typography>Total Expenses: {expenses}</Typography>
          <Box>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Submit
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)}>
        <DialogTitle>Grant Details</DialogTitle>
        <DialogContent>
          {selectedGrant &&
            Object.entries(selectedGrant)
              .filter(([k]) => !k.toLowerCase().includes("id"))
              .map(([k, v]) => (
                <Typography key={k}>
                  <b>{formatKey(k)}:</b> {String(v)}
                </Typography>
              ))}
          <Divider sx={{ my: 2 }} />

          <Typography variant="h6">Total Expenses: {selectedExpenses}</Typography>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);

  if (!session) {
    return { props: { user: null, hospitals: [], grants: [] } };
  }

  const user = await readUser(session.user.email);

  const hospitals = (await findAllHospital()).filter((h) => !h.name?.toLowerCase().startsWith("test"));

  const grants = (await findAllGrants());

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      hospitals: JSON.parse(JSON.stringify(hospitals)),
      grants: JSON.parse(JSON.stringify(grants)),
    },
  };
}
