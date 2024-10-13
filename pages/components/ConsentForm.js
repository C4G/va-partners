export default function ConsentForm({ consent }) {
  return (
    <div className="user-profile-card">
      <div>
        <h2 className="user-name">Consent Form</h2>
      </div>
      <div className="profile-info">
        <hr />
        <table>
          <tbody>
            <tr>
              <td>Consent:</td>
              <td>{consent}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
