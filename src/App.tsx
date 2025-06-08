import diversImage from "./assets/divers.webp";
import "./App.css";

function App() {
  return (
    <>
      <div>
        <img
          src={diversImage}
          alt="Divers"
          width={485}
          height={485}
          style={{
            objectFit: "cover",
          }}
        />
      </div>
      <h1>Shader Test</h1>
    </>
  );
}

export default App;
