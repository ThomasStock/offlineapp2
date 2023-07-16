import { CircularProgress } from "@mui/material";
import {
  onlineManager,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface Task {
  id: number;
  label: string;
}

function App() {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  useEffect(() => {
    return onlineManager.subscribe(() => {
      setIsOnline(onlineManager.isOnline());
      queryClient.resumePausedMutations();
    });
  }, []);

  const { data, isInitialLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async ({ signal }) => {
      const response = await fetch("http://localhost:4000/tasks", {
        signal
      });
      return response.json();
    }
  });

  const queryClient = useQueryClient();
  const mutates = useIsMutating();
  const fetches = useIsFetching();

  const { mutateAsync: completeTask } = useMutation({
    mutationFn: (id: number) => {
      return fetch(`http://localhost:4000/tasks/${id}/complete`);
    },
    onMutate: () => {
      queryClient.cancelQueries(["tasks"]);
    },
    onSuccess: () => {
      console.log("onsucces");
      queryClient.cancelQueries(["tasks"]);
      queryClient.invalidateQueries(["tasks"]);
    }
  });

  const { mutate: createTask } = useMutation({
    mutationFn: () => {
      console.log("creating!");
      return fetch(`http://localhost:4000/tasks/create/`, { method: "POST" });
    },
    onMutate: () => {
      // queryClient.cancelQueries(["tasks"]);
    },
    onSuccess: () => {
      console.log("onsucces");
      // queryClient.cancelQueries(["tasks"]);
      // queryClient.invalidateQueries(["tasks"]);
    }
  });

  const showSpinner = mutates + fetches > 0 && isOnline;

  return (
    <div className="m-10 p-10 max-w-xl bg-cyan-100 flex flex-col">
      <div className="font-mono mb-8 self-end text-sm flex">
        {isOnline
          ? "online"
          : `offline${mutates ? ` (${mutates} pending)` : ""}`}
        <CircularProgress
          className="align-middle -mr-6 ml-2"
          size={"1.2em"}
          style={{ opacity: showSpinner ? undefined : 0 }}
        />
      </div>
      <div className="flex mb-4">
        <h1 className="text-2xl grow">Tasks</h1>
        <button
          className="text-cyan-600 place-self-end"
          onClick={() => createTask()}
        >
          Create new task
        </button>
      </div>
      {isInitialLoading ? (
        <div>Loading...</div>
      ) : data ? (
        data.length ? (
          <ul className="flex flex-col">
            {data.map((task) => (
              <li className="mb-2 flex" key={task.id}>
                <span className="grow">{task.label}</span>
                <button
                  className="text-cyan-600 place-self-end"
                  onClick={() => completeTask(task.id)}
                >
                  Complete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div>No tasks left!</div>
        )
      ) : null}
    </div>
  );
}

export default App;
