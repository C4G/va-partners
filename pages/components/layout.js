import Footer from "../footer";

const Layout = ({ children }) => {
  return (
    <div>
      {children}
      <br />
      <Footer />
    </div>
  );
};

export default Layout;
