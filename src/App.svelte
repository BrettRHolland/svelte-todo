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

  function selectAllTasks(event) {
    tasks.forEach(task => (task.completed = event.target.checked));
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
    max-width: 500px;
    padding: 0 20px;
  }

  .task {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: 20px;
  }

  .completed {
    text-decoration: line-through;
  }

  .completed-task {
    -webkit-appearance: none;
    background-color: white;
    border-radius: 50%;
    border: 1px solid gray;
    height: 18px;
    outline: 0;
    width: 18px;
  }

  .completed-task:checked {
    background-color: green;
  }

  .filter-button {
    background: white;
  }

  .filter-button.active {
    background: red;
  }
</style>

<div class="container">
  <h1>to-do list</h1>
  <input
    class="task-input"
    placeholder="Enter a task"
    bind:value={newTask}
    on:keydown={addTask} />

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

  <div class="all-tasks">
    <input type="checkbox" on:change={selectAllTasks} />
    Select all tasks
    <p>{tasksRemaining} items left</p>
  </div>

  <div class="filter-tasks">
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
  </div>

  <button on:click={clearCompletedTasks}>Clear completed tasks</button>
</div>
