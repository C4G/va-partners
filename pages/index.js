import { useSession, getSession } from "next-auth/react";
import Link from "next/link";
import moment from "moment";
import { Container, Grid, Card, CardContent, CardActionArea, Typography } from "@mui/material";
import Navigation from "./navigation/Navigation";
import Layout from "./components/layout";
import { useState } from "react";
import { findAllHospital } from "@/pages/api/hospital";
import { readUser } from "./api/user";
import { buildDashboardQueryParams } from "@/utils/ui/build-dashboard-query-params";

export default function Home(props) {
  const { data: session } = useSession();
  const [totalBenificiaries, setTotalBenificiaries] = useState("0");
  const [uniqueBenificiaries, setUniqueBenificiaries] = useState("0");
  const [totalVisionEnhancements, setTotalVisionEnhancements] = useState("0");
  const [totalTrainings, setTotalTrainings] = useState("0");
  const [totalEvaluations, setTotalEvaluations] = useState("0");
  const [totalCounseling, setTotalCounseling] = useState("0");

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
      console.log("Counts data:", data);

      if (response.ok) {
        setTotalBenificiaries(data.Total_Benificiaries || "0");
        setUniqueBenificiaries(data.Unique_Benificiaries || "0");
        setTotalVisionEnhancements(data.Vision_Enhancements || "0");
        setTotalTrainings(data.Training || "0");
        setTotalEvaluations(data.Low_Vision_Evaluation || "0");
        setTotalCounseling(data.Counselling_Education || "0");
      } else {
        console.error("Error fetching counts data:", data.error);
        //setCountsData(null);
      }
    } catch (error) {
      console.error("Error fetching counts data:", error);
      //setCountsData(null);
    }
  };
  const isAdmin = props.user?.admin ?? false;

  if (isAdmin) {
  fetchCountsData(props.hospitals.map((item) => item.id));
}
  console.log(props.user);

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
  return (
    <Layout>
      <Navigation user={props.user} />
      <div>
        <div className="wrapper" style={{ height: "70vh" }}>
          {session && !props.user && <strong>Please ask an admin to add you as user!</strong>}
          {session && props.user.admin && (
            <Container sx={{ py: 4 }}>
              <br />
              <Grid container spacing={3}>
                {/* Total Benificiaries*/}
                <KpiCard
                  kpi={totalBenificiaries}
                  descriptor={`Benificiaries`}
                  href={`/reports?selectedHospitals=[${props.hospitals.map((item) => item.id).join(",")}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&subTabIndex=0&masterTabIndex=0&quarter=Q${moment().quarter()}`}
                />
                {/* Unique Benificiaries*/}
                <KpiCard
                  kpi={uniqueBenificiaries}
                  descriptor={`Unique Benificiaries`}
                  href={`/reports?selectedHospitals=[${props.hospitals.map((item) => item.id).join(",")}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&subTabIndex=0&masterTabIndex=0&quarter=Q${moment().quarter()}`}
                />
                {/* Total Vision Enhancements*/}
                <KpiCard
                  kpi={totalVisionEnhancements}
                  descriptor={`Vision Enhancements`}
                  href={`/reports?selectedHospitals=[${props.hospitals.map((item) => item.id).join(",")}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&subTabIndex=1&masterTabIndex=0&quarter=Q${moment().quarter()}`}
                />
              </Grid>
              <br />
              <Grid container spacing={3} justifyContent="center">
                {/* Total Trainings*/}
                <KpiCard
                  kpi={totalTrainings}
                  descriptor={`Trainings`}
                  href={`/reports?selectedHospitals=[${props.hospitals.map((item) => item.id).join(",")}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&subTabIndex=2&masterTabIndex=0&quarter=Q${moment().quarter()}`}
                />
                {/* Evaluation Total*/}
                <KpiCard
                  kpi={totalEvaluations}
                  descriptor={`Evaluations`}
                  href={`/reports?selectedHospitals=[${props.hospitals.map((item) => item.id).join(",")}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&subTabIndex=3&masterTabIndex=0&quarter=Q${moment().quarter()}`}
                />
                {/* Counseling Total*/}
                <KpiCard
                  kpi={totalCounseling}
                  descriptor={`Counseling`}
                  href={`/reports?selectedHospitals=[${props.hospitals.map((item) => item.id).join(",")}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&subTabIndex=4&masterTabIndex=0&quarter=Q${moment().quarter()}`}
                />
              </Grid>
              <br />
              <Grid container spacing={3} justifyContent="center">
                  <KpiCard
                    kpi={props.hospitals.length}
                    descriptor="Hospitals Served"
                    href={`/reports?selectedHospitals=[${props.hospitals.map((item) => item.id).join(",")}]&startDate=&endDate=&selectedGenders=["Male"%2C"Female"%2C"Other"]&selectedMdvi=["Yes"%2C"No"]&minAge=&maxAge=&masterTabIndex=0&quarter=Q${moment().quarter()}`}
                  />
              </Grid>
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
    console.log("session is null");
    return {
      props: {
        user: null,
      },
    };
  }
  const user = await readUser(session.user.email);
  const hospitals = await findAllHospital();
  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      hospitals: JSON.parse(JSON.stringify(hospitals)),
    },
  };
}
