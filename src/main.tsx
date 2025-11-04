import ReactDOM from "react-dom/client";
import App from "./App";

// import Bootstrap CSS và icons
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// render app vào DOM
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
