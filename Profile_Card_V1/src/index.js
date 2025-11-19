import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <div className="card">
      <Avatar />
      <div className="data">
        <Intro />
        {/* Should contain one Skill component
        for each web dev skill that you have,
        customized with props */}
        <SkillList />
      </div>
    </div>
  );
}
function Avatar() {
  return <img className="avatar" src="photo.jpg" alt="Christian Condron" />;
}

function Intro() {
  return (
    <div>
      <h1>Christian Condron</h1>
      <p>
        I`m a quick learner with strong attention to detail and the ability to
        connect both big-picture goals and fine details to build complete
        processes. A creative thinker with a passion for innovation—and a bass
        player in a metal band outside of work.
      </p>
    </div>
  );
}

function SkillList() {
  return (
    <div className="skill-list">
      <Skill skill="React" emoji="🧬" color="purple" />
      <Skill skill="HTML+CSS" emoji="🔮" color="orangered" />
      <Skill skill="Javascript" emoji="☕️" color="green" />
      <Skill skill="Bass Guitar" emoji="🎸" color="magenta" />
    </div>
  );
}

function Skill(props) {
  return (
    <div className="skill" style={{ backgroundColor: props.color }}>
      <span>{props.skill}</span>
      <span>{props.emoji}</span>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
