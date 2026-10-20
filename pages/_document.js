import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
          <script
            defer
            src="https://analytics.c4g.dev/script.js"
            data-website-id="78b33cf6-bee9-4c3f-b82b-443777988bf3"
          />
        </body>
      </Html>
    );
  }
}
