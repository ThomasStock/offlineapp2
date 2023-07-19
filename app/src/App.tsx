import { CircularProgress } from "@mui/material";
import { onlineManager, useIsFetching, useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface Task {
  id: number;
  label: string;
}

const useCompleteTask = () => {
  const { mutate: completeTask } = useTaskMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:4000/tasks/${id}/complete`);
      return await response.json();
    },
    getOptimisticUpdateData: (id) => (tasks) => tasks?.filter((_) => _.id !== id),
  });
  return { completeTask };
};

const useCreateTask = () => {
  const { mutate: createTask } = useTaskMutation<void>({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:4000/tasks/create/`, {
        method: "POST",
      });
      return await response.json();
    },
    getOptimisticUpdateData: () => (tasks) => [...(tasks ?? []), { placeholder: true } as unknown as Task],
  });
  return { createTask };
};

const useTaskMutation = <T extends unknown>({
  mutationFn,
  getOptimisticUpdateData,
}: {
  mutationFn: (t: T) => Promise<Task[]>;
  getOptimisticUpdateData: (t: T) => (tasks: Task[] | undefined) => Task[] | undefined;
}) => {
  const queryClient = useQueryClient();

  return useMutation<Task[], unknown, T>({
    mutationKey: ["tasks", "mutation"],
    mutationFn,
    onMutate: async (args: T) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      queryClient.setQueryData<Task[]>(["tasks"], getOptimisticUpdateData(args));
    },
    onError: () => {
      queryClient.invalidateQueries(["tasks"]);
    },
    onSuccess: (data: Task[]) => {
      const hasOtherMutations = queryClient.isMutating({ mutationKey: ["tasks"] }) > 1;
      if (!hasOtherMutations) {
        queryClient.setQueryData(["tasks"], data);
      }
    },
  });
};

function App() {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());

  const mutates = useIsMutating();
  const fetches = useIsFetching();

  useEffect(() => {
    return onlineManager.subscribe(() => setIsOnline(onlineManager.isOnline()));
  }, []);

  const { data, isInitialLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async ({ signal }) => (await fetch("http://localhost:4000/tasks", { signal })).json(),
    enabled: !mutates,
  });

  const { completeTask } = useCompleteTask();

  const { createTask } = useCreateTask();

  const showSpinner = mutates + fetches > 0 && isOnline;

  return (
    <div className="m-10 p-10 max-w-xl bg-cyan-100 flex flex-col">
      <div className="font-mono mb-8 self-end text-sm flex">
        {isOnline ? "online" : "offline"}
        {mutates ? ` (${mutates} pending)` : ""}
        <CircularProgress className="align-middle -mr-6 ml-2" size={"1.2em"} style={{ opacity: showSpinner ? undefined : 0 }} />
      </div>
      <div className="flex mb-4">
        <h1 className="text-2xl grow">Tasks</h1>
        <button className="text-cyan-600 place-self-end" onClick={() => createTask()}>
          Create new task
        </button>
      </div>
      {isInitialLoading ? (
        <div>Loading...</div>
      ) : data ? (
        data.length ? (
          <ul className="flex flex-col">
            {data.map((task, i) =>
              (task as unknown as { placeholder: true }).placeholder ? (
                <li className="mb-2 flex" key={-i}>
                  <i>Task being created...</i>
                </li>
              ) : (
                <li className="mb-2 flex" key={task.id}>
                  <span className="grow">{task.label}</span>
                  <button className="text-cyan-600 place-self-end" onClick={() => completeTask(task.id)}>
                    Complete
                  </button>
                </li>
              )
            )}
          </ul>
        ) : (
          <div>No tasks left!</div>
        )
      ) : null}
    </div>
  );
}

export default App;
