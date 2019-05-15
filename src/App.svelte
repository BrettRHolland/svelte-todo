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

  .logo {
    color: #565662;
    font-size: 32px;
    letter-spacing: -2px;
    margin: 30px 0;
  }

  .task-input {
    background-color: #565662;
    border: 3px solid #565662;
    color: #fff;
    font-size: 18px;
    margin: 0 0 6px 0;
    padding: 18px 20px;
  }

  .task-input::placeholder {
    color: #f2f6f9;
  }

  .task-input:focus {
    border: 3px solid #ffcab6;
    outline: 0;
  }

  .task {
    align-items: center;
    background-color: #f2f6f9;
    display: grid;
    grid-gap: 20px;
    grid-template-columns: auto 1fr auto;
    margin-bottom: 2px;
    padding: 25px 20px;
  }

  .task-description {
    color: #565662;
    font-size: 18px;
    padding: 2px 0 0 0;
  }

  .edit-task {
    background-color: #ffcab6;
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
    color: #aaaabc;
    text-decoration: line-through;
  }

  .completed-task {
    -webkit-appearance: none;
    background-color: #f2f6f9;
    border-radius: 50%;
    border: 2px solid #565662;
    cursor: pointer;
    height: 19px;
    margin: 0;
    outline: 0;
    width: 19px;
  }

  .completed-task:checked {
    background-color: #565662;
  }

  .delete-task {
    color: #8b8c95;
    cursor: pointer;
    font-size: 20px;
  }

  .delete-task:hover {
    color: #e45766;
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
    color: #565662;
    cursor: pointer;
    font-size: 16px;
    padding: 3px 15px;
  }

  .filter-button:hover {
    border-color: #f2f6f9;
  }

  .filter-button.active {
    border: 2px solid #565662;
  }

  .select-all-tasks {
    background: #ffcab6;
    border: 2px solid #ffcab6;
    border-radius: 20px;
    color: #ff7b49;
    cursor: pointer;
    font-size: 16px;
    padding: 3px 15px;
  }

  .select-all-tasks:hover {
    border-color: #ff7b49;
  }

  .remove-completed-tasks {
    background: #f4bcc2;
    border-radius: 20px;
    border: 2px solid #f4bcc2;
    color: #e45766;
    cursor: pointer;
    font-size: 16px;
    padding: 3px 15px;
  }

  .remove-completed-tasks:hover {
    border-color: #e45766;
  }

  .tasks-remaining {
    background-color: #f2f6f9;
    color: #4fb5b8;
    display: inline-block;
    font-size: 16px;
    padding: 10px;
  }
</style>

<div class="container">
  <h1 class="logo">my tasks</h1>
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

  <p class="tasks-remaining">{tasksRemaining} tasks remaining</p>

</div>
