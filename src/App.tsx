import diversImage from "./assets/divers.webp";
import { Scene } from "./components/Scene";
import "./App.css";

function App() {
  return (
    <>
      <div>
        <Scene 
          imageSrc={diversImage}
          width={4.85}
          height={4.85}
          colorQuantization={4}
        />
      </div>
      <h1>Shader Test</h1>
    </>
  );
}

export default App;
