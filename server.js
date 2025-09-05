const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let db;

// Initialize DB
(async () => {
  db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE,
      name TEXT,
      phone TEXT,
      route TEXT,
      departure_time TEXT,
      seats TEXT,
      paid INTEGER
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS passengers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT,
      name TEXT,
      seat_label TEXT,
      checked_in INTEGER DEFAULT 0
    );
  `);
})();

// Create booking
app.post("/api/book", async (req, res) => {
  const { name, phone, route, departure_time, seats, passengers } = req.body;
  const bookingId = "BKG-" + Date.now();

  await db.run(
    "INSERT INTO bookings (booking_id, name, phone, route, departure_time, seats, paid) VALUES (?,?,?,?,?,?,0)",
    [bookingId, name, phone, route, departure_time, seats.join(",")]
  );

  for (const p of passengers) {
    await db.run(
      "INSERT INTO passengers (booking_id, name, seat_label, checked_in) VALUES (?,?,?,0)",
      [bookingId, p.name, p.seat_label]
    );
  }

  res.json({ success: true, bookingId });
});

// Get all bookings
app.get("/api/bookings", async (req, res) => {
  const bookings = await db.all("SELECT * FROM bookings ORDER BY id DESC");
  for (let b of bookings) {
    b.passengers = await db.all("SELECT * FROM passengers WHERE booking_id=?", [b.booking_id]);
  }
  res.json(bookings);
});

// Check-in via QR
app.post("/api/checkin", async (req, res) => {
  const { bookingId, seat } = req.body;

  const booking = await db.get("SELECT * FROM bookings WHERE booking_id=?", [bookingId]);
  if (!booking) return res.json({ status: "error", message: "Booking not found" });

  const passenger = await db.get(
    "SELECT * FROM passengers WHERE booking_id=? AND seat_label=?",
    [bookingId, seat]
  );
  if (!passenger) return res.json({ status: "error", message: "Passenger not found" });

  if (passenger.checked_in) {
    return res.json({ status: "duplicate", message: "Ticket already used", passenger });
  }

  await db.run("UPDATE passengers SET checked_in=1 WHERE id=?", [passenger.id]);
  res.json({ status: "success", message: "Passenger checked-in", passenger });
});

// Get passenger manifest
app.get("/api/booking/:bookingId/passengers", async (req, res) => {
  const { bookingId } = req.params;
  const booking = await db.get("SELECT * FROM bookings WHERE booking_id=?", [bookingId]);
  if (!booking) return res.json({ error: "Booking not found" });

  const passengers = await db.all("SELECT * FROM passengers WHERE booking_id=?", [bookingId]);
  res.json({ booking, passengers });
});

// Manual check-in toggle
app.post("/api/booking/:bookingId/passengers/:passengerId/checkin", async (req, res) => {
  const { bookingId, passengerId } = req.params;
  const passenger = await db.get(
    "SELECT * FROM passengers WHERE booking_id=? AND id=?",
    [bookingId, passengerId]
  );
  if (!passenger) return res.json({ error: "Passenger not found" });

  const newStatus = passenger.checked_in ? 0 : 1;
  await db.run("UPDATE passengers SET checked_in=? WHERE id=?", [newStatus, passengerId]);

  res.json({ success: true, newStatus });
});

app.listen(PORT, () => {
  console.log(`🚍 CNG Bus Booking server running at http://localhost:${PORT}`);
});

