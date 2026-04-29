import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import logo from "public/images/vision-aid-logo.webp";

function Navigation(props) {
  const { user } = props;
  const router = useRouter();
  let role = "";
  if (user) {
    role = user.admin
      ? "admin"
      : user.hospitalRole[0].admin
        ? "manager"
        : user.hospitalRole
          ? "professional"
          : "invalid";
  }

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark container-fluid flex"
      style={{ backgroundColor: "#1B5E20", padding: "0.4rem" }}
    >
      <div className="d-flex justify-content-between align-items-center w-100">
        <div className="d-flex align-items-center">
          <Link href="/" legacyBehavior>
            <a className="navbar-brand p-1">
              <Image
                src={logo}
                alt="Logo"
                height="40" // Reduced height
                width="40" // Reduced width
              />
            </a>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>

        <div className="navbar-collapse collapse" id="navbarNav">
          <ul className="navbar-nav">
            {user && role != "invalid" && (
              <li className="nav-item p-2">
                <Link href="/" legacyBehavior>
                  <a className={`nav-link custom-link ${router.pathname === "/" ? "active" : ""}`}>
                    Home
                  </a>
                </Link>
              </li>
            )}
            {user && role != "invalid" && (
              <li className="nav-item p-2">
                <Link href="/beneficiary" legacyBehavior>
                  <a className={`nav-link custom-link ${router.pathname === "/beneficiary" ? "active" : ""}`}>
                    Beneficiaries
                  </a>
                </Link>
              </li>
            )}
            {user && role != "invalid" && (
              <li className="nav-item p-2">
                <Link href="/reports" legacyBehavior>
                  <a className={`nav-link custom-link ${router.pathname === "/reports" ? "active" : ""}`}>Reports</a>
                </Link>
              </li>
            )}
            {user && role != "invalid" && (role === "admin" || role === "manager") && (
              <li className="nav-item p-2">
                <Link href="/users" legacyBehavior>
                  <a className={`nav-link custom-link ${router.pathname === "/users" ? "active" : ""}`}>Users</a>
                </Link>
              </li>
            )}
            {user && role != "invalid" && (role === "admin") && (
              <li className="nav-item p-2">
                <Link href="/grants" legacyBehavior>
                  <a className={`nav-link custom-link ${router.pathname === "/grants" ? "active" : ""}`}>Grants</a>
                </Link>
              </li>
            )}
            {user && role != "invalid" && role === "admin" && (
              <li className="nav-item p-2">
                <Link href="/requiredfields" legacyBehavior>
                  <a className={`nav-link custom-link ${router.pathname === "/requiredfields" ? "active" : ""}`}>
                    Configuration
                  </a>
                </Link>
              </li>
            )}
          </ul>
        </div>

        {user && (
          <div className="d-flex align-items-center">
            <small className="text-light me-3">
              Signed in as: {user.email} ({role.toUpperCase()})
            </small>
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => {
                signOut();
              }}
            >
              Sign out
            </button>
          </div>
        )}

        {!user && (
          <div className="left-auto-margin column-center">
            <button type="button" className="btn btn-sm btn-light" onClick={() => signIn()}>
              Sign in
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-link {
          font-size: 1.25rem; // Reduced font size
        }
        nav a {
          margin: 0 0px;
        }
      `}</style>
    </nav>
  );
}

export default Navigation;
