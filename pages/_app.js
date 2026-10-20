import "../styles/globals.css";
import "../styles/vaPartner.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/600.css";
import "@fontsource/roboto/700.css";
import "bootstrap/dist/css/bootstrap.css";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");

    if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((error) => console.warn("Could not clear stale service workers:", error));
    }
  }, []);

  return (
    <>
      <Head>
        <title>Vision Aid Partners</title>
        <meta name="description" content="vision-aid partners" />
      </Head>
      <SessionProvider session={pageProps.session}>
        <main className="font-sans">
          <Component {...pageProps} />
        </main>
      </SessionProvider>
    </>
  );
}
