import { useEffect, useState } from "react";
import "./App.css";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

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
    createdAt: new Date().toISOString(),
  },
];

const formatDate = (ts) => {
  if (!ts) return "Posting…";
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function App() {
  const [pledges, setPledges] = useState([]);

  const [user, setUser] = useState(null);

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
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      console.log("Auth state user:", currentUser.uid);
    } else {
      try {
        const result = await signInAnonymously(auth);
        setUser(result.user);
        console.log("Signed in anonymously:", result.user.uid);
      } catch (error) {
        console.error("Auth error:", error);
      }
    }
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      console.log("Auth state user:", currentUser.uid);
    } else {
      try {
        const result = await signInAnonymously(auth);
        setUser(result.user);
        console.log("Signed in anonymously:", result.user.uid);
      } catch (error) {
        console.error("Auth error:", error);
      }
    }
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const q = query(collection(db, "pledges"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("Firestore snapshot size:", snapshot.size);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPledges(data);
    },
    (error) => {
      console.error("Firestore read error:", error);
    }
  );

  return () => unsubscribe();
}, []);


  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

const addPledge = async (event) => {
  event.preventDefault();

  if (!form.name || !form.crop || !form.neighborhood) {
    console.log("Missing required fields");
    return;
  }

  if (!user) {
    console.log("No user yet");
    return;
  }

  try {
    const newPledge = {
      ...form,
      createdAt: serverTimestamp(),
      userId: user.uid,
    };

    await addDoc(collection(db, "pledges"), newPledge);

    console.log("Pledge added successfully");

    setForm({
      name: "",
      neighborhood: "",
      crop: "",
      space: "",
      harvest: "",
      shareType: "Can share extras",
      notes: "",
    });
  } catch (error) {
    console.error("Add pledge error:", error);
  }
};

  const deletePledge = async (id) => {
    await deleteDoc(doc(db, "pledges", id));
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
            <p className="auth-status">
              {user ? `Grower ID: ${user.uid.slice(0, 8)}...` : "Signing in..."}
            </p>
            <span>{pledges.length} pledge(s)</span>
          </div>

          <div className="pledge-grid">
            {pledges.map((pledge) => (
              <article className="pledge-card" key={pledge.id}>
                <div className="card-top">
                  <span className="crop-icon">🌿</span>
{user && (!pledge.userId || pledge.userId === user.uid) && (
  <button onClick={() => deletePledge(pledge.id)}>×</button>
)}
                </div>

                <h4>{pledge.crop}</h4>
                <p className="location">
                  {pledge.name} · {pledge.neighborhood}
                </p>

                <p className="timestamp">
                  Posted {formatDate(pledge.createdAt)}
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