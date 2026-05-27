import { useRouter } from "next/router";
import ReferencePage from "./ReferencePage";

export default function BeneficiaryServicesTable(props) {
  const router = useRouter();

  const openUserHistoricalEvaluationPage = async (mrn = null, hospitalId = null, service = null) => {
    if (mrn && hospitalId)
      router.push(`/historicalEvaluationDashboard?mrn=${mrn}&hospitalId=${hospitalId}&service=${service}`);
    else {
      router.push(`/beneficiaryinformation`, undefined, { shallow: true });
    }
  };

  const openNewEvalutaionPage = async (mrn = null, hospitalId = null, service = null) => {
    if (mrn && hospitalId) {
      router.push(`/newEvaluationDashboard?mrn=${mrn}&hospitalId=${hospitalId}&service=${service}`);
    } else {
      router.push(`/beneficiaryinformation`);
    }
  };

  return (
    <>
      <ReferencePage></ReferencePage>
      <br></br>
      <br></br>
      <table className="beneficiary-table table-bordered table">
        <thead className="thead-dark">
          <tr>
            <th scope="col">Services</th>
            <th scope="col">Evaluation Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Comprehensive Low Vision Evaluation</th>
            <td>
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() =>
                  openUserHistoricalEvaluationPage(
                    props.user.mrn,
                    props.user.hospitalId,
                    "Comprehensive_Low_Vision_Evaluation"
                  )
                }
              >
                History
              </button>
              <div className="divider" />
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() =>
                  openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Comprehensive_Low_Vision_Evaluation")
                }
              >
                New Evaluation
              </button>
            </td>
          </tr>
          <tr>
            <th scope="row">Vision Enhancement (less than 7 years old)</th>
            <td>
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() =>
                  openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Vision_Enhancement")
                }
              >
                History
              </button>
              <div className="divider" />
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Vision_Enhancement")}
              >
                New Evaluation
              </button>
            </td>
          </tr>
          <tr>
            <th scope="row">Counselling</th>
            <td>
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() =>
                  openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Counselling_Education")
                }
              >
                History
              </button>
              <div className="divider" />
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Counselling_Education")}
              >
                New Evaluation
              </button>
            </td>
          </tr>
          <tr>
            <th scope="row">Training</th>
            <td>
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() => openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Training")}
              >
                History
              </button>
              <div className="divider" />
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Training")}
              >
                New Evaluation
              </button>
            </td>
          </tr>
          <tr>
            <th scope="row">Camp_Low Vision Screening</th>
            <td>
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() =>
                  openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Low_Vision_Screening")
                }
              >
                History
              </button>
              <div className="divider" />
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Low_Vision_Screening")}
              >
                New Evaluation
              </button>
            </td>
          </tr>
          <tr>
            <th scope="row">Community Screening</th>
            <td>
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() =>
                  openUserHistoricalEvaluationPage(props.user.mrn, props.user.hospitalId, "Community_Screening")
                }
              >
                History
              </button>
              <div className="divider" />
              <button
                type="button"
                className="btn btn-success btn-block border-0"
                onClick={() => openNewEvalutaionPage(props.user.mrn, props.user.hospitalId, "Community_Screening")}
              >
                New Evaluation
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
