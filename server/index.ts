import express from "express";
import cors from "cors";

const app = express();
const port = 4000;

app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-cache, no-transform");
  next();
});

interface Task {
  id: number;
  label: string;
}

let tasks: Task[] = [
  {
    id: 1,
    label: "Take photo of truck #1"
  },
  {
    id: 2,
    label: "Scan barcode of truck #2"
  }
];

const getTasks = () => tasks;

let nextid = 10;
const generateId = () => nextid++;

app.get("/", (_, res) => {
  res.send("Hello World!!!!");
});

app.get("/tasks", (_, res) => {
  setTimeout(() => {
    return res.json(getTasks());
  }, 3000);
});

app.get("/tasks/:id/complete", (req, res) => {
  const id = req.params.id;
  tasks = tasks.filter((_) => _.id.toString() != id);
  console.log(tasks);
  res.json(tasks);
});

app.post("/tasks/create", (req, res) => {
  const id = generateId();
  tasks = [
    ...tasks,
    {
      id: generateId(),
      label: "New task " + id
    }
  ];
  console.log(tasks);
  setTimeout(() => {
    res.json(tasks);
  }, 2000);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
