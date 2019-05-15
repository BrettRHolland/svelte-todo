<script>
  import { fade } from "svelte/transition";

  const ENTER_KEY = 13;
  const ESCAPE_KEY = 27;

  let currentFilter = "all";
  let newTask = "";
  let tempId = 4;
  let tasks = [
    {
      id: 1,
      description: "Schedule appointment",
      completed: false,
      editing: false
    },
    {
      id: 2,
      description: "Send email",
      completed: false,
      editing: false
    },
    {
      id: 3,
      description: "Register for conference",
      completed: false,
      editing: false
    },
    {
      id: 4,
      description: "Pay bill",
      completed: false,
      editing: false
    },
    {
      id: 5,
      description: "Make dinner reservations",
      completed: false,
      editing: false
    }
  ];

  function addTask(event) {
    if (event.which === ENTER_KEY) {
      tasks.push({
        id: tempId,
        description: newTask,
        completed: false,
        editing: false
      });
      tasks = tasks;
      tempId += 1;
      newTask = "";
    }
  }

  function editTask(task) {
    task.editing = true;
    tasks = tasks;
  }

  function finishEdit(task) {
    task.editing = false;
    tasks = tasks;
  }

  function finishEditKeydown(task, event) {
    if (event.which === ENTER_KEY) {
      finishEdit(task);
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
  }

  function selectAllTasks() {
    tasks.forEach(task => (task.completed = true));
    tasks = tasks;
  }

  function updateFilter(filter) {
    currentFilter = filter;
  }

  function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
  }

  $: tasksRemaining = tasks.filter(task => !task.completed).length;

  $: filteredTasks =
    currentFilter === "all"
      ? tasks
      : currentFilter === "completed"
      ? tasks.filter(task => task.completed)
      : tasks.filter(task => !task.completed);
</script>

<style>
  .container {
    margin: 0 auto;
    max-width: 700px;
    padding: 0 20px;
  }

  .header {
    justify-content: center;
    display: flex;
    flex-direction: column;
  }

  .logo {
    color: #191919;
    font-size: 28px;
    letter-spacing: 0.5px;
    margin: 35px auto 10px auto;
    text-transform: uppercase;
    text-align: center;
  }

  .tasks-remaining {
    background-color: #191919;
    border-radius: 2px;
    color: #fff;
    margin: 0 auto 30px auto;
    padding: 10px;
  }

  .tasks-remaining strong {
    font-family: "Berthold Akzidenz Grotesk BE Bold", sans-serif;
  }

  .task-input {
    background-color: #fff;
    border: 3px solid #f5f5f5;
    border-radius: 2px;
    color: #191919;
    font-size: 18px;
    margin: 0 0 6px 0;
    padding: 15px 20px;
  }

  .task-input::placeholder {
    color: #191919;
  }

  .task-input:focus {
    border: 3px solid #191919;
    outline: 0;
  }

  .task {
    align-items: center;
    background-color: #f5f5f5;
    border-radius: 2px;
    display: grid;
    grid-gap: 20px;
    grid-template-columns: auto 1fr auto;
    margin-bottom: 4px;
    padding: 20px 20px;
  }

  .task-description {
    color: #191919;
    padding: 1px 0 0 0;
  }

  .edit-task {
    background-color: #fff;
    border: 0;
    color: #ff7b49;
    font-size: 16px;
    margin: 0;
    outline: 0;
    padding: 10px;
  }

  .edit-task:focus {
    outline: 0;
  }

  .completed {
    color: #b6b6b6;
    text-decoration: line-through;
  }

  .completed-task {
    -webkit-appearance: none;
    background-color: #f5f5f5;
    border: 1px solid #b6b6b6;
    border-radius: 50%;
    cursor: pointer;
    height: 16px;
    margin: 0;
    outline: 0;
    width: 16px;
  }

  .completed-task:checked {
    background-color: #191919;
    border-color: #191919;
  }

  .delete-task {
    color: #b6b6b6;
    cursor: pointer;
    font-family: "Berthold Akzidenz Grotesk BE Bold", sans-serif;
    font-size: 20px;
  }

  .delete-task:hover {
    color: #191919;
  }

  .options {
    align-items: center;
    display: grid;
    grid-gap: 30px;
    grid-template-columns: auto auto auto auto auto;
    justify-content: center;
    margin: 20px 0;
    width: 100%;
  }

  .filter-button {
    background: #fff;
    border-radius: 20px;
    border: 2px solid #fff;
    color: #191919;
    cursor: pointer;
    font-size: 16px;
    padding: 3px 15px;
    outline: 0;
  }

  .filter-button:hover {
    border-color: #f2f6f9;
  }

  .filter-button.active {
    border: 2px solid #191919;
    font-family: "Berthold Akzidenz Grotesk BE Bold", sans-serif;
  }

  .select-all-tasks {
    background: #f5f5f5;
    border: 2px solid #f5f5f5;
    border-radius: 20px;
    color: #b6b6b6;
    cursor: pointer;
    font-size: 16px;
    outline: 0;
    padding: 3px 15px;
  }

  .select-all-tasks:hover {
    border-color: #191919;
    color: #191919;
  }

  .remove-completed-tasks {
    background: #f5f5f5;
    border-radius: 20px;
    border: 2px solid #f5f5f5;
    color: #b6b6b6;
    cursor: pointer;
    font-size: 16px;
    outline: 0;
    padding: 3px 15px;
  }

  .remove-completed-tasks:hover {
    border-color: #191919;
    color: #191919;
  }
</style>

<div class="container">
  <header class="header">
    <h1 class="logo">My Tasks</h1>
    <p class="tasks-remaining">
      <strong>{tasksRemaining}</strong>
      tasks remaining
    </p>
  </header>
  <input
    class="task-input"
    placeholder="Enter a task..."
    bind:value={newTask}
    on:keydown={addTask}
    type="text" />

  <div class="tasks">
    {#each filteredTasks as task}
      <div class="task" transition:fade>

        <input
          type="checkbox"
          class="completed-task"
          bind:checked={task.completed} />

        {#if task.editing}
          <input
            class="edit-task"
            on:blur={() => finishEdit(task)}
            on:keydown={() => finishEditKeydown(task, event)}
            bind:value={task.description}
            autofocus />
        {:else}
          <p
            class={task.completed ? 'task-description completed' : 'task-description'}
            on:dblclick={() => editTask(task)}>
             {task.description}
          </p>
        {/if}
        <div class="delete-task" on:click={() => deleteTask(task.id)}>×</div>
      </div>
    {/each}
  </div>

  <div class="options">
    <button
      class={currentFilter === 'all' ? 'filter-button active' : 'filter-button'}
      on:click={() => updateFilter('all')}>
      All
    </button>
    <button
      class={currentFilter === 'active' ? 'filter-button active' : 'filter-button'}
      on:click={() => updateFilter('active')}>
      Active
    </button>
    <button
      class={currentFilter === 'completed' ? 'filter-button active' : 'filter-button'}
      on:click={() => updateFilter('completed')}>
      Completed
    </button>
    <button class="select-all-tasks" on:click={selectAllTasks}>
      Select all
    </button>
    <button class="remove-completed-tasks" on:click={clearCompletedTasks}>
      Remove completed
    </button>
  </div>

</div>
