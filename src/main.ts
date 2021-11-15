import "./style.css";
import Adapter from "./index";

const adapter = new Adapter({
  container: document.getElementById("adapter_input") as HTMLInputElement,
});

adapter.watchKey();
