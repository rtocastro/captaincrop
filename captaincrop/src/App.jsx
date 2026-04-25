import { useEffect, useState } from "react";
import "./App.css";

const starterPledges = [
  {
    id: crypto.randomUUID(),
    name: "Rick",
    neighborhood: "Van Nuys",
    crop: "Dragon fruit",
    space: "Balcony / patio",
    harvest: "Late summer",
    shareType: "Can share extras",
    notes: "Looking for pollination buddies and fruit swaps.",
  },
];

function App() {
  const [pledges, setPledges] = useState(() => {
    const saved = localStorage.getItem("powerplant-pledges");
    return saved ? JSON.parse(saved) : starterPledges;
  });

  const [form, setForm] = useState({
    name: "",
    neighborhood: "",
    crop: "",
    space: "",
    harvest: "",
    shareType: "Can share extras",
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem("powerplant-pledges", JSON.stringify(pledges));
  }, [pledges]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addPledge = (event) => {
    event.preventDefault();

    if (!form.name || !form.crop || !form.neighborhood) return;

    const newPledge = {
      id: crypto.randomUUID(),
      ...form,
    };

    setPledges((prev) => [newPledge, ...prev]);

    setForm({
      name: "",
      neighborhood: "",
      crop: "",
      space: "",
      harvest: "",
      shareType: "Can share extras",
      notes: "",
    });
  };

  const deletePledge = (id) => {
    setPledges((prev) => prev.filter((pledge) => pledge.id !== id));
  };

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">The Fruitbat Org presents</p>
        <h1>PowerPlant</h1>
        <h2>Lettuce Share 🍉</h2>
        <p className="hero-copy">
          A neighborhood crop board for people growing food, sharing harvests,
          trading extras, and building community one tiny green thing at a time.
        </p>
      </section>

      <section className="dashboard">
        <form className="pledge-form" onSubmit={addPledge}>
          <h3>Add a Grow Pledge 🌱</h3>

          <input
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
          />

          <input
            name="neighborhood"
            placeholder="Neighborhood / block"
            value={form.neighborhood}
            onChange={handleChange}
          />

          <input
            name="crop"
            placeholder="What are you growing?"
            value={form.crop}
            onChange={handleChange}
          />

          <select name="space" value={form.space} onChange={handleChange}>
            <option value="">Growing space type</option>
            <option>Balcony / patio</option>
            <option>Front yard</option>
            <option>Backyard</option>
            <option>Window / indoor</option>
            <option>Community garden</option>
          </select>

          <input
            name="harvest"
            placeholder="Estimated harvest time"
            value={form.harvest}
            onChange={handleChange}
          />

          <select
            name="shareType"
            value={form.shareType}
            onChange={handleChange}
          >
            <option>Can share extras</option>
            <option>Wants to trade</option>
            <option>Needs help growing</option>
            <option>Just learning</option>
          </select>

          <textarea
            name="notes"
            placeholder="Notes, swaps, needs, or fruitbat facts..."
            value={form.notes}
            onChange={handleChange}
          />

          <button type="submit">Plant the Pledge</button>
        </form>

        <section className="board">
          <div className="board-header">
            <div>
              <p className="eyebrow">Community Crop Board</p>
              <h3>Harvest Shares</h3>
            </div>
            <span>{pledges.length} pledge(s)</span>
          </div>

          <div className="pledge-grid">
            {pledges.map((pledge) => (
              <article className="pledge-card" key={pledge.id}>
                <div className="card-top">
                  <span className="crop-icon">🌿</span>
                  <button onClick={() => deletePledge(pledge.id)}>×</button>
                </div>

                <h4>{pledge.crop}</h4>
                <p className="location">
                  {pledge.name} · {pledge.neighborhood}
                </p>

                <div className="tags">
                  {pledge.space && <span>{pledge.space}</span>}
                  {pledge.harvest && <span>{pledge.harvest}</span>}
                  <span>{pledge.shareType}</span>
                </div>

                {pledge.notes && <p className="notes">{pledge.notes}</p>}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;