import express from "express";
import cors from "cors";
import client from "prom-client";

const app = express();
app.use(cors()); // Allows frontend to fetch data

// Enable default Prometheus system metrics (CPU, Memory, etc.)
client.collectDefaultMetrics();

// Create a histogram to track API response times
const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5]
});

// Middleware to track API response time
app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
        end({ method: req.method, route: req.url, status: res.statusCode });
    });
    next();
});

// Expose Prometheus metrics at /metrics
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});

// Basic CPU Load Test
app.get("/heavy-task", (req, res) => {
    let sum = 0;
    for (let i = 0; i < 1e7; i++) {
        sum += Math.sqrt(i);
    }
    res.send({ message: "Heavy task completed", sum });
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));
