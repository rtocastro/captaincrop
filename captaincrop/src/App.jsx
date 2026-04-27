import { useEffect, useState } from "react";
import "./App.css";
import captainCropLogo from "./assets/logo.png";

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
  getDocs,
  where,
  setDoc
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

  const [filters, setFilters] = useState({
    search: "",
    zip: "",
    shareType: "",
  });

  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  const [myInterests, setMyInterests] = useState({});
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "interests"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach((d) => {
        const data = d.data();
        map[data.pledgeId] = true;
      });
      setMyInterests(map);
    });

    return () => unsub();
  }, [user]);


  const [interestCounts, setInterestCounts] = useState({});

  const handleInterest = async (pledge, type) => {
    if (!user) {
      showToast("Still signing in — try again in a second");
      return;
    }

    try {
      const q = query(
        collection(db, "interests"),
        where("pledgeId", "==", pledge.id),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        showToast("You already expressed interest 🌱");
        return;
      }

      const id = `${pledge.id}_${user.uid}`;
      await setDoc(doc(db, "interests", id), {
        pledgeId: pledge.id,
        userId: user.uid,
        zip: pledge.zip || "",
        type,
        createdAt: serverTimestamp(),
      });

      showToast("Interest sent 🌱");
    } catch (error) {
      console.error("Interest error:", error);
      showToast("Could not send interest");
    }
  };

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "interests"), (snapshot) => {
      const counts = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        counts[data.pledgeId] = (counts[data.pledgeId] || 0) + 1;
      });

      setInterestCounts(counts);
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

  const filteredPledges = pledges.filter((pledge) => {
    const matchesSearch =
      !filters.search ||
      pledge.crop?.toLowerCase().includes(filters.search.toLowerCase()) ||
      pledge.notes?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesZip = !filters.zip || pledge.zip === filters.zip;

    const matchesShareType =
      !filters.shareType || pledge.shareType === filters.shareType;

    return matchesSearch && matchesZip && matchesShareType;
  });

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">The Fruitbat Org presents</p>
        <img
          src={captainCropLogo}
          alt="Captain Crop"
          className="hero-logo"
        />
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
          <MapView pledges={filteredPledges} />

          <section className="filter-card">
            <h3>Find Crops 🔍</h3>

            <div className="filters">
              <input
                placeholder="Search crop or notes"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />

              <input
                placeholder="Filter by ZIP"
                value={filters.zip}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, zip: e.target.value }))
                }
              />

              <select
                value={filters.shareType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, shareType: e.target.value }))
                }
              >
                <option value="">All share types</option>
                <option>Can share extras</option>
                <option>Wants to trade</option>
                <option>Needs help growing</option>
                <option>Just learning</option>
              </select>
              <br />

              <button
                type="button"
                onClick={() => setFilters((p) => ({ ...p, zip: form.zip || "" }))}
              >
                Near me 📍
              </button>
              <button
                type="button"
                onClick={() => setFilters({ search: "", zip: "", shareType: "" })}
              >
                Clear
              </button>
            </div>
          </section>

          <section className="board">
            <div className="board-header">
              <h3>Harvest Shares</h3>
              <p className="auth-status">
                {user
                  ? `Grower ID: ${user.uid.slice(0, 8)}...`
                  : "Signing in..."}
              </p>
              <span>{filteredPledges.length} result(s)</span>
            </div>

            {filteredPledges.length === 0 && (
              <p style={{ marginTop: "1rem", opacity: 0.7 }}>
                No matches found 🌱 try adjusting your filters
              </p>
            )}

            <div className="pledge-grid">
              {filteredPledges.map((pledge) => (
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
                  {myInterests[pledge.id] ? (
                    <div className="interest-done">Interested ✔</div>
                  ) : (
                    <div className="interest-box">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleInterest(pledge, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="" disabled>
                          I’m interested 🌱
                        </option>
                        <option>Trade</option>
                        <option>Help grow</option>
                        <option>Interested in extras</option>
                        <option>Same ZIP grow buddy</option>
                      </select>
                    </div>)}


                  <p>Posted {formatDate(pledge.createdAt)}</p>

                  <div className="tags">
                    {pledge.space && <span>{pledge.space}</span>}
                    {pledge.harvest && <span>{pledge.harvest}</span>}
                    {pledge.shareType && <span>{pledge.shareType}</span>}
                  </div>
                  {interestCounts[pledge.id] > 0 && (
                    <p className="interest-count">
                      🌱 {interestCounts[pledge.id]} interested
                    </p>
                  )}

                  {filters.search && <span>🔍 {filters.search}</span>}
                  {filters.zip && <span>📍 {filters.zip}</span>}
                  {filters.shareType && <span>🌿 {filters.shareType}</span>}

                  {pledge.notes && <p className="notes">{pledge.notes}</p>}


                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
      {toast && <div className="toast">{toast}</div>}
      <footer className="footer">
        ZIP-level locations only • no exact addresses • built by{" "}
        <a href="mailto:ricktorrescastro@gmail.com">Ricardo Torres</a>
        {" "}|| The Fruitbat Org 🦇
      </footer>
    </main>

  );
}

export default App;