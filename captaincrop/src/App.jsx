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
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";
import MapView from "./MapView";

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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [form, setForm] = useState({
    name: "",
    zip: "",
    crop: "",
    space: "",
    harvest: "",
    shareType: "Can share extras",
    notes: "",
  });

  

  // 🔐 AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const result = await signInAnonymously(auth);
          setUser(result.user);
        } catch (error) {
          console.error("Auth error:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔄 FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "pledges"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPledges(data);
    });

    return () => unsubscribe();
  }, []);

  // ✏️ EDIT
  const startEdit = (pledge) => {
    setEditingId(pledge.id);
    setEditForm({
      name: pledge.name || "",
      neighborhood: pledge.neighborhood || "",
      crop: pledge.crop || "",
      space: pledge.space || "",
      harvest: pledge.harvest || "",
      shareType: pledge.shareType || "",
      notes: pledge.notes || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (id) => {
    try {
      await updateDoc(doc(db, "pledges", id), {
        ...editForm,
      });
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  // ➕ CREATE
  const addPledge = async (event) => {
    event.preventDefault();

    if (!form.name || !form.crop || !form.zip) return;
    if (!user) return;

    try {
      await addDoc(collection(db, "pledges"), {
        ...form,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      setForm({
        name: "",
        zip: "",
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

  // ❌ DELETE
  const deletePledge = async (id) => {
    await deleteDoc(doc(db, "pledges", id));
  };

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">The Fruitbat Org presents</p>
        <h1>Captain Crop</h1>
        <h2>Let us plant! Lettuce Share 🍉</h2>
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
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            name="zip"
            placeholder="ZIP code"
            value={form.zip || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, zip: e.target.value }))
            }
          />

          <input
            name="crop"
            placeholder="What are you growing?"
            value={form.crop}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, crop: e.target.value }))
            }
          />

          <select
            name="space"
            value={form.space}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, space: e.target.value }))
            }
          >
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
            onChange={(e) =>
              setForm((prev) => ({ ...prev, harvest: e.target.value }))
            }
          />

          <select
            name="shareType"
            value={form.shareType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, shareType: e.target.value }))
            }
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
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />

          <button type="submit">Plant the Pledge</button>
        </form>

        <div className="content-column">
          <MapView pledges={pledges} />

          <section className="board">
            <div className="board-header">
              <h3>Harvest Shares</h3>
              <p className="auth-status">
                {user
                  ? `Grower ID: ${user.uid.slice(0, 8)}...`
                  : "Signing in..."}
              </p>
            </div>

            <div className="pledge-grid">
              {pledges.map((pledge) => (
                <article className="pledge-card" key={pledge.id}>
                  <div className="card-top">
                    <span>🌿</span>

                    {user &&
                      (!pledge.userId || pledge.userId === user.uid) && (
                        <>
                          <button onClick={() => startEdit(pledge)}>✏️</button>
                          <button onClick={() => deletePledge(pledge.id)}>
                            ×
                          </button>
                        </>
                      )}
                  </div>

                  {editingId === pledge.id ? (
                    <>
                      <div className="edit-inline">
                        <input
                          name="crop"
                          value={editForm.crop || ""}
                          onChange={handleEditChange}
                          placeholder="Crop"
                        />

                        <input
                          name="zip"
                          value={editForm.zip || ""}
                          onChange={handleEditChange}
                          placeholder="ZIP Code"
                        />
                      </div>

                      <div className="edit-actions">
                        <button type="button" onClick={() => saveEdit(pledge.id)}>
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4>{pledge.crop}</h4>
                      <p>
                        {pledge.name} · ZIP {pledge.zip}
                      </p>
                    </>
                  )}

                  <p>Posted {formatDate(pledge.createdAt)}</p>

                  <div className="tags">
                    {pledge.space && <span>{pledge.space}</span>}
                    {pledge.harvest && <span>{pledge.harvest}</span>}
                    {pledge.shareType && <span>{pledge.shareType}</span>}
                  </div>

                  {pledge.notes && <p className="notes">{pledge.notes}</p>}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;