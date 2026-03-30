import { useSession, getSession } from "next-auth/react";
import Link from "next/link";
import moment from "moment";
import { Container, Grid, Card, CardContent, CardActionArea, Typography } from "@mui/material";
import Navigation from "./navigation/Navigation";
import Layout from "./components/layout";
import { useState, useEffect } from "react";
import { findAllHospital } from "@/pages/api/hospital";
import { readUser } from "./api/user";
import { buildDashboardQueryParams } from "@/utils/ui/build-dashboard-query-params";
import { KPI_KEYS } from "@/utils/global/kpi-config";

export default function Home(props) {
  const { data: session } = useSession();

  const [uniqueBeneficiaries, setUniqueBeneficiaries] = useState("0");
  const [totalVisionEnhancements, setTotalVisionEnhancements] = useState("0");
  const [totalTrainings, setTotalTrainings] = useState("0");
  const [totalEvaluations, setTotalEvaluations] = useState("0");
  const [totalCounseling, setTotalCounseling] = useState("0");
  const [totalDevicesDispensed, setTotalDevicesDispensed] = useState("0");
  const [hospitals, setHospitals] = useState("0");

  const [visibleKpis, setVisibleKpis] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem("visibleKpis");

    if (saved) {
      setVisibleKpis(JSON.parse(saved));
    } else {
      setVisibleKpis(kpiData.map((k) => k.key));
    }
  }, []);


  const fetchCountsData = async (hospital) => {
    try {
      const startDateUTC = moment().quarter(moment().quarter()).startOf("quarter").toISOString();
      const endDateUTC = moment().quarter(moment().quarter()).endOf("quarter").toISOString();

      const params = {
        startDate: startDateUTC,
        endDate: endDateUTC,
        hospitalIds: hospital,
      };

      const response = await fetch(`/api/v2/dashboard/count?${buildDashboardQueryParams(params)}`);

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setUniqueBeneficiaries(data.Unique_Beneficiaries || "0");
        setTotalVisionEnhancements(data.Vision_Enhancement || "0");
        setTotalTrainings(data.Training || "0");
        setTotalEvaluations(data.Low_Vision_Evaluation || "0");
        setTotalCounseling(data.Counselling_Education || "0");
        const devices = data.Devices_Dispensed || {};
        setTotalDevicesDispensed(
          (devices.Spectacle || 0) + (devices.Electronic || 0) + (devices.Optical || 0) + (devices.NonOptical || 0)
        );
        if (isAdmin) {
          setHospitals(props.hospitals?.length || 0);
        } else {
          setHospitals(props.user?.hospitalRole?.length || 0);
        }
      } else {
        console.error("Error fetching counts data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching counts data:", error);
    }
  };

  const isAdmin = props.user?.admin ?? false;

  console.log(props.hospitals?.map((item) => item.id));
  console.log(props?.user?.hospitalRole);

  useEffect(() => {
    if (isAdmin) {
      fetchCountsData(props.hospitals?.map((item) => item.id));
    } else if (props.user && props.user.hospitalRole?.length > 0) {
      fetchCountsData(props?.user.hospitalRole?.map((item) => item.hospitalId));
    }
  }, [isAdmin, props.hospitals]);

  function KpiCard({ kpi, descriptor, href }) {
    return (
      <Grid item xs={12} md={4}>
        <Card sx={{ height: "100%" }}>
          <CardActionArea
            component={Link}
            href={href}
            sx={{
              height: "100%",
              textAlign: "center",
              py: 4,
              transition: "0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
              },
            }}
          >
            <CardContent>
              <Typography
                textAlign={"left"}
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 12,
                  color: "text.secondary",
                  fontSize: 14,
                }}
              >
                {`Q${moment().quarter()} ${moment().year()}`}
              </Typography>

              <Typography variant="h3" fontWeight="bold">
                {kpi}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {descriptor}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    );
  }

  const selectedHospitalIds = isAdmin
    ? props.hospitals?.map((item) => item.id) || []
    : props.user?.hospitalRole?.map((item) => item.hospitalId) || [];
  const hospitalIds = selectedHospitalIds.join(",");

  const baseHref = (subTabIndex = "", extra = "") =>
    `/reports?selectedHospitals=[${hospitalIds}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&masterTabIndex=0&quarter=Q${moment().quarter()}${extra}${
      subTabIndex !== "" ? `&subTabIndex=${subTabIndex}` : ""
    }`;

  const kpiData = [
    {
      key: KPI_KEYS.UNIQUE_BENEFICIARIES,
      kpi: uniqueBeneficiaries,
      descriptor: "Unique Beneficiaries",
      href: baseHref(0),
    },
    {
      key: KPI_KEYS.VISION,
      kpi: totalVisionEnhancements,
      descriptor: "Vision Enhancements",
      href: baseHref(1),
    },
    {
      key: KPI_KEYS.TRAININGS,
      kpi: totalTrainings,
      descriptor: "Trainings",
      href: baseHref(2),
    },
    {
      key: KPI_KEYS.EVALUATIONS,
      kpi: totalEvaluations,
      descriptor: "Evaluations",
      href: baseHref(3),
    },
    {
      key: KPI_KEYS.DEVICES,
      kpi: totalDevicesDispensed,
      descriptor: "Devices Given",
      href: baseHref(),
    },
    {
      key: KPI_KEYS.COUNSELING,
      kpi: totalCounseling,
      descriptor: "Counseling",
      href: baseHref(4),
    },
    {
      key: KPI_KEYS.HOSPITALS,
      kpi: hospitals || 0,
      descriptor: "Hospitals Served",
      href: baseHref(),
    },
  ];

  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const filteredKpis = kpiData.filter((kpi) => visibleKpis.includes(kpi.key));

  const kpiRows = chunkArray(filteredKpis, 3);
  return (
    <Layout>
      <Navigation user={props.user} />
      <div>
        <div className="wrapper">
          {session && !props.user && <strong>Please ask an admin to add you as user!</strong>}

          {session && props.user && (
            <Container sx={{ py: 4 }}>
              <br />

              {kpiRows.map((row, rowIndex) => (
                <Grid
                  container
                  spacing={3}
                  key={rowIndex}
                  justifyContent={row.length < 3 ? "center" : "flex-start"}
                  sx={{ mb: 2 }}
                >
                  {row.map((item, index) => (
                    <KpiCard key={index} kpi={item.kpi} descriptor={item.descriptor} href={item.href} />
                  ))}
                </Grid>
              ))}
            </Container>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);

  if (session == null) {
    return {
      props: {
        user: null,
      },
    };
  }

  const user = await readUser(session.user.email);
  const hospitals = (await findAllHospital()).filter(
    (hospital) => !hospital.name?.toLowerCase().startsWith("test")
  );

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      hospitals: JSON.parse(JSON.stringify(hospitals)),
    },
  };
}
